import { replyDraftsJob } from '@wasp/jobs/replyDraftsJob.js';
import prismaClient from '@wasp/dbClient';
import { User } from '@wasp/entities';
import { generateDrafts } from '../runChain.js';

import { Rettiwt } from 'rettiwt-api';
const twitter = Rettiwt();

type UserDelegate = typeof prismaClient.user;
type AccessTokens = typeof prismaClient.accessTokens;
type VerifyTokens = typeof prismaClient.verifyTokens;
type TweetDraft = typeof prismaClient.tweetDraft;
type GeneratedIdeas = typeof prismaClient.generatedIdeas;
type Tweet = typeof prismaClient.tweet;
type Context = {
  user: User;
  entities: {
    User: UserDelegate;
    AccessTokens: AccessTokens;
    VerifyTokens: VerifyTokens;
    Tweet: Tweet;
    TweetDraft: TweetDraft;
    GeneratedIdeas: GeneratedIdeas;
  };
};

export default async function generateReplyDraftsJob(args: any, context: Context) {
  // find all users with a favUsers array that is not empty
  const allUsers = await context.entities.User.findMany({});

  const usersWithFavUsers = allUsers.filter((user) => user.favUsers.length > 0);

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
        const sixHoursAgo = new Date(now.getTime() - 6 * 60 * 60 * 1000);
        return createdAt > sixHoursAgo;
      });

      console.log('\nin LOOP 1');
      console.log('\nfavUser', favUser);
      console.log('\nfavUserTweets', favUserTweetTexts);

      for (let i = 0; i < favUserTweetTexts.length; i++) {
        const tweet = favUserTweetTexts[i];
        console.log('\nin LOOP 2');
        console.log('\tweet', tweet);
        const draft = await generateDrafts(
          tweet.fullText,
          'generate a tweet by synthesizing the imformation within the notes',
          user.username
        );

        console.log('\ndraft', draft);

        const originalTweet = await context.entities.Tweet.upsert({
          where: { id: tweet.id },
          update: {},
          create: {
            id: tweet.id,
            author: favUser,
            content: tweet.fullText,
          },
        });

        let newTweetIdeas = draft.newTweetIdeas.split('\n')
        newTweetIdeas = newTweetIdeas.filter((idea) => idea.length > 0).map((idea) => {
          // remove all dashes that are not directly followed by a letter
          idea = idea.replace(/-(?![a-zA-Z])/g, '');
          idea = idea.replace(/"/g, '');
          idea = idea.replace(/{/g, '');
          idea = idea.replace(/}/g, '');
          // remove hashtags and the words that follow them
          idea = idea.replace(/#[a-zA-Z0-9]+/g, '');
          idea = idea.trim();
          if (idea[idea.length - 1] !== '.') {
            idea += '.';
          }
          return idea;
        })
        for (let j = 0; j < newTweetIdeas.length; j++) {
          const newTweetIdea = newTweetIdeas[j];
          const newIdea = await context.entities.GeneratedIdeas.create({
            data: {
              content: newTweetIdea,
              userId: user.id,
            }
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

        // return draft;
      }
      await new Promise((resolve) => setTimeout(resolve, 1000));
    }
  }
}

// const submittedJob = await replyDraftsJob.submit({ job: 'args' });
// console.log(await submittedJob.pgBoss.details());
