import type { TweetDraftWithIdeas } from './TweetDraft';
import { useEffect } from 'react';

export default function Accordion({ tweetDraft }: { tweetDraft: TweetDraftWithIdeas }) {
  useEffect(() => {
    const script = document.createElement('script');

    script.src = 'https://platform.twitter.com/widgets.js';
    script.async = true;

    document.body.appendChild(script);

    return () => {
      document.body.removeChild(script);
    };
  }, []);

  return (
    <div className='w-[335px] -mt-3'>
      <blockquote className='twitter-tweet'>
        <p lang='en' dir='ltr'>
          {tweetDraft.originalTweet?.content}
        </p>
        <a
          href={`https://twitter.com/${tweetDraft.originalTweet.author.username}/status/${tweetDraft.originalTweet.tweetId}`}
        >
          {tweetDraft.originalTweet.tweetedAt.toDateString()}
        </a>
      </blockquote>{' '}
    </div>
  );
}
