import { getPreferences } from './utility/jsTools.js';
import { mutationManager } from './utility/mutations.js';
import { timelineObject } from './utility/reactProps.js';
import { s } from './utility/style.js';
import { navigate } from './utility/tumblr.js';

const blogViewRegex = /https:\/\/([\w\d-]+).tumblr.com\/post\/([\d]*)/;
const prevRegex = /prev(?:ious(?!ly)tag[s]*|tag[s]*|$)/i;
const customClass = 'dbplus-linkToPrevious';
const postSelector = `[tabindex="-1"][data-id] article:not(.${customClass})`;
const rebloggedFromSelector = `${s('rebloggedFromName')},.dbplus-rebloggedFrom a`;
let headerLinks, tagLinks;

const newChevron = () => $(`<svg xmlns="http://www.w3.org/2000/svg" height="24" width="24" role="presentation" style="--icon-color-primary: rgba(var(--accent));"><use href="#managed-icon__double-chevron-left"></use></svg>`)[0]

const linkPosts = async posts => {
  for (const post of posts) {
    const { rebloggedFromUrl, tags } = await timelineObject(post);
    if (typeof rebloggedFromUrl === 'undefined') return;
    let navigateUrl = blogViewRegex.exec(rebloggedFromUrl);
    navigateUrl = `/${navigateUrl[1]}/${navigateUrl[2]}`;
    if (headerLinks) {
      let headerLink = post.querySelector(rebloggedFromSelector).cloneNode(true);
      post.querySelector(rebloggedFromSelector).replaceWith(headerLink);
      headerLink.href = rebloggedFromUrl;
      headerLink.addEventListener('click', event => {
        event.preventDefault();
        event.stopPropagation();
        navigate(navigateUrl);
      });
    }
    if (tagLinks && tags.length && tags.some(tag => prevRegex.test(tag.replace(/\s/g, '')))) {
      post.querySelectorAll(`:scope a${s('tag')}`).forEach(tagElement => {
        if (prevRegex.test(tagElement.innerText.replace(/\s/g, ''))) {
          const tagElementCopy = tagElement.cloneNode(true);
          tagElement.replaceWith(tagElementCopy);
          tagElementCopy.prepend(newChevron());
          tagElementCopy.style.color = 'rgb(var(--accent))';
          tagElementCopy.href = navigateUrl;
          tagElementCopy.addEventListener('click', event => {
            event.preventDefault();
            event.stopPropagation();
            navigate(navigateUrl);
          });
        }
      });
    }

    post.classList.add(customClass);
  }
};

export const main = async () => {
  ({ headerLinks, tagLinks } = await getPreferences('linkToPrevious'));

  if (headerLinks || tagLinks) mutationManager.start(postSelector, linkPosts);
};

export const clean = async () => mutationManager.stop(linkPosts);