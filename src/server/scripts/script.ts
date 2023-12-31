import PrismaClient from '@wasp/dbClient';
import generateReplyDrafts from '../jobs/generateReplyDrafts.js';
import { User } from '@wasp/entities';

/**
 * we export this function and define it in our main.wasp config file
 * so that we can run it from the command line with `wasp db seed runChainScript`
 */
export const runChainScript = async (prismaClient: typeof PrismaClient) => {
  await generateReplyDrafts(undefined as never, {
    user: undefined as unknown as User,
    entities: {
      GeneratedIdea: prismaClient.generatedIdea,
      Tweet: prismaClient.tweet,
      TweetDraft: prismaClient.tweetDraft,
      User: prismaClient.user,
      Author: prismaClient.author,
    },
  });
};
