import { TwitterAuth, TwitterAuthCallback } from '@wasp/actions/types';
import { GetAccessTokens } from '@wasp/queries/types';
import type { VerifyTokens, AccessTokens } from '@wasp/entities';
import { TwitterApi } from 'twitter-api-v2';
import HttpError from '@wasp/core/HttpError.js';

const twitterClient = new TwitterApi({
  clientId: process.env.TWITTER_CLIENT_ID!,
  clientSecret: process.env.TWITTER_CLIENT_SECRET!,
});

const URL = process.env.WASP_WEB_CLIENT_URL || 'http://127.0.0.1:3000';
const callbackUrl = URL + '/twitter';

export const twitterAuth: TwitterAuth<never, string> = async (_args, context) => {

  if (!context.user) {
    throw new HttpError(401, 'User is not authenticated');
  }

  console.log('user in first auth fn: ', context.user)

  const { url, codeVerifier, state } = twitterClient.generateOAuth2AuthLink(
    callbackUrl,
    { scope: ['users.read', 'tweet.read', 'tweet.write', 'offline.access'] }
  );

  await context.entities.VerifyTokens.create({
    data: {
      state,
      codeVerifier,
      userId: context.user.id,
    },
  });

  return url;
};

export const callback: TwitterAuthCallback<{ state: string; code: string }, { url: string }> = async (
  args,
  context
) => {
  if (!context.user) {
    throw new HttpError(401, 'User is not authenticated');
  }

  const { state, code, } = args;

  const tokens: VerifyTokens = await context.entities.VerifyTokens.findFirstOrThrow({
    where: {
      state: state as string,
    },
  });

  const { client, accessToken, refreshToken } = await twitterClient.loginWithOAuth2({
    code: code as string,
    codeVerifier: tokens.codeVerifier,
    redirectUri: callbackUrl,
  });
  
  if (accessToken) {
    
     const token = await context.entities.AccessTokens.upsert({
       where: {
         userId: tokens.userId,
       },
       update: {
         accessToken,
         refreshToken,
         updatedAt: new Date(),
       },
       create: {
         userId: tokens.userId,
         accessToken,
         refreshToken,
       },
     });

      console.log('token: ', token);
  }
  

  console.log('MADE IT <><><><><><>');
  return { url: process.env.WASP_WEB_CLIENT_URL || 'http://localhost:3000' };
};

export const getAccessTokens: GetAccessTokens<never, AccessTokens | null> = async (_args, context) => {
  if (!context.user) {
    throw new HttpError(401, 'User is not authenticated');
  }
  try {
    
      const tokens = await context.entities.AccessTokens.findFirst({
        where: {
          userId: context.user.id,
        },
      });
    
      return tokens;
    
  } catch (error: any) {
    throw new HttpError(500, error.message);
  }
}