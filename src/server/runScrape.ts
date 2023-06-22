import type { User } from '@wasp/entities';
import type { Context } from './types';
import { generateDrafts } from './runChain.js';
import { Rettiwt } from 'rettiwt-api';
const twitter = Rettiwt();

type RettiwtClient = typeof twitter;
type GenerateDrafts = typeof generateDrafts;

export const scrapeTweetsAndGenerate = async (
  user: Omit<User, 'password'>,
  twitter: RettiwtClient,
  context: Context,
  generateDrafts: GenerateDrafts,
) => {

  let newIdeaAmount = 0;
  let newTweetDraftsAmount = 0;

  for (let h = 0; h < user.favUsers.length; h++) {
    const favUser = user.favUsers[h];
    const userDetails = await twitter.users.getUserDetails(favUser);
    const favUserTweets = await twitter.users.getUserTweets(userDetails.id);
    const favUserTweets2 = await twitter.users.getUserTweets(userDetails.id, undefined, favUserTweets.next.value);
    let favUserTweetTexts = favUserTweets.list.filter((tweet) => !tweet.fullText.startsWith('RT'));
    favUserTweetTexts = favUserTweetTexts.concat(
      favUserTweets2.list.filter((tweet) => !tweet.fullText.startsWith('RT'))
    );
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
          if (idea.length > 1 && !idea[idea.length - 1].match(/[.,\/#!?$%\^&\*;:{}=\-_`~()]/g)) {
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
        if (newIdeaAmount) newIdeaAmount++;
      }

      await context.entities.TweetDraft.create({
        data: {
          content: draft.revisedTweet,
          originalTweetId: originalTweet.id,
          userId: user.id,
          notes: draft.notes,
        },
      });

      if (newTweetDraftsAmount) newTweetDraftsAmount++;

      // create a two second delay to avoid rate limiting
      await new Promise((resolve) => setTimeout(resolve, 1000));
    }
    await new Promise((resolve) => setTimeout(resolve, 1000));
  }

  return {
    newIdeaAmount,
    newTweetDraftsAmount,
  }
};
