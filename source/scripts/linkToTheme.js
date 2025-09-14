import { getOptions } from './utility/jsTools.js';
import { mutationManager } from './utility/mutations.js';
import { s } from './utility/style.js';

const customClass = 'dbplus-customTheme';
const avatarSelector = `${s('avatar')} ${s('blogLink')}:has(${s('avatarImage')}):not(.${customClass}):not(:has(${s('hasGradient')}))`;
const headerSelector = `:is(${s('postHeader')},${s('trailHeader')}) :is(${s('blogLink')},${s('permalink')},.dbplus-rebloggedFrom):not(.${customClass},:has(${s('avatarImage')}))`;

const blogRegex = /\/([\w\d-]+)(?:\/(\d+)(?:\/[\w\d-]+)?)?$/;

let linkOptions;

const fixLinks = links => links.forEach(link => {
  const a = blogRegex.exec(link?.href);
  if (!a) return;
  const [_, blog, postId] = a;
  const newHref = `https://${blog}.tumblr.com` + (postId ? `/post/${postId}` : '');
  const newLink = link.cloneNode(true); // cloning to remove navigation event listeners
  newLink.href = newHref;
  newLink.classList.add(customClass);
  newLink.oldHref = link.href;

  link.replaceWith(newLink);
});

export const main = async () => {
  ({ linkOptions } = await getOptions('linkToTheme'));
  if (!linkOptions.avatars && !linkOptions.headers) return;

  const selector = (linkOptions.avatars ? avatarSelector : '') + (linkOptions.avatars && linkOptions.headers ? ' , ' : '') + (linkOptions.headers ? headerSelector : '');
  mutationManager.start(selector, fixLinks);
};
export const clean = async () => {
  mutationManager.stop(fixLinks);
}