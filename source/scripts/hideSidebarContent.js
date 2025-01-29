import { getOptions } from './utility/jsTools.js';
import { style, s } from './utility/style.js';

const styleElement = style('');
const blogRecSelectors = `${s('sidebarItem')}:has(${s('recommendedBlogs')}),${s('sidebarItem')}:has(${s('loadingBlogs')}),${s('desktopContainer')}:has(${s('recommendedBlogs')})`;
const emptyTagViewSelector = `${s('sidebar')} > aside > ${s('emptyTagView')}`;
const relatedSelector = `${s('sidebarItem')}:has(${s('relatedPosts')})`;
const radarSelector = `${s('sidebarItem')}:has(${s('radar')})`;
const adSelector = `${s('sidebarContent')}:has(${s('adContainer')})`;

export const main = async () => {
  const { blogRecommendations, emptyTagView, relatedPosts, radar, ads } = await getOptions('hideSidebarContent');
  const selectors = [];

  if (blogRecommendations) selectors.push(blogRecSelectors);
  if (emptyTagView) selectors.push(emptyTagViewSelector);
  if (relatedPosts) selectors.push(relatedSelector)
  if (radar) selectors.push(radarSelector);
  if (ads) selectors.push(adSelector);

  if (selectors.length) {
    styleElement.innerText = `${selectors.join(',')} { display: none !important; }`;
    document.body.append(styleElement);
  } else styleElement.remove();
};

export const clean = async () => styleElement.remove();