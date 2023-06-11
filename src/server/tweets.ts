import { generateDraftFromPrompt, generateTweetFromIdea } from './runChain.js';
import { GenerateTweetFromPrompt, SendTweet, GenerateTweet } from '@wasp/actions/types';
import { GetTweetDraftsWithIdeas } from '@wasp/queries/types';
import HttpError from '@wasp/core/HttpError.js';
import type { TweetDraft, Tweet, GeneratedIdea } from '@wasp/entities';
import { TwitterApi } from 'twitter-api-v2';


const twitterClient = new TwitterApi({
  clientId: process.env.TWITTER_CLIENT_ID!,
  clientSecret: process.env.TWITTER_CLIENT_SECRET!,
});

type ChainDraftResponse = {
  newTweetIdeas: string;
  unhingedTweet: string;
};

type TweetDraftsWithIdeas = {
  id: number;
  content: string;
  notes: string;
  createdAt: Date;
  originalTweet: {
    id: number;
    content: string;
    tweetId: string;
    ideas: GeneratedIdea[];
    author: {
      username: string;
      displayName: string;
      profilePic: string;
    };
  };
}[];

export const generateTweetFromPrompt: GenerateTweetFromPrompt<string, ChainDraftResponse> = async (prompt, context) => {
  if (!context.user) {
    throw new HttpError(401, 'User is not authorized');
  }

  const draft = await generateDraftFromPrompt(prompt, context.user.username) as ChainDraftResponse;

  return draft;
};

export const getTweetDraftsWithIdeas: GetTweetDraftsWithIdeas<unknown, TweetDraftsWithIdeas> = async (_args, context) => {
  if (!context.user) {
    throw new HttpError(401, 'User is not authorized');
  }

  const drafts = await context.entities.TweetDraft.findMany({
    orderBy: {
      createdAt: 'desc',
    },
    where: {
      userId: context.user.id,
      // createdAt: {
      //   gte: new Date(Date.now() - 12 * 60 * 60 * 1000),
      // },
    },
    select: {
      id: true,
      content: true,
      notes: true,
      createdAt: true,
      originalTweet: {
        select: {
          id: true,
          tweetId: true,
          content: true,
          ideas: true,
          author: {
            select: {
              username: true,
              displayName: true,
              profilePic: true,
            }
          }
        },
      },
    },
  });

  return drafts;
};

export const sendTweet: SendTweet<string, void> = async (tweetId, context) => {
  if (!context.user) {
    throw new HttpError(401, 'User is not authorized');
  }

  const accessTokens = await context.entities.AccessTokens.findFirst({
    where: {
      userId: 1,
    }
  });

  if (!accessTokens || !accessTokens.refreshToken) {
    throw new HttpError(401, 'User is not Twitter authenticated')
  } 

  const { client, accessToken, refreshToken } = await twitterClient.refreshOAuth2Token(accessTokens.refreshToken)

  await context.entities.AccessTokens.update({
    where: {
      userId: 1,
    },
    data: {
      accessToken,
      refreshToken,
    },
  });

  const tweet = await client.v2.tweet('Hello World!')
}

export const generateTweet: GenerateTweet<{idea: string, prompt: string, exampleTweet: string, proposedStyle?: string}, any> = async ({idea, prompt, exampleTweet, proposedStyle}, context) => {
  if (!context.user) {
    throw new HttpError(401, 'User is not authorized');
  }
  console.log('yoyoyoy here')
  const tweet = await generateTweetFromIdea({idea, prompt, exampleTweet, proposedStyle});
  console.log('yoyoyoy there')
  return tweet;
}
