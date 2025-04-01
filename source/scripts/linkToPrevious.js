import { getOptions } from './utility/jsTools.js';
import { postFunction } from './utility/mutations.js';
import { timelineObject } from './utility/reactProps.js';
import { s } from './utility/style.js';
import { navigate, translate } from './utility/tumblr.js';
import { svgIcon } from './utility/dashboardElements.js';

const prevRegex = /^(?:[<-]+|)previous$|prev(?:ious(?!ly)tag[s]*|tag[s]*|$)/i;
const customClass = 'dbplus-linkToPrevious';
const postSelector = `[tabindex="-1"][data-id] article:not(.${customClass})`;
const rebloggedFromSelector = `${s('userBlock')} ${s('subheader')} ${s('blogLink')}`;
let headerLinks, tagLinks;

const linkPosts = async posts => {
  for (const post of posts) {
    const { parentPostUrl, tags } = await timelineObject(post);
    if (typeof parentPostUrl === 'undefined') continue;
    const navigateUrl = parentPostUrl.split('https://www.tumblr.com').pop();
    if (headerLinks) {
      let headerLink = post.querySelector(rebloggedFromSelector)?.cloneNode(true);

      if (headerLink) {
        post.querySelector(rebloggedFromSelector).replaceWith(headerLink);
        headerLink.href = parentPostUrl;
        headerLink.title = translate('View previous reblog');
        headerLink.addEventListener('click', event => {
          event.preventDefault();
          event.stopPropagation();
          navigate(navigateUrl);
        });
      }

    }
    if (tagLinks && tags.length && tags.some(tag => prevRegex.test(tag.replace(/\s/g, '')))) {
      post.querySelectorAll(`:scope a${s('tag')}`).forEach(tagElement => {
        if (prevRegex.test(tagElement.innerText.replace(/[#\s]/g, ''))) {
          const tagElementCopy = tagElement.cloneNode(true);
          tagElement.replaceWith(tagElementCopy);
          tagElementCopy.prepend(svgIcon('double-chevron-left', 24, 24, '', 'var(--accent)'));
          tagElementCopy.style.color = 'var(--accent)';
          tagElementCopy.href = navigateUrl;
          tagElementCopy.title = translate('View previous reblog');
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
  ({ headerLinks, tagLinks } = await getOptions('linkToPrevious'));

  if (headerLinks || tagLinks) postFunction.start(linkPosts, postSelector);
};

export const clean = async () => postFunction.stop(linkPosts);