import PrismaClient from '@wasp/dbClient';
import { generateMemory } from './memory.js';
import generateReplyDrafts from './jobs/generateReplyDrafts.js';
import sendTweet from '@wasp/actions/sendTweet.js';
import { User } from '@wasp/entities';

/**
 * we export this function and define it in our main.wasp config file
 * so that we can run it from the command line with `wasp db seed <scriptName>`
 */
export const runChainScript = async (prismaClient: typeof PrismaClient) => {
  await generateReplyDrafts(undefined as never, {
    user: undefined as unknown as User,
    entities: {
      GeneratedIdea: prismaClient.generatedIdea,
      Tweet: prismaClient.tweet,
      AccessTokens: prismaClient.accessTokens,
      TweetDraft: prismaClient.tweetDraft,
      User: prismaClient.user,
      VerifyTokens: prismaClient.verifyTokens,
      Author: prismaClient.author,
    },
  });
};

export const sendTweetScript = async (prismaClient: typeof PrismaClient) => {
  await sendTweet('1667025371194179584', {
    user: undefined as unknown as User,
    entities: {
      GeneratedIdea: prismaClient.generatedIdea,
      Tweet: prismaClient.tweet,
      AccessTokens: prismaClient.accessTokens,
      TweetDraft: prismaClient.tweetDraft,
      User: prismaClient.user,
      VerifyTokens: prismaClient.verifyTokens,
    },
  });
};
