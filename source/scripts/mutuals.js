import { svgIcon } from './utility/dashboardElements.js';
import { noact } from './utility/noact.js';
import { keyToString, translate, apiFetch } from './utility/tumblr.js';
import { userInfo } from './utility/user.js';
import { postFunction } from './utility/mutations.js';
import { s } from './utility/style.js';
import { timelineObject } from './utility/reactProps.js';

const customClass = 'dbplus-mutuals';
const customAttribute = 'data-dbplus-mutual-checked';

const mutualCache = new Map();

const isFollowing = async handle => {
  const { response } = await apiFetch(`/v2/blog/${userInfo.name}/followed_by?query=${handle}`);
  return response.followedBy;
};
const followedMap = postObject => Object.fromEntries([postObject, ...postObject.trail].map(({ blog }) => [blog.name, blog.followed]));

const mutualsIcon = timespan => noact({
  className: keyToString('blogFollowing'),
  ariaLabel: translate('Mutuals'),
  title: translate('Mutuals'),
  style: 'display:inline',
  children: svgIcon('following', 16, 16, '', 'rgb(var(--green))')
});

const markMutuals = posts => posts.forEach(async post => {
  const postObject = await timelineObject(post);
  const map = followedMap(postObject);
  const blogs = post.querySelectorAll(`${s('blogLink author')}, ${s('blogLink')}:has(${s('attribution')})`);

  blogs.forEach(async blog => {
    const blogName = blog.textContent;
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
  postFunction.start(markMutuals, `:not([${customAttribute}])`);
};

export const clean = async () => {
  postFunction.stop(markMutuals);

  document.querySelectorAll(`.${customClass}`).forEach(e => e.remove());
  document.querySelectorAll(`[${customAttribute}]`).forEach(e => e.removeAttribute(customAttribute));
};