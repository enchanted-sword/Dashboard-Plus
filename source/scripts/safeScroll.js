import { mutationManager } from './utility/mutations.js';
import { getPreferences } from './utility/jsTools.js';
import { timelineObject } from './utility/reactProps.js';
import { s } from './utility/style.js';

const normalizeRegex = /[^\w-,]/g;
const customClass = 'dbplus-safeScroll-filtered';
const hiddenAttribute = 'dbplus-safeScroll-hidden';
const postSelector = `[data-id] article:not(.${customClass})`;
const avatarSelector = `${s('avatar')}:not([style])`;
const avatarInnerSelector = s('avatarWrapperInner');
const mediaSelector = `${s('videoBlock')},${s('imageBlock')},${s('linkCard')} ${s('header withImage')},${s('albumImage')}`;
const textSelector = `${s('rows')}:not(${s('root')} div):has(${s('textBlock')})`;

let blogAvatars, media, text, inheritCommunityLabels, filterBlogs, blogList, tagList, hideStyle, dispelStyle, filterBlogList, filterTagList;

const isFilteredBlog = blog => filterBlogList.includes(blog);
const hasFilteredTag = tags => tags.some(tag => filterTagList.includes(tag));
const removeOnClick = event => {
  event.preventDefault();
  event.stopPropagation();
  event.target.closest(`[${hiddenAttribute}]`).removeEventListener('click', removeOnClick);
  event.target.closest(`[${hiddenAttribute}]`).removeAttribute(hiddenAttribute);
}
const filterPosts = async posts => {
  for (const post of posts) {
    const { blogName, rebloggedFromName, rebloggedRootName, communityLabels, tags, trail } = await timelineObject(post);
    const trailBlogs = trail.map(({ blog }) => blog.name);

    if ((filterBlogs.parent && isFilteredBlog(blogName)) 
      || (filterBlogs.rebloggedFrom && isFilteredBlog(rebloggedFromName))
      || (filterBlogs.root && isFilteredBlog(rebloggedRootName))
      || (filterBlogs.trail && trailBlogs.some(blog => isFilteredBlog(blog)))
      || (inheritCommunityLabels && communityLabels.hasCommunityLabel)
      || (hasFilteredTag(tags))) {
      post.classList.add(customClass);

      if (blogAvatars.selected === 'all') post.querySelectorAll(avatarInnerSelector).forEach(avatar => avatar.setAttribute(hiddenAttribute, hideStyle.selected));
      else if (blogAvatars.selected === 'filtered') post.querySelectorAll(avatarSelector).forEach(avatar => {
        const blog = avatar.querySelector('[title]').getAttribute('title');
        if (isFilteredBlog(blog)) avatar.querySelector(avatarInnerSelector).setAttribute(hiddenAttribute, hideStyle.selected);
      });

      if (hideStyle.selected === 'hidePost') post.querySelector(s('contentWrapper')).setAttribute(hiddenAttribute, hideStyle.selected);
      else {
        if (media) post.querySelectorAll(mediaSelector).forEach(media => media.setAttribute(hiddenAttribute, hideStyle.selected));
        if (text) post.querySelectorAll(textSelector).forEach(text => text.setAttribute(hiddenAttribute, hideStyle.selected));
      }

      if (dispelStyle.selected === 'click') post.querySelectorAll(`[${hiddenAttribute}]`).forEach(content => content.addEventListener('click', removeOnClick));
    }
  }
};

const run = async preferences => {
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
  } = preferences);

  filterBlogList = blogList.value.toLowerCase().replace(normalizeRegex, '').split(',');
  filterTagList = tagList.value.toLowerCase().replace(normalizeRegex, '').split(',');

  console.info(filterBlogList, filterTagList);

  mutationManager.start(postSelector, filterPosts);
};

export const main = async () => {
  const preferences = await getPreferences('safeScroll');
  run(preferences);
};

export const clean = async () => {
  $(`.${customClass}`).removeClass(customClass);
  $(`[${hiddenAttribute}]`).removeAttr(hiddenAttribute);
  mutationManager.stop(filterPosts);
};