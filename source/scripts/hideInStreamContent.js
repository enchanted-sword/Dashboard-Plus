import { getOptions } from './utility/jsTools.js';
import { style, s } from './utility/style.js';
import { mutationManager } from './utility/mutations.js';

let blogRecommendations, tagRecommendations, blazedContent, inStreamAds;
const blogRecSelector = `[data-cell-id*="timelineObject:carousel"] ${s('listTimelineObject')}:has(${s('blogLinkRecommendationWrapper')})`;
const tagRecSelector = `[data-cell-id*="timelineObject:carousel"] ${s('listTimelineObject')}:has(${s('tagCard')})`;
const blazedSelector = `${s('listTimelineObject')}:has([href="#managed-icon__badge-blaze"])`;
const adSelector = `${s('listTimelineObject')}:has(${s('adTimelineObject')})`;
const hiddenClass = 'dbplus-hiddenInStream';
const styleElement = style(`
  [data-cell-id*="timelineObject:title"]:has(+ [data-cell-id*="timelineObject:carousel"] ${s('listTimelineObject')}.${hiddenClass}),
    .${hiddenClass} { display: none !important; }
`);

const hideInStreamElements = elements => $(elements).addClass(hiddenClass);

export const main = async () => {
  const selectors = [];
  ({ blogRecommendations, tagRecommendations, blazedContent, inStreamAds } = await getOptions('hideInStreamContent'));

  if (blogRecommendations) selectors.push(blogRecSelector);
  if (tagRecommendations) selectors.push(tagRecSelector);
  if (blazedContent) selectors.push(blazedSelector);
  if (inStreamAds) selectors.push(adSelector);

  if (selectors.length) {
    mutationManager.start(selectors.join(','), hideInStreamElements);
    document.head.append(styleElement);
  }
};

export const clean = async () => {
  mutationManager.stop(hideInStreamElements);
  $(`.${hiddenClass}`).removeClass(hiddenClass);
  styleElement.remove();
};

export const update = true;