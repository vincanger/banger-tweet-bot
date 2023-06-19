import { generateTweetFromIdea } from './runChain.js';
import { SendTweet, GenerateTweet } from '@wasp/actions/types';
import { GetTweetDraftsWithIdeas } from '@wasp/queries/types';
import HttpError from '@wasp/core/HttpError.js';
import type { GeneratedIdea } from '@wasp/entities';
import { TwitterApi, TweetV2PostTweetResult } from 'twitter-api-v2';


const twitterClient = new TwitterApi({
  clientId: process.env.TWITTER_CLIENT_ID!,
  clientSecret: process.env.TWITTER_CLIENT_SECRET!,
});

type TweetDraftsWithIdeas = {
  id: number;
  content: string;
  notes: string;
  createdAt: Date;
  originalTweet: {
    id: number;
    content: string;
    tweetId: string;
    tweetedAt: Date;
    ideas: GeneratedIdea[];
    author: {
      username: string;
      displayName: string;
      profilePic: string;
    };
  };
}[];


export const getTweetDraftsWithIdeas: GetTweetDraftsWithIdeas<unknown, TweetDraftsWithIdeas> = async (_args, context) => {
  if (!context.user) {
    throw new HttpError(401, 'User is not authorized');
  }

  const drafts = await context.entities.TweetDraft.findMany({
    orderBy: {
      // createdAt: 'desc',
      originalTweet: {
        tweetedAt: 'desc',
      }
    },
    where: {
      userId: context.user.id,
      createdAt: {
        // gte: new Date(Date.now() - 12 * 60 * 60 * 1000),
        gte: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000), // NOTE: within the last two days? I'm not sure what a good timeframe is here.
      },
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
          tweetedAt: true,
          author: {
            select: {
              username: true,
              displayName: true,
              profilePic: true,
            },
          },
        },
      },
    },
  });

  return drafts;
};

export const sendTweet: SendTweet<string, TweetV2PostTweetResult> = async (tweetContent, context) => {
  if (!context.user) {
    throw new HttpError(401, 'User is not authorized');
  }
  try {
    const accessTokens = await context.entities.AccessTokens.findFirst({
      where: {
        userId: context.user.id,
      },
    });
  
    if (!accessTokens || !accessTokens.refreshToken) {
      throw new HttpError(401, 'Please connect your Twitter account first');
    }
  
    const { client, accessToken, refreshToken } = await twitterClient.refreshOAuth2Token(accessTokens.refreshToken);
  
    await context.entities.AccessTokens.update({
      where: {
        userId: context.user.id,
      },
      data: {
        accessToken,
        refreshToken,
      },
    });
  
    return await client.v2.tweet(tweetContent);
    
  } catch (error) {
    throw new HttpError(500, error);
  }
};

export const generateTweet: GenerateTweet<{idea: string, prompt: string, exampleTweet: string, proposedStyle?: string}, any> = async ({idea, prompt, exampleTweet, proposedStyle}, context) => {
  if (!context.user) {
    throw new HttpError(401, 'User is not authorized');
  }
  const tweet = await generateTweetFromIdea({idea, prompt, exampleTweet, proposedStyle});
  return tweet;
}
