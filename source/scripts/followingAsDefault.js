import { navigate } from './utility/tumblr.js';

export const main = async () => {
  if (window.location.pathname === '/dashboard/stuff_for_you') navigate('/dashboard/following');
}

export const clean = async () => void 0;