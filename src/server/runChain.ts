import { MultiPromptChain } from 'langchain/chains';
import { ChatOpenAI } from 'langchain/chat_models/openai';
import { LLMChain, SequentialChain } from 'langchain/chains';
import { PromptTemplate } from 'langchain/prompts';
import { PineconeStore } from 'langchain/vectorstores/pinecone';
import { OpenAIEmbeddings } from 'langchain/embeddings/openai';
import { PineconeClient } from '@pinecone-database/pinecone';
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

export const generateDrafts = async (exampleTweet: string, username: string) => {
  // remove quotes and curly braces as not to confuse langchain template parser
  exampleTweet = exampleTweet.replace(/"/g, '');
  exampleTweet = exampleTweet.replace(/{/g, '');
  exampleTweet = exampleTweet.replace(/}/g, '');

  console.log('exampleTweet [][][][][][][][][][', exampleTweet);

  const pinecone = await initPinecone();

  console.log('list indexes', await pinecone.listIndexes());

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

  const searchRes = await vectorStore.similaritySearch(topicGuide, 2);
  // searchRes[0].pageContent;
  // loop through searchRes and concatenate all pageContent into a single string
  const notes = searchRes.map((res) => res.pageContent).join(' ');
  console.log('\n\nsimilarity search results [][][--0->', notes);

  const tweetLlm = new ChatOpenAI({
    openAIApiKey: process.env.OPENAI_API_KEY,
    temperature: 0.7,
    modelName: 'gpt-3.5-turbo',
  });

  const tweetTemplate = `You are an expert controversial idea generator. You will be given a user's notes, and a style guide. Your goal is to use this information to brainstorm new ideas. 

  Style Guide: {styleGuide}

  Notes: {topicGuide}. ${notes}

  Ideas Brainstorm: 
  -`;

  const tweetPromptTemplate = new PromptTemplate({
    template: tweetTemplate,
    inputVariables: ['styleGuide', 'topicGuide'],
  });

  const tweetChain = new LLMChain({
    llm: tweetLlm,
    prompt: tweetPromptTemplate,
    outputKey: 'newTweetIdeas',
  });

  const unhingedTweetTemplate = `You are an expert tweet generator. You will be given some tweet ideas and your goal is to choose the one with the most thought-provoking stance and write a tweet based on it. Structure the tweet using the tone, grammar, and syntax outlined in the style guide.
  
  Tweet Ideas: {newTweetIdeas}

  Style Guide: ${styleGuide}
  
  Controversial Tweet:`;

  const unhingedTweetLlm = new ChatOpenAI({
    openAIApiKey: process.env.OPENAI_API_KEY,
    temperature: 0.9,
    modelName: 'gpt-3.5-turbo',
  });

  const unhingedTweetPrompt = new PromptTemplate({
    template: unhingedTweetTemplate,
    inputVariables: ['newTweetIdeas'],
  });

  const unhingedTweetChain = new LLMChain({
    llm: unhingedTweetLlm,
    prompt: unhingedTweetPrompt,
    outputKey: 'unhingedTweet',
  });

  const overallChain = new SequentialChain({
    chains: [tweetChain, unhingedTweetChain],
    inputVariables: ['styleGuide', 'topicGuide', 'exampleTweet'],
    outputVariables: ['newTweetIdeas', 'unhingedTweet'],
    verbose: false,
  });

  type ChainDraftResponse = {
    newTweetIdeas: string;
    unhingedTweet: string;
    notes: string;
  };

  const res1 = (await overallChain.call({
    styleGuide,
    topicGuide,
    exampleTweet,
  })) as ChainDraftResponse;

  return {
    ...res1,
    notes,
  };
};

// adsfkja;lsdkfj _)_)_)_)_)_)_)_)_)_)_)
// adsfkja;lsdkfj _)_)_)_)_)_)_)_)_)_)_)
// adsfkja;lsdkfj _)_)_)_)_)_)_)_)_)_)_)
// adsfkja;lsdkfj _)_)_)_)_)_)_)_)_)_)_)

export const generateDraftFromPrompt = async (prompt: string, username: string) => {
  const pinecone = await initPinecone();

  const pineconeIndex = pinecone.Index('embeds-test');

  const vectorStore = new PineconeStore(embeddings, {
    pineconeIndex: pineconeIndex,
    namespace: username,
  });

  const searchRes = await vectorStore.similaritySearch(prompt, 2);
  // searchRes[0].pageContent;
  // loop through searchRes and concatenate all pageContent into a single string
  const notes = searchRes.map((res) => res.pageContent).join(' ');
  console.log('\n\nsimilarity search results [][][--0->', notes);

  const tweetLlm = new ChatOpenAI({
    openAIApiKey: process.env.OPENAI_API_KEY,
    temperature: 0.7,
    modelName: 'gpt-3.5-turbo',
  });

  const tweetTemplate = `You are an expert controversial idea generator. You will be given a user's notes, and a prompt. Your goal is to use this information to brainstorm new ideas. 

  Notes: {notes}

  Prompt: {prompt}

  Ideas Brainstorm: 
  -`;

  const tweetPromptTemplate = new PromptTemplate({
    template: tweetTemplate,
    inputVariables: ['notes', 'prompt'],
  });

  const tweetChain = new LLMChain({
    llm: tweetLlm,
    prompt: tweetPromptTemplate,
    outputKey: 'newTweetIdeas',
  });

  const unhingedTweetTemplate = `You are an expert controversial tweet generator. You will be given a prompt and some tweet ideas. Your goal is to write a controversial tweet that takes a bold stance by following the prompt while using the best tweet ideas from the list to guide you.
  
  Tweet Ideas: {newTweetIdeas}

  Prompt: ${prompt}
  
  Controversial Tweet:`;

  const unhingedTweetLlm = new ChatOpenAI({
    openAIApiKey: process.env.OPENAI_API_KEY,
    temperature: 1.2,
    modelName: 'gpt-3.5-turbo',
  });

  const unhingedTweetPrompt = new PromptTemplate({
    template: unhingedTweetTemplate,
    inputVariables: ['newTweetIdeas'],
  });

  const unhingedTweetChain = new LLMChain({
    llm: unhingedTweetLlm,
    prompt: unhingedTweetPrompt,
    outputKey: 'unhingedTweet',
  });

  const overallChain = new SequentialChain({
    chains: [tweetChain, unhingedTweetChain],
    inputVariables: ['notes', 'prompt'],
    outputVariables: ['newTweetIdeas', 'unhingedTweet'],
    verbose: false,
  });

  type ChainDraftResponse = {
    newTweetIdeas: string;
    unhingedTweet: string;
  };

  const res1 = (await overallChain.call({
    notes,
    prompt,
  })) as ChainDraftResponse;

  return res1;
};

export const generateTweetFromIdea = async ( {idea, prompt, exampleTweet, proposedStyle}: {idea: string, prompt: string, exampleTweet?: string, proposedStyle?: string} ) => {
  console.log('generateTweetFromIdea', idea, prompt, exampleTweet);
  const stlyeLlm = new ChatOpenAI({
    openAIApiKey: process.env.OPENAI_API_KEY,
    temperature: 0,
    modelName: 'gpt-3.5-turbo',
  });

  let styleTemplate

  if (proposedStyle) {

    console.log('proposedStyle ]|||||||||}}}} ', proposedStyle)

    styleTemplate = `You are an expert tweet style suggester. Given a proposed style, extrapolate a style guide for the tone, grammar, and punctuation of a tweet.

    Proposed Style:{example}

    Style Guide:`;
  } else {
    styleTemplate= `You are a tweet style extractor. Given a tweet, it is your job to return a description of the style of the tweet with regards to its tone, grammar, and punctuation.
  
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

  const tweetTemplate = `You are an expert tweet generator. You will be given an idea, a prompt, and a style guide, and your goal is to write a thought-provoking tweet. Structure the tweet using the tone, grammar, and syntax within the style guide. Do not include hashtags in the tweet!
  
  Tweet Idea: ${idea}

  Prompt:${prompt}

  Style Guide: {styleGuide}
  
  Generated Tweet:`;

  const tweetLlm = new ChatOpenAI({
    openAIApiKey: process.env.OPENAI_API_KEY,
    temperature: 0.7,
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
};
