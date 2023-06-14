import prismaClient from '@wasp/dbClient';
import { User } from '@wasp/entities';
import { generateDrafts } from '../runChain.js';
import { Rettiwt } from 'rettiwt-api';
import HttpError from '@wasp/core/HttpError.js';
const twitter = Rettiwt();

type UserDelegate = typeof prismaClient.user;
type AccessTokens = typeof prismaClient.accessTokens;
type VerifyTokens = typeof prismaClient.verifyTokens;
type TweetDraft = typeof prismaClient.tweetDraft;
type Author = typeof prismaClient.author;
type GeneratedIdea = typeof prismaClient.generatedIdea;
type Tweet = typeof prismaClient.tweet;
type Context = {
  user: User;
  entities: {
    User: UserDelegate;
    AccessTokens: AccessTokens;
    VerifyTokens: VerifyTokens;
    Tweet: Tweet;
    TweetDraft: TweetDraft;
    GeneratedIdea: GeneratedIdea;
    Author: Author;
  };
};

/**
 * This job runs every 1-6 hours and generates drafts and ideas for the users
 * within the user.favUsers array. It does this by getting the tweets of each
 * user in the favUsers array, finding a similar note in the vector store,
 * and then generating drafts and ideas from those tweets.
 * NOTE: during development, run `wasp db seed runChainScript` to run this job manually.
 */
export default async function generateReplyDraftsJob(args: any, context: Context) {
  try {
    // find all users with a favUsers array that is not empty
    const allUsers = await context.entities.User.findMany({});

    const usersWithFavUsers = allUsers.filter((user: User) => user.favUsers.length > 0);

    for (let f = 0; f < usersWithFavUsers.length; f++) {
      const user = usersWithFavUsers[f];
      console.log('\nin LOOP 0');
      console.log('\nuser', user);
      for (let h = 0; h < user.favUsers.length; h++) {
        const favUser = user.favUsers[h];
        const userDetails = await twitter.users.getUserDetails(favUser);
        const favUserTweets = await twitter.users.getUserTweets(userDetails.id);
        let favUserTweetTexts = favUserTweets.list.filter((tweet) => !tweet.fullText.startsWith('RT'));
        favUserTweetTexts = favUserTweetTexts.filter((tweet) => {
          // filter out tweets that were created more than 6 hours ago
          // createdAt: 'Wed May 24 03:41:53 +0000 2023'
          const createdAt = new Date(tweet.createdAt);
          const now = new Date();
          // const sixHoursAgo = new Date(now.getTime() - 6 * 60 * 60 * 1000);
          const twelveHoursAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
          return createdAt > twelveHoursAgo;
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

        console.log('\nin LOOP 1');
        console.log('\nfavUser', favUser);
        console.log('\nfavUserTweets', favUserTweetTexts);

        for (let i = 0; i < favUserTweetTexts.length; i++) {
          const tweet = favUserTweetTexts[i];
          console.log('\nin LOOP 2');
          console.log('\tweet', tweet);

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

          console.log('\n\noriginalTweet [][][][', originalTweet, '\n\n');

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
            const newIdea = await context.entities.GeneratedIdea.create({
              data: {
                content: newTweetIdea,
                userId: user.id,
                originalTweetId: originalTweet.id,
              },
            });
          }

          const unhingedTweetDraft = await context.entities.TweetDraft.create({
            data: {
              content: draft.unhingedTweet,
              originalTweetId: originalTweet.id,
              userId: user.id,
              notes: draft.notes,
            },
          });

          // create a two second delay to avoid rate limiting
          await new Promise((resolve) => setTimeout(resolve, 1000));

        }
        await new Promise((resolve) => setTimeout(resolve, 1000));
      }
    }
  } catch (error: any) {
    console.log('error', error);
    throw new HttpError(500, error);
  }
}

// const submittedJob = await replyDraftsJob.submit({ job: 'args' });
// console.log(await submittedJob.pgBoss.details());
