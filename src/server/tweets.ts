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

type GenerationResult = {
  newIdeaAmount: number;
  newTweetDraftsAmount: number;
};

export const generateTweetDraftsAndIdeas: GenerateTweetDraftsAndIdeas<never, GenerationResult> = async (_args, context) => {
  try {
    if (!context.user) {
      throw new HttpError(401, 'User is not authorized');
    }
    // get the logged in user that Wasp passes to the action via the context
    const user = context.user;

    let newIdeaAmount = 0;
    let newTweetDraftsAmount = 0;

    for (let h = 0; h < user.favUsers.length; h++) {
      const favUser = user.favUsers[h];
      const userDetails = await twitter.users.getUserDetails(favUser);

      const favUserTweets = await twitter.users.getUserTweets(userDetails.id);
      const favUserTweets2 = await twitter.users.getUserTweets(userDetails.id, undefined, favUserTweets.next.value);
      console.log('\nfavUserTweets1 >>>>>>>>>>>', favUserTweets)
      console.log('\nfavUserTweets2 >>>>>>>>>>>', favUserTweets2)
      let favUserTweetTexts = favUserTweets.list.filter((tweet) => !tweet.fullText.startsWith('RT'));
      favUserTweetTexts = favUserTweetTexts.concat(favUserTweets2.list.filter((tweet) => !tweet.fullText.startsWith('RT')));
      favUserTweetTexts = favUserTweetTexts.filter((tweet) => {
        // keep tweets that were created more than 6 hours ago
        // createdAt: 'Wed May 24 03:41:53 +0000 2023'
        const createdAt = new Date(tweet.createdAt);
        const now = new Date();
        // const sixHoursAgo = new Date(now.getTime() - 6 * 60 * 60 * 1000);
        const twoDaysAgo = new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000);
        return createdAt > twoDaysAgo;
      });

      const author = await context.entities.Author.upsert({
        where: {
          id: userDetails.id,
        },
        update: {},
        create: {
          id: userDetails.id,
          username: userDetails.userName,
          displayName: userDetails.fullName,
          profilePic: userDetails.profileImage,
        },
      });

      console.log('\nfavUser', favUser);
      console.log('\nfavUserTweets', favUserTweetTexts);

      for (let i = 0; i < favUserTweetTexts.length; i++) {
        const tweet = favUserTweetTexts[i];

        const existingTweet = await context.entities.Tweet.findUnique({
          where: {
            tweetId_userId: {
              tweetId: tweet.id,
              userId: user.id,
            },
          },
        });

        /**
         * If the tweet already exists in the database, skip generating drafts and ideas for it.
         */
        if (existingTweet) {
          console.log('tweet already exists in db, skipping generating drafts...');
          continue;
        }

        // TODO: add ability to re-generate ideas for existing tweets

        /**
         * this is where the magic happens
         */
        const draft = await generateDrafts(tweet.fullText, user.username);
        console.log('\ndraft', draft);

        const originalTweet = await context.entities.Tweet.upsert({
          where: {
            tweetId_userId: {
              tweetId: tweet.id,
              userId: user.id,
            },
          },
          update: {},
          create: {
            tweetId: tweet.id,
            userId: user.id,
            content: tweet.fullText,
            authorId: author.id,
            tweetedAt: new Date(tweet.createdAt),
          },
        });

        let newTweetIdeas = draft.newTweetIdeas.split('\n');
        newTweetIdeas = newTweetIdeas
          .filter((idea) => idea.length > 0)
          .map((idea) => {
            // remove all dashes that are not directly followed by a letter
            idea = idea.replace(/-(?![a-zA-Z])/g, '');
            idea = idea.replace(/"/g, '');
            idea = idea.replace(/{/g, '');
            idea = idea.replace(/}/g, '');
            // remove hashtags and the words that follow them
            idea = idea.replace(/#[a-zA-Z0-9]+/g, '');
            idea = idea.replace(/^\s*[\r\n]/gm, ''); // TODO: not sure about this one
            idea = idea.trim();
            // if (idea.length > 1 && idea[idea.length - 1] !== '.') {
            //   idea += '.';
            // }
            // check if last character contains punctuation and if not add a period
            if (idea.length > 1 && !idea[idea.length - 1].match(/[.,\/#!$%\^&\*;:{}=\-_`~()]/g)) {
              idea += '.';
            }
            return idea;
          });
        for (let j = 0; j < newTweetIdeas.length; j++) {
          const newTweetIdea = newTweetIdeas[j];
          await context.entities.GeneratedIdea.create({
            data: {
              content: newTweetIdea,
              userId: user.id,
              originalTweetId: originalTweet.id,
            },
          });
          newIdeaAmount++;
        }

        await context.entities.TweetDraft.create({
          data: {
            content: draft.revisedTweet,
            originalTweetId: originalTweet.id,
            userId: user.id,
            notes: draft.notes,
          },
        });
        newTweetDraftsAmount++;

        // create a two second delay to avoid rate limiting
        await new Promise((resolve) => setTimeout(resolve, 1000));
      }
      await new Promise((resolve) => setTimeout(resolve, 1000));
    }

    return {
      newIdeaAmount,
      newTweetDraftsAmount,
    };
  } catch (error: any) {
    console.log('error', error);
    throw new HttpError(500, error);
  }
};

export const getTweetDraftsWithIdeas: GetTweetDraftsWithIdeas<unknown, TweetDraftsWithIdeas> = async (
  _args,
  context
) => {
  if (!context.user) {
    throw new HttpError(401, 'User is not authorized');
  }

  const drafts = await context.entities.TweetDraft.findMany({
    orderBy: {
      originalTweet: {
        tweetedAt: 'desc',
      },
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

export const generateTweet: GenerateTweet<
  { idea: string; prompt: string; exampleTweet: string; proposedStyle?: string },
  any
> = async ({ idea, prompt, exampleTweet, proposedStyle }, context) => {
  if (!context.user) {
    throw new HttpError(401, 'User is not authorized');
  }
  const tweet = await generateTweetFromIdea({ idea, prompt, exampleTweet, proposedStyle });
  return tweet;
};
