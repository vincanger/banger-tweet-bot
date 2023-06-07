import PrismaClient from '@wasp/dbClient';
import { generateMemory } from './memory.js';
import { scrapeTest } from './test.js';
import generateReplyDrafts from './jobs/generateReplyDrafts.js';
import { User } from '@wasp/entities';
import { userInfo } from 'os';

/**
 * we export this function and define it in our main.wasp config file
 * so that we can run it from the command line with `wasp db seed`
 */
export const seedScript = async (prismaClient: typeof PrismaClient) => {
  // await generateMemory(undefined as never, {
  //   entities: { Tweet: prismaClient.tweet, AccessTokens: prismaClient.accessTokens },
  // });
  // await scrapeTest(undefined as never, {
  //   entities: { Tweet: prismaClient.tweet, AccessTokens: prismaClient.accessTokens },
  // });
  await generateReplyDrafts(undefined as never, {
    user: undefined as unknown as User,
    entities: {
      GeneratedIdeas: prismaClient.generatedIdeas,
      Tweet: prismaClient.tweet,
      AccessTokens: prismaClient.accessTokens,
      TweetDraft: prismaClient.tweetDraft,
      User: prismaClient.user,
      VerifyTokens: prismaClient.verifyTokens,
    },
  });
};
