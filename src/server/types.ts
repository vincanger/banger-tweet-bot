import type { User } from '@wasp/entities';
import prismaClient from '@wasp/dbClient';

type UserDelegate = typeof prismaClient.user;
type TweetDraft = typeof prismaClient.tweetDraft;
type Author = typeof prismaClient.author;
type GeneratedIdea = typeof prismaClient.generatedIdea;
type Tweet = typeof prismaClient.tweet;

export type Context = {
  user?: Omit<User, 'password'> | undefined;
  entities: {
    User: UserDelegate;
    Tweet: Tweet;
    TweetDraft: TweetDraft;
    GeneratedIdea: GeneratedIdea;
    Author: Author;
  };
};
