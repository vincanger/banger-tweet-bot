import { MultiPromptChain } from 'langchain/chains';
import { ChatOpenAI } from 'langchain/chat_models/openai';
import { LLMChain, SequentialChain } from 'langchain/chains';
import { PromptTemplate } from 'langchain/prompts';
import { PineconeStore } from 'langchain/vectorstores/pinecone';
import { OpenAIEmbeddings } from 'langchain/embeddings/openai';
import { PineconeClient } from '@pinecone-database/pinecone';
import type { Document } from 'langchain/document'
export type { Vector } from '@pinecone-database/pinecone';

const pinecone = new PineconeClient();
export const initPinecone = async () => {
  await pinecone.init({
    environment: process.env.PINECONE_ENV!,
    apiKey: process.env.PINECONE_API_KEY!,
  });
  return pinecone;
};

const embeddings = new OpenAIEmbeddings({
  openAIApiKey: process.env.OPENAI_API_KEY,
});

/**
 * 
 * Generate Drafts and Ideas (big boy chain used in the cron job "generateReplyDrafts")
 * It first extracts topics and style from the example tweet, then uses those to search
 * the vector store for similar notes. Then new tweet ideas are generated from those notes,
 * and finally a tweet is generated from the new tweet ideas.
 */
export const generateDrafts = async (exampleTweet: string, username: string) => {
  try {
    // remove quotes and curly braces as not to confuse langchain template parser
    exampleTweet = exampleTweet.replace(/"/g, '');
    exampleTweet = exampleTweet.replace(/{/g, '');
    exampleTweet = exampleTweet.replace(/}/g, '');

    console.log('exampleTweet [][][][][][][][][][', exampleTweet);

    const pinecone = await initPinecone();

    console.log('list indexes', await pinecone.listIndexes());

    // check to make sure index exists in vector DB, if not create it
    if (!(await pinecone.listIndexes()).includes('embeds-test')) {
      console.log('creating index');
      await pinecone.createIndex({
        createRequest: {
          name: 'embeds-test',
          dimension: 1536,
        },
      });
    }
    const pineconeIndex = pinecone.Index('embeds-test');

    const vectorStore = new PineconeStore(embeddings, {
      pineconeIndex: pineconeIndex,
      namespace: username,
    });

    //
    // multi prompt chain begin --- >
    //

    const multiPromptLlm = new ChatOpenAI({
      openAIApiKey: process.env.OPENAI_API_KEY,
      temperature: 0,
      modelName: 'gpt-3.5-turbo',
    });
    const promptNames = ['style', 'topics'];
    const promptDescriptions = [
      'Good for extractiong the style and tone of a tweet',
      'Good for extractiong the topics within a tweet',
    ];
    const stylePrompt = `You are a tweet style extractor. Given a tweet, it is your job to return a description of the style of the tweet with regards to its tone, grammar, and punctuation.

  Tweet: {input}
  
  Style Guide:`;

    const styleTemplate = new PromptTemplate({
      template: stylePrompt,
      inputVariables: ['input'],
    });

    const topicPrompt = `You are a tweet topic extractor. Given a tweet, it is your job to return a description of the topics present in the tweet.

  Tweet: {input}

  Topic Guide:`;

    const topicTemplate = new PromptTemplate({
      template: topicPrompt,
      inputVariables: ['input'],
    });

    const promptTemplates = [styleTemplate, topicTemplate];

    console.log('before multi prompt chain call');
    const multiPromptChain = MultiPromptChain.fromLLMAndPrompts(multiPromptLlm, {
      promptNames,
      promptDescriptions,
      promptTemplates,
    });
    console.log('style promise', exampleTweet);
    const stylePromise = multiPromptChain.call({
      input: exampleTweet,
    });

    const topicPromise = multiPromptChain.call({
      input: exampleTweet,
    });

    const [{ text: styleGuide }, { text: topicGuide }] = await Promise.all([stylePromise, topicPromise]);

    console.log('after multi prompt chain call');
    //
    // < --- multi prompt chain end
    //

    //
    // sequential tweet chain begin --- >
    //
    /**
     * vector store results for notes similar to the original tweet
     */
    let searchRes: [Document<Record<string, any>>, number][] = [];
    try {
      const similaritySearchRes = await vectorStore.similaritySearchWithScore(topicGuide, 2);
      console.log('similaritySearchRes', similaritySearchRes);
      if (similaritySearchRes.length > 0) {
        searchRes = similaritySearchRes
      }
    } catch (error:any) {
      console.log('error with similarity search: ', error)
    }

    console.log('searchRes: ', searchRes)
    const notes = searchRes
      .filter(res => res[0].pageContent.length >= 3)
      .filter(res => res[1] > 0.8)
      .map(res => res[0].pageContent)
      .join(' ');

    console.log('\n\nsimilarity search results [][][--0->', notes);

    const ideaLlm = new ChatOpenAI({
      openAIApiKey: process.env.OPENAI_API_KEY,
      temperature: 0.9,
      modelName: 'gpt-3.5-turbo',
    });

    const newIdeasTemplate = `You are an expert brainstormer. You will be given a user's notes, and a style guide. Your goal is to use this information to brainstorm interesting, sometimes different ideas. 

    Notes: {topicGuide}. ${notes}
    
    Style Guide: {styleGuide}

    Ideas Brainstorm: 
    -`;

    const newIdeasPrompt = new PromptTemplate({
      template: newIdeasTemplate,
      inputVariables: ['styleGuide', 'topicGuide'],
    });

    const ideaChain = new LLMChain({
      llm: ideaLlm,
      prompt: newIdeasPrompt,
      outputKey: 'newTweetIdeas',
    });

    const viralIdeaTemplate = `You are an expert tweet generator assistant. You will be given a list of ideas and it is your job to choose the one that is most likely to go viral. Simply reply with the idea you have chosen without editing it or adding your own ideas.
  
    Ideas: {newTweetIdeas}
    
    Idea most likely to go viral:`;

    const viralIdeaLlm = new ChatOpenAI({
      openAIApiKey: process.env.OPENAI_API_KEY,
      temperature: 0.4,
      modelName: 'gpt-3.5-turbo-0613',
    });

    const viralIdeaPropmt = new PromptTemplate({
      template: viralIdeaTemplate,
      inputVariables: ['newTweetIdeas'],
    });

    const viralIdeaChain = new LLMChain({
      llm: viralIdeaLlm,
      prompt: viralIdeaPropmt,
      outputKey: 'viralIdea',
    });

    const draftTweetTemplate = `You are an expert tweet generator assistant. You will be given an idea, and you will follow these steps in order to create a tweet from it:
    1. Do not advertise or announce a product or service. This is not an advertisement!
    2. Be biased towards presenting ideas and opinions.
    3. Do not use hashtags.
    4. Do not use emojis.
    5. Opinions and hypotheses should have just as much value as facts.
    6. Do not be afraid to be honest or controversial.
    7. Do not be afraid to be funny :)
    8. Do not tell a story about fictional characters or events.
    
    Idea: {viralIdea}

    Tweet:`;

    const draftTweetLlm = new ChatOpenAI({
      openAIApiKey: process.env.OPENAI_API_KEY,
      temperature: 0.8,
      modelName: 'gpt-3.5-turbo-0613',
    });

    const draftTweetPrompt = new PromptTemplate({
      template: draftTweetTemplate,
      inputVariables: ['viralIdea'],
    });

    const draftTweetChain = new LLMChain({
      llm: draftTweetLlm,
      prompt: draftTweetPrompt,
      outputKey: 'tweetDraft',
    });

    const revisedTweetTemplate = `You are an expert tweet editor. You will be given a tweet, and it is your job to evaluate it and, if necesssary, propose a revision based on these rules:
    1. The revision should not contain any hashtags or emojis.
    2. The tweet should not market a product or service. This is not an advertisement!
    3. The tweet should be written using the style guide as a loose guide for the tone, grammar, and punctuation of the tweet.
    4. If you think the tweet does not need to be revised, simply reply with the original tweet.
    5. The tweet should not be longer than 280 characters.

    Style Guide: ${styleGuide}

    Tweet: {tweetDraft}

    Revised Tweet:`;

    const revisedTweetLlm = new ChatOpenAI({
      openAIApiKey: process.env.OPENAI_API_KEY,
      temperature: 0.7,
      modelName: 'gpt-3.5-turbo-0613',
    });
    
    const revisedTweetPrompt = new PromptTemplate({
      template: revisedTweetTemplate,
      inputVariables: ['tweetDraft'],
    });

    const revisedTweetChain = new LLMChain({
      llm: revisedTweetLlm,
      prompt: revisedTweetPrompt,
      outputKey: 'revisedTweet',
    });

    const overallChain = new SequentialChain({
      chains: [ideaChain, viralIdeaChain, draftTweetChain, revisedTweetChain],
      inputVariables: ['styleGuide', 'topicGuide', 'exampleTweet'],
      outputVariables: ['newTweetIdeas', 'viralIdea', 'tweetDraft', 'revisedTweet'],
      verbose: false,
    });

    type ChainDraftResponse = {
      newTweetIdeas: string;
      revisedTweet: string;
      notes: string;
    };

    const res1 = (await overallChain.call({
      styleGuide,
      topicGuide,
      exampleTweet,
    })) 

    console.log('RESULT FROM OVERALL CHAIN >> ', res1 )

    return {
      ...res1,
      notes,
    } as ChainDraftResponse;
  } catch (error:any) {
    throw new Error(error);
  }
};

// _)_)_)_)_)_)_)_)_)_)_)
// _)_)_)_)_)_)_)_)_)_)_)

/**
 * 
 * used to generate a new tweet draft/idea from an existing generated idea via the UI
 */
export const generateTweetFromIdea = async ( {idea, prompt, exampleTweet, proposedStyle}: {idea: string, prompt: string, exampleTweet?: string, proposedStyle?: string} ) => {
  try {
    console.log('generateTweetFromIdea', idea, prompt, exampleTweet);
    const stlyeLlm = new ChatOpenAI({
      openAIApiKey: process.env.OPENAI_API_KEY,
      temperature: 0,
      modelName: 'gpt-3.5-turbo',
    });

    let styleTemplate;

    if (proposedStyle) {
      console.log('proposedStyle >>>> ', proposedStyle);

      styleTemplate = `You are an expert tweet style suggester. Given a proposed style, extrapolate a style guide for the tone, grammar, and punctuation of a tweet.

    Proposed Style:{example}

    Style Guide:`;
    } else {
      styleTemplate = `You are a tweet style extractor. Given a tweet, it is your job to return a description of the style of the tweet with regards to its tone, grammar, and punctuation.
  
    Tweet: {example}
    
    Style Guide:`;
    }

    const stylePrompt = new PromptTemplate({
      template: styleTemplate,
      inputVariables: ['example'],
    });

    const styleChain = new LLMChain({
      llm: stlyeLlm,
      prompt: stylePrompt,
      outputKey: 'styleGuide',
    });

    const tweetTemplate = `You are an expert tweet generator assistant. You will be given an idea, a prompt, and a style guide, and you will follow these steps in order to write a quality tweet:
    1. Do not write a tweet about a product or service. This is not an advertisement.
    2. Focus on the idea more than the person.
    3. Do not use hashtags.
    4. Do not use emojis.
    5. Opinions and hypotheses should have just as much value as facts.
    6. Further follow the instructions within the prompt.
    7. Use the style guide as a loose guide for the tone, grammar, and punctuation of the tweet.
    
    Tweet Idea: ${idea}

    Prompt:${prompt}

    Style Guide: {styleGuide}

    Tweet:`;


    const tweetLlm = new ChatOpenAI({
      openAIApiKey: process.env.OPENAI_API_KEY,
      temperature: 1.0,
      modelName: 'gpt-3.5-turbo',
    });

    const tweetPrompt = new PromptTemplate({
      template: tweetTemplate,
      inputVariables: ['styleGuide'],
    });

    const tweetChain = new LLMChain({
      llm: tweetLlm,
      prompt: tweetPrompt,
      outputKey: 'newTweet',
    });

    const overallChain = new SequentialChain({
      chains: [styleChain, tweetChain],
      inputVariables: ['example'],
      outputVariables: ['styleGuide', 'newTweet'],
      verbose: false,
    });

    const result = await overallChain.call({
      example: proposedStyle || exampleTweet,
    });
    console.log('tweet result', result);
    return result;
  } catch (error:any) {
    throw new Error(error);
  }
};
