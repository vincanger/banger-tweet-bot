import type { User } from '@wasp/entities';
import type { Context } from '../types';
import { generateDrafts } from '../runChain.js';
import HttpError from '@wasp/core/HttpError.js';
import { scrapeTweetsAndGenerate } from '../runScrape.js';
import { Rettiwt } from 'rettiwt-api';
const twitter = Rettiwt({
  kdt: process.env.KDT!,
  twid: process.env.TWID!,
  ct0: process.env.CT0!,
  auth_token: process.env.AUTH_TOKEN!,
});

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
      console.log('\nuser', user);

      const { newIdeaAmount, newTweetDraftsAmount  } = await scrapeTweetsAndGenerate(user, twitter, context, generateDrafts);
      
      console.log('\nnewIdeaAmount: ', newIdeaAmount);
      console.log('\nnewTweetDraftsAmount: ', newTweetDraftsAmount);
    }
  } catch (error: any) {
    console.log('error', error);
    throw new HttpError(500, error);
  }
}

// const submittedJob = await replyDraftsJob.submit({ job: 'args' });
// console.log(await submittedJob.pgBoss.details());
