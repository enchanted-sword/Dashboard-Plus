import { navigate } from './utility/tumblr.js';

export const main = async () => {
  if (window.location.pathname === '/dashboard/stuff_for_you') {
    try {
      navigate('/dashboard/following');
    } catch (e) {
      console.warn(e);
      window.location.href = 'https://www.tumblr.com/dashboard/following';
    }
  }
}

export const clean = async () => void 0;