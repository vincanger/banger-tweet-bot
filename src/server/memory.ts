import { OpenAI } from 'langchain/llms/openai';
import { LLMChain, SequentialChain } from 'langchain/chains';
import { PromptTemplate } from 'langchain/prompts';
import { PineconeStore } from 'langchain/vectorstores/pinecone';
import { OpenAIEmbeddings } from 'langchain/embeddings/openai';
import { Document } from 'langchain/document';
import type { GenerateMemory } from '@wasp/actions/types';
import { PineconeClient } from '@pinecone-database/pinecone';
export type { Vector } from '@pinecone-database/pinecone';
import { TwitterApi } from 'twitter-api-v2';
import type { VerifyTokens, AccessTokens } from '@wasp/entities'
import HttpError from '@wasp/core/HttpError.js';

const twitterClient = new TwitterApi({
  clientId: process.env.TWITTER_CLIENT_ID!,
  clientSecret: process.env.TWITTER_CLIENT_SECRET!,
});

const pinecone = new PineconeClient();
export const initPinecone = async () => {
  await pinecone.init({
    environment: process.env.PINECONE_ENV!,
    apiKey: process.env.PINECONE_API_KEY!,
  });
  return pinecone;
};

export const generateMemory: GenerateMemory<never, void> = async (_args, context) => {

  // TODO: add a check to see if the user is already authenticated
  // if they are, then we can just refresh the token
  
  if (!context.user) {
    console.log('][][][] USER ][][][', context.user)
    throw new HttpError(401, 'User is not authenticated');
  }

  const accessTokens = await context.entities.AccessTokens.findFirst({
    where: {
      userId: context.user.id,
    }
  });

  if (!accessTokens || !accessTokens.refreshToken) {
    throw new HttpError(401, 'User is not Twitter authenticated')
  } 

  const { client, accessToken, refreshToken } = await twitterClient.refreshOAuth2Token(accessTokens.refreshToken)



  await context.entities.AccessTokens.update({
    where: {
      id: accessTokens.id,
    },
    data: {
      accessToken,
      refreshToken,
    },
  });

  const { data } = await client.v2.me()
  console.log('][][][] USER ][][][', data)
  // const mediaId = client.v1.uploadMedia()
  // const sentTweet = await client.v2.tweet('Hello World!')

  const embeddings = new OpenAIEmbeddings({
    openAIApiKey: process.env.OPENAI_API_KEY,
  });

  const pinecone = await initPinecone();

  // await pinecone.deleteIndex({
  //   indexName: 'embeds-test',
  // });
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
    namespace: context.user.username
  });

  const docs = [
    new Document({
      metadata: { type: 'note' },
      pageContent:
        "I'm pro remote work in small-to-medium sized cities. Remote work in a smaller city means lower living costs, better access to nature, close-knit community, and less time spent commuting or getting around",
    }),
    new Document({
      metadata: { type: 'note' },
      pageContent:
        'A good personal moat is being psyched about something you accomplished without caring about the results.',
    }),
    new Document({
      metadata: { type: 'note' },
      pageContent:
        'I’m not sure there’s any 10 step method to creativity. Seems to me it’s more about stepping back than leaning in. Allowing yourself to get distracted by weird ideas, exploring random new things, trying stuff out and being a constant n00b.',
    }),
    new Document({
      metadata: { type: 'tweet' },
      pageContent: 'I am an old man and have known a great many troubles, but most of them never happened.',
    }),
  ];


  // await vectorStore.addDocuments(docs);
  await PineconeStore.fromDocuments(docs, embeddings, {
    pineconeIndex: pineconeIndex,
    namespace: context.user.username
  });

  const input = 'Write a tweet about the creative process';
  const notes = await vectorStore.similaritySearch(input, 1);
  console.log('similarity search [][][--0->', notes[0]);

  const styleLlm = new OpenAI({ openAIApiKey: process.env.OPENAI_API_KEY, temperature: 0 });
  const template = `You are a tweet style extractor. Given a tweet, it is your job to return a comma separated list of styles that are present in the tweet with regards to its tone, grammar, and punctuation.

  Tweet: {exampleTweet}
  
  `;
  const promptTemplate = new PromptTemplate({
    template,
    inputVariables: ['exampleTweet'],
  });
  const styleChain = new LLMChain({
    llm: styleLlm,
    prompt: promptTemplate,
    outputKey: 'style',
  });

  const tweetLlm = new OpenAI({ openAIApiKey: process.env.OPENAI_API_KEY, temperature: 0.8 });

  const tweetTemplate = `You are a performant tweet generator. You will be given a task prompt, a user's notes, and a style guide. Your goal is to follow the instructions within the prompt and generate a new tweet based on the user's notes. Use the style indicators to help guide the tone, grammar, and punctuation of the tweet. Do not include hashtags. 

    Task Prompt: ${input}

    Notes: ${notes}

    Style Guide: {style}

    Generated Tweet:`;
  const tweetPromptTemplate = new PromptTemplate({
    template: tweetTemplate,
    inputVariables: ['style'],
  });

  const tweetChain = new LLMChain({
    llm: tweetLlm,
    prompt: tweetPromptTemplate,
    outputKey: 'newTweet',
  });

  const secondTweetTemplate =  `You are a tweet generator. You will be given an example tweet. Your goal is to generate an alternative variant of the example tweet. Use similar tone, grammar, and punctuation as the example tweet.
  
  Tweet: {newTweet}

  Generated Tweet:`

  const seconndTweetLlm = new OpenAI({ openAIApiKey: process.env.OPENAI_API_KEY, temperature: 1.0 });

  const secondTweetPromptTemplate = new PromptTemplate({
    template: secondTweetTemplate,
    inputVariables: ['style', 'newTweet'],
  });

  const secondTweetChain = new LLMChain({
    llm: seconndTweetLlm,
    prompt: secondTweetPromptTemplate,
    outputKey: 'secondNewTweet',
  });

  const overallChain = new SequentialChain({
    chains: [styleChain, tweetChain, secondTweetChain],
    inputVariables: ['exampleTweet'],
    outputVariables: ['style', 'newTweet', 'secondNewTweet'],
    verbose: true,
  });
  //   const chain = RetrievalQAChain.fromLLM(model, vectorStore.asRetriever());

  const res1 = await overallChain.call({
    exampleTweet: 'I am an old man and have known a great many troubles, but most of them never happened.',
  });
  console.log({ res1 });
  /*
{
  res1: {
    text: " Hi Perry, I'm doing great! I'm currently exploring different topics related to artificial intelligence like natural language processing and machine learning. What about you? What have you been up to lately?"
  }
}
*/
};
