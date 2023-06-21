import { generateTweetFromIdea } from './runChain.js';
import { SendTweet, GenerateTweet, GenerateTweetDraftsAndIdeas } from '@wasp/actions/types';
import { GetTweetDraftsWithIdeas } from '@wasp/queries/types';
import HttpError from '@wasp/core/HttpError.js';
import type { GeneratedIdea } from '@wasp/entities';
import { TwitterApi, TweetV2PostTweetResult } from 'twitter-api-v2';
import { generateDrafts } from './runChain.js';
import { Rettiwt } from 'rettiwt-api';
const twitter = Rettiwt();

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

export const generateTweetDraftsAndIdeas: GenerateTweetDraftsAndIdeas<never, void> = async (_args, context) => {
  try {
    if (!context.user) {
      throw new HttpError(401, 'User is not authorized');
    }
    // get the logged in user that Wasp passes to the action via the context
    const user = context.user;

    if (!user) {
      throw new HttpError(401, 'User is not authorized');
    }

    for (let h = 0; h < user.favUsers.length; h++) {
      const favUser = user.favUsers[h];
      const userDetails = await twitter.users.getUserDetails(favUser);
      const favUserTweets = await twitter.users.getUserTweets(userDetails.id);
      // filter out retweets
      let favUserTweetTexts = favUserTweets.list.filter((tweet) => !tweet.fullText.startsWith('RT'));
      favUserTweetTexts = favUserTweetTexts.filter((tweet) => {
        // filter out tweets that were created more than 24 hours ago
        const createdAt = new Date(tweet.createdAt); // createdAt: 'Wed May 24 03:41:53 +0000 2023'
        const now = new Date();
        const twelveHoursAgo = new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000);
        return createdAt > twelveHoursAgo;
      });

      for (let i = 0; i < favUserTweetTexts.length; i++) {
        const tweet = favUserTweetTexts[i];

        const tweets = await context.entities.User.findFirst({
          where: {
            id: user.id,
          },
          select: {
            originalTweets: {
              where: {
                tweetId: tweet.id,
              },
            },
          },
        });

        const originalTweets = tweets?.originalTweets;

        /**
         * If the tweet already exists in the database, skip generating drafts and ideas for it.
         */
        if (originalTweets?.length && originalTweets.length > 0) {
          console.log('tweet already exists in db, skipping generating drafts...');
          continue;
        }

        /**
         * this is where the magic happens
         */
        const draft = await generateDrafts(tweet.fullText, user.username);
        console.log('draft: ', draft);

        const originalTweet = await context.entities.Tweet.create({
          data: {
            tweetId: tweet.id,
            content: tweet.fullText,
            authorId: tweet.tweetBy,
            tweetedAt: new Date(tweet.createdAt),
            userId: user.id,
          },
        });

        let newTweetIdeas = draft.newTweetIdeas.split('\n');
        newTweetIdeas = newTweetIdeas
          .filter((idea) => idea.trim().length > 0)
          .map((idea) => {
            // remove all dashes that are not directly followed by a letter
            idea = idea.replace(/-(?![a-zA-Z])/g, '');
            idea = idea.replace(/"/g, '');
            idea = idea.replace(/{/g, '');
            idea = idea.replace(/}/g, '');
            // remove hashtags and the words that follow them
            idea = idea.replace(/#[a-zA-Z0-9]+/g, '');
            idea = idea.replace(/^\s*[\r\n]/gm, ''); // remove new line breaks
            idea = idea.trim();
            // check if last character contains punctuation and if not add a period
            if (idea.length > 1 && !idea[idea.length - 1].match(/[.,\/#!$%\^&\*;:{}=\-_`~()]/g)) {
              idea += '.';
            }
            return idea;
          });
        for (let j = 0; j < newTweetIdeas.length; j++) {
          const newTweetIdea = newTweetIdeas[j];
          const newIdea = await context.entities.GeneratedIdea.create({
            data: {
              content: newTweetIdea,
              originalTweetId: originalTweet.id,
              userId: user.id,
            },
          });
          console.log('newIdea saved to DB: ', newIdea);
        }

        const interestingTweetDraft = await context.entities.TweetDraft.create({
          data: {
            content: draft.revisedTweet,
            originalTweetId: originalTweet.id,
            notes: draft.notes,
            userId: user.id,
          },
        });

        console.log('interestingTweetDraft saved to DB: ', interestingTweetDraft);

        // create a delay to avoid rate limiting
        await new Promise((resolve) => setTimeout(resolve, 1000));
      }
      await new Promise((resolve) => setTimeout(resolve, 1000));
    }
  } catch (error: any) {
    console.log('error', error);
    throw new HttpError(500, error);
  }
};


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
