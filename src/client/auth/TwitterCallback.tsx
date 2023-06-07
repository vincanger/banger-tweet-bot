import { useEffect } from 'react';
import api from '@wasp/api';

export default () => {
  const urlParams = window.location.href.split('?')[1];
  useEffect(() => {
    async function twitterCallback() {
      const res = await api.post('/twitter/auth/callback?' + urlParams);
      window.location.href = res.data.url
    }
    if (!urlParams) window.location.href = '/';
    twitterCallback();
  }, []);

  return 'Loading...'
};
