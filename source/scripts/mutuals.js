import { svgIcon } from './utility/dashboardElements.js';
import { noact } from './utility/noact.js';
import { keyToString, translate } from './utility/tumblr.js';
import { userInfo, isFollowing } from './utility/user.js';
import { postFunction } from './utility/mutations.js';
import { s } from './utility/style.js';
import { timelineObject } from './utility/reactProps.js';
import { getOptions } from './utility/jsTools.js';

const NEWDASH = () => !!document.querySelector(s('userBlock')); // Quick 'n dirty check

let color, isStarlight;

const customClass = 'dbplus-mutuals';
const customAttribute = 'data-dbplus-mutual-checked';

const specialBlogs = ['flareonfloof', 'dragongirlsweetie']; // 't:aDl2YGxBEH35TQzCQwV9Jw', 't:GAwg8_aNiWfq2ad5OAtLJg'

const mutualCache = new Map();

const followedMap = postObject => Object.fromEntries([postObject, ...postObject.trail].filter(({ blog }) => blog).map(({ blog }) => [blog.name, blog.followed]));

const mutualsIcon = () => noact({
  className: keyToString('blogFollowing') + ' ' + customClass,
  ariaLabel: translate('Mutuals'),
  title: translate('Mutuals'),
  style: NEWDASH() ? '' : 'display:inline',
  children: svgIcon('following', 16, 16, '', `var(--color-${color}, inherit)`)
});

const specialIcon = () => noact({ // silliness
  className: keyToString('blogFollowing') + ' ' + customClass,
  ariaLabel: translate('Beloved'),
  title: translate('Beloved'),
  style: NEWDASH() ? '' : 'display:inline',
  children: svgIcon('like-filled', 16, 16, '', 'var(--color-green)')
});

const markMutuals = posts => posts.forEach(async post => {
  const postObject = await timelineObject(post);
  const map = followedMap(postObject);
  const blogs = post.querySelectorAll(NEWDASH() ? `${s('title')} ${s('blogLink')}, ${s('title')} .dbplus-rebloggedFrom,${s('subheading')} ${s('blogLink')}` : `${s('blogLink author')}, ${s('blogLink')}:has(${s('attribution')}), ${s('rebloggedFromName')} ${s('blogLink')}`);

  if (postObject.rebloggedFromName) {
    map[postObject.rebloggedFromName] = postObject.rebloggedFromFollowing;
  }

  blogs.forEach(async blog => {
    const blogName = blog.textContent;
    if (blogName === userInfo.name) return;

    let mutuals;

    if (mutualCache.has(blogName)) mutuals = mutualCache.get(blogName);
    else {
      const following = await isFollowing(blogName);
      mutuals = following && map[blogName];
      mutualCache.set(blogName, mutuals);
    }

    if (mutuals) {
      blog.append(mutualsIcon());
    }

    if (isStarlight && specialBlogs.includes(blogName)) blog.append(specialIcon());
  });

  post.setAttribute(customAttribute, 'true');
});

export const main = async () => {
  ({ color } = await getOptions('mutuals'));
  postFunction.start(markMutuals, `:not([${customAttribute}])`);
  isStarlight = ['t:jV55GGYsP29aaIPEFFLg0g', 't:izBfO_EjJqelJ2F07XEgYg'].includes(userInfo.userUuid) // APR, CSS
};

export const clean = async () => {
  postFunction.stop(markMutuals);

  document.querySelectorAll(`.${customClass}`).forEach(e => e.remove());
  document.querySelectorAll(`[${customAttribute}]`).forEach(e => e.removeAttribute(customAttribute));
};

export const update = ({ color }) => {
  document.querySelectorAll(`.${customClass} svg`).forEach(icon => {
    icon.style.setProperty('--icon-color-primary', `var(--color-${color})`)
  });
};