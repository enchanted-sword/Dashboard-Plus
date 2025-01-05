import { postFunction } from './utility/mutations.js';
import { getOptions } from './utility/jsTools.js';
import { timelineObject } from './utility/reactProps.js';
import { s } from './utility/style.js';

const normalizeRegex = /[^\w-,]/g;
const customClass = 'dbplus-safeScroll-filtered';
const hiddenAttribute = 'data-safeScroll-hidden';
const postSelector = `[data-id] article:not(.${customClass})`;
const avatarSelector = `${s('avatar')}:not([style])`;
const avatarInnerSelector = s('avatarWrapperInner');
const mediaSelector = `${s('videoBlock')},${s('imageBlock')},${s('linkCard')} ${s('header withImage')},${s('albumImage')}`;
const textSelector = `${s('rows')}:not(${s('root')} div):has(${s('textBlock')})`;

let blogAvatars, media, text, inheritCommunityLabels, filterBlogs, blogList, tagList, hideStyle, dispelStyle, filterBlogList, filterTagList;

const isFilteredBlog = blog => filterBlogList ? filterBlogList.includes(blog) : false;
const hasFilteredTag = tags => tags.some(tag => filterTagList.includes(tag));
const removeOnClick = event => {
  event.preventDefault();
  event.stopPropagation();
  event.target.closest(`[${hiddenAttribute}]`).removeEventListener('click', removeOnClick);
  event.target.closest(`[${hiddenAttribute}]`).removeAttribute(hiddenAttribute);
}
const filterPosts = async posts => {
  for (const post of posts) {
    const { blogName, rebloggedFromName, rebloggedRootName, askerName, communityLabels, tags, trail } = await timelineObject(post);
    const trailBlogs = trail.map(({ blog, brokenBlog }) => blog ? blog.name : brokenBlog.name);

    if ((filterBlogs.parent && isFilteredBlog(blogName))
      || (rebloggedFromName && filterBlogs.rebloggedFrom && isFilteredBlog(rebloggedFromName))
      || (filterBlogs.root && isFilteredBlog(rebloggedRootName))
      || (filterBlogs.trail && (trailBlogs.some(blog => isFilteredBlog(blog)) || isFilteredBlog(askerName)))
      || (inheritCommunityLabels && communityLabels.hasCommunityLabel)
      || (hasFilteredTag(tags))) {
      post.classList.add(customClass);

      if (blogAvatars === 'all') post.querySelectorAll(avatarInnerSelector).forEach(avatar => avatar.setAttribute(hiddenAttribute, hideStyle));
      else if (blogAvatars === 'filtered') post.querySelectorAll(avatarSelector).forEach(avatar => {
        const blog = avatar.querySelector('[title]').getAttribute('title');
        if (isFilteredBlog(blog)) avatar.querySelector(avatarInnerSelector).setAttribute(hiddenAttribute, hideStyle);
      });

      if (hideStyle === 'hidePost') post.setAttribute(hiddenAttribute, hideStyle);
      else {
        if (media) post.querySelectorAll(mediaSelector).forEach(media => media.setAttribute(hiddenAttribute, hideStyle));
        if (text) post.querySelectorAll(textSelector).forEach(text => text.setAttribute(hiddenAttribute, hideStyle));
      }

      if (dispelStyle === 'click') post.querySelectorAll(`[${hiddenAttribute}]`).forEach(content => content.addEventListener('click', removeOnClick));
    }
  }
};

export const main = async () => {
  ({
    blogAvatars,
    media,
    text,
    inheritCommunityLabels,
    filterBlogs,
    blogList,
    tagList,
    hideStyle,
    dispelStyle
  } = await getOptions('safeScroll'));

  filterBlogList = blogList.toLowerCase().replace(normalizeRegex, '').split(',');
  filterTagList = tagList.toLowerCase().replace(normalizeRegex, '').split(',');

  postFunction.start(filterPosts, postSelector);
};

export const clean = async () => {
  $(`.${customClass}`).removeClass(customClass);
  $(`[${hiddenAttribute}]`).removeAttr(hiddenAttribute);
  postFunction.stop(filterPosts);
};