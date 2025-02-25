import { getOptions } from './utility/jsTools.js';
import { style, s } from './utility/style.js';
import { mutationManager, postFunction } from './utility/mutations.js';
import { timelineObject } from './utility/reactProps.js';

const blogRecSelector = `${s('listTimelineObject')}:has(${s('blogLinkRecommendationWrapper')})`;
const tagRecSelector = `${s('listTimelineObject')}:has(${s('tagCard')})`;
const blazedSelector = `${s('listTimelineObject')}:has([href="#managed-icon__badge-blaze"])`;
const adSelector = `${s('listTimelineObject')}:has(${s('adTimelineObject')},${s('adMeatballMenu')})`;
const communitiesRecSelector = `${s('listTimelineObject')}:has(${s('communityCard')})`;
const hiddenClass = 'dbplus-hiddenInStream';
const checkedClass = 'dbplus-notCommunityRec';
const styleElement = style(`
  [data-cell-id*="timelineObject:title"]:has(+ [data-cell-id] .${hiddenClass}) ${s('listTimelineObject')},
    .${hiddenClass} { display: none !important; }
`);

const hideInStreamElements = elements => $(elements).addClass(hiddenClass);
const hideCommunityPosts = posts => posts.forEach(async post => {
  const { recommendationReason, community } = await timelineObject(post);
  if (recommendationReason && community && recommendationReason.icon === 'community' && !community.isMember) post.classList.add(hiddenClass);
  else post.classList.add(checkedClass);
})

const run = ({ blogRecommendations, tagRecommendations, blazedContent, inStreamAds, communities, communityPosts }) => {
  const selectors = [];

  if (blogRecommendations) selectors.push(blogRecSelector);
  if (tagRecommendations) selectors.push(tagRecSelector);
  if (blazedContent) selectors.push(blazedSelector);
  if (inStreamAds) selectors.push(adSelector);
  if (communities) selectors.push(communitiesRecSelector);

  if (communityPosts) postFunction.start(hideCommunityPosts, `:not(.${checkedClass})`);
  else postFunction.stop(hideCommunityPosts);

  if (selectors.length) {
    mutationManager.start(selectors.join(','), hideInStreamElements);
  }
};

export const main = async () => {
  const preferences = await getOptions('hideInStreamContent');

  run(preferences);
  document.body.append(styleElement);
};

export const clean = async () => {
  mutationManager.stop(hideInStreamElements);
  mutationManager.stop(hideCommunityPosts);
  $(`.${hiddenClass}`).removeClass(hiddenClass);
  styleElement.remove();
};

export const update = async preferences => run(preferences);