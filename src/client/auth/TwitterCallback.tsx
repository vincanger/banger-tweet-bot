import { useEffect } from 'react';
import twitterAuthCallback from '@wasp/actions/twitterAuthCallback';

export default () => {
  const urlParams = window.location.href.split('?')[1];
  const params = new URLSearchParams(urlParams);

  useEffect(() => {
    const state = params.get('state');
    const code = params.get('code');

    async function twitterCallback() {
      if (!state || !code) {
        console.log('no query params')
        return;
      }
      const res = await twitterAuthCallback({ state, code })
      window.location.href = res.url
    }
    twitterCallback();
  }, []);

  return 'Loading...'
};
