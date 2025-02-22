import { postFunction } from './utility/mutations.js';
import { s, style } from './utility/style.js';
import { timelineObject } from './utility/reactProps.js';
import { apiFetch } from './utility/tumblr.js';
import { getOptions } from './utility/jsTools.js';

const hiddenAttribute = 'data-hideFiltered-hidden';
const styleElement = style(`${s('listTimelineObject')}:has(article[${hiddenAttribute}]) { display: none; }`);
const postSelector = `[tabindex="-1"][data-id] article:not([${hiddenAttribute}])`;

let filterOptions, blockedStyle, blockedTerms, blockedTermList;
const blocked = {};

const reduceToText = (...content) => content.flat().filter(({ type }) => type === 'text').map(({ text }) => text).join(' ').toLowerCase();

const hideFilteredContent = async posts => {
  for (const post of posts) {
    if (filterOptions.content && post.querySelector(s('filteredScreen'))) {
      post.setAttribute(hiddenAttribute, '');
      continue;
    } else {
      const { blog, rebloggedFromUuid, rebloggedRootUuid, content, trail, askingName } = await timelineObject(post);

      if (filterOptions.blockedTerms && blockedTerms.length) {
        const text = reduceToText(content, ...trail.map(({ content }) => content));

        if (blockedTermList.some(term => text.includes(term))) {
          post.setAttribute(hiddenAttribute, '');
          continue;
        }
      }
      if (filterOptions.blocked) {
        let blogIdList = [];
        if (blockedStyle.parent && blog.uuid) blogIdList.push(blog.uuid);
        if (blockedStyle.rebloggedFrom && rebloggedFromUuid) blogIdList.push(rebloggedFromUuid);
        if (blockedStyle.root && rebloggedRootUuid) blogIdList.push(rebloggedRootUuid);
        if (blockedStyle.trail && trail.length) {
          const trailBlogNameList = trail.map(trailItem => trailItem.blog?.name || trailItem.broken_blog_name);
          blogIdList = blogIdList.concat(trailBlogNameList);
          if (askingName) blogIdList.push(askingName);
        }

        if (blogIdList.length === 0) continue;

        for (const blogId of blogIdList) {
          if (typeof blocked[blogId] === 'undefined') {
            blocked[blogId] = apiFetch(`/v2/blog/${blogId}/info`)
              .then(({ response: { blog } }) => blog.isBlockedFromPrimary)
              .catch(() => Promise.resolve(false));
          }

          const isBlocked = await blocked[blogId];
          if (isBlocked) {
            post.setAttribute(hiddenAttribute, '');
            break;
          }
        }
      }
    }
  }
};

export const main = async function () {
  ({ filterOptions, blockedStyle, blockedTerms } = await getOptions('hideFiltered'));

  blockedTermList = blockedTerms.toLowerCase().split(',').map(t => t.trim()).filter(t => t);

  postFunction.start(hideFilteredContent, postSelector);
  document.body.append(styleElement);
};

export const clean = async function () {
  postFunction.stop(hideFilteredContent);
  $(`[${hiddenAttribute}]`).removeAttr(hiddenAttribute);
  styleElement.remove();
};