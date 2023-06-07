import type { Test } from '@wasp/actions/types';

import { Rettiwt } from 'rettiwt-api';
const twitter = Rettiwt();

export const scrapeTest: Test<never, void> = async (_args, context) => {
   const data = await twitter.users.getUserDetails('paulg');
   const paulgTweets = await twitter.users.getUserTweets(data.id);
   console.log('][][][] USER ][][][', paulgTweets.list[0].fullText)
};
