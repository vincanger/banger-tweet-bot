import { TwitterAuth, TwitterAuthCallback } from '@wasp/apis/types';
import type { VerifyTokens, AccessTokens } from '@wasp/entities';
import { TwitterApi } from 'twitter-api-v2';
import HttpError from '@wasp/core/HttpError.js';
//@ts-ignore
import cors from 'cors';
import { MiddlewareConfigFn } from '@wasp/middleware';
import config from '@wasp/config.js';
import express from 'express';

const twitterClient = new TwitterApi({
  clientId: process.env.TWITTER_CLIENT_ID!,
  clientSecret: process.env.TWITTER_CLIENT_SECRET!,
});

const URL = process.env.WASP_WEB_CLIENT_URL || 'http://127.0.0.1:3000';
const callbackUrl = URL + '/twitter';

export const twitterAuth: TwitterAuth<never, string> = async (req, res, context) => {

  const { url, codeVerifier, state } = twitterClient.generateOAuth2AuthLink(
    callbackUrl,
    {scope: ['users.read', 'tweet.read', 'tweet.write', 'offline.access']},
  )

  await context.entities.VerifyTokens.create({
    data: {
      state,
      codeVerifier,
    }
  });

  console.log('state from generate Auth Link: ', state)
  // console.log('URL []{{{}}}]', url + '&userId=' + context.user.id)
  res.redirect(url)
};

export const callback: TwitterAuthCallback<never, {url: string}> = async (req, res, context) => {
  console.log('][][][] USER ][][][', req.query)
  if (!context.user) {
    throw new HttpError(401, 'User is not authenticated');
  }

  const { state, code, userId } = req.query;
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
      userId: context.user.id
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

  console.log('MADE IT <><><><><><>')
  res.status(200).json({ url: process.env.WASP_WEB_CLIENT_URL || 'http://localhost:3000'});
};

export const corsOverride: MiddlewareConfigFn = (middlewareConfig) => {


  return middlewareConfig;
};
