import { TwitterAuth, TwitterAuthCallback } from '@wasp/actions/types';
import type { VerifyTokens, AccessTokens } from '@wasp/entities';
import { TwitterApi } from 'twitter-api-v2';
import HttpError from '@wasp/core/HttpError.js';
//@ts-ignore
import cors from 'cors';
import { MiddlewareConfigFn } from '@wasp/middleware';
import config from '@wasp/config.js';
import express from 'express';
import { type } from 'node:os';

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

  console.log('state from generate Auth Link: ', state);

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
  // console.log('][][][] USER ][][][', userId, typeof userId);
  console.log('][][][] STATE from Callback ][][][', state);
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

  await context.entities.AccessTokens.upsert({
    where: {
      userId: context.user.id,
    },
    update: {
      accessToken,
      refreshToken,
      updatedAt: new Date(),
    },
    create: {
      userId: context.user.id,
      accessToken,
      refreshToken,
    },
  });

  console.log('MADE IT <><><><><><>');
  return { url: process.env.WASP_WEB_CLIENT_URL || 'http://localhost:3000' };
};

export const corsOverride: MiddlewareConfigFn = (middlewareConfig) => {
  return middlewareConfig;
};
