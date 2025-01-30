import { svgIcon } from './utility/dashboardElements.js';
import { noact } from './utility/noact.js';
import { keyToString, translate } from './utility/tumblr.js';
import { userInfo, isFollowing } from './utility/user.js';
import { postFunction } from './utility/mutations.js';
import { s } from './utility/style.js';
import { timelineObject } from './utility/reactProps.js';
import { getOptions } from './utility/jsTools.js';

let color;

const customClass = 'dbplus-mutuals';
const customAttribute = 'data-dbplus-mutual-checked';

const mutualCache = new Map();

const followedMap = postObject => Object.fromEntries([postObject, ...postObject.trail].filter(({ blog }) => blog).map(({ blog }) => [blog.name, blog.followed]));

const mutualsIcon = () => noact({
  className: keyToString('blogFollowing') + ' ' + customClass,
  ariaLabel: translate('Mutuals'),
  title: translate('Mutuals'),
  style: 'display:inline',
  children: svgIcon('following', 16, 16, '', `var(--color-${color})`)
});

const markMutuals = posts => posts.forEach(async post => {
  const postObject = await timelineObject(post);
  const map = followedMap(postObject);
  const blogs = post.querySelectorAll(`${s('blogLink author')}, ${s('blogLink')}:has(${s('attribution')})`);

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
  });

  post.setAttribute(customAttribute, 'true');
});

export const main = async () => {
  ({ color } = await getOptions('mutuals'));
  postFunction.start(markMutuals, `:not([${customAttribute}])`);
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