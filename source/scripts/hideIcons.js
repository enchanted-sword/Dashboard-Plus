import { getOptions } from './utility/jsTools.js';
import { style, s } from './utility/style.js';

const shopSelector = `${s('targetPopoverWrapper')}:has([data-title="TumblrMart"]),${s('targetWrapper')}:has([data-title='TumblrMart']),${s('navItem')}[data-title="Payment & Purchases"]`;
const exploreSelector = `${s('navItem')}[data-title="Explore"]`;
const communitiesSelector = `${s('navItem')}:has([href="/communities/browse"])`;
const styleElement = style('');

export const main = async () => {
  const { shop, explore, communities } = await getOptions('hideIcons');
  const selectors = [];

  if (shop) selectors.push(shopSelector);
  if (explore) selectors.push(exploreSelector);
  if (communities) selectors.push(communitiesSelector);

  if (selectors.length) {
    styleElement.innerText = `${selectors.join(',')} { display: none !important; }`;
    document.head.append(styleElement);
  }
  else styleElement.remove();
};

export const clean = async () => styleElement.remove();