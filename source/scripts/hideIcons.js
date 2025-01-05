import { getOptions } from './utility/jsTools.js';
import { style, s } from './utility/style.js';

const shopSelector = `${s('targetPopoverWrapper')}:has([data-title="TumblrMart"]),${s('targetWrapper')}:has([data-title='TumblrMart']),${s('navItem')}[data-title="Payment & Purchases"]`;
const exploreSelector = `${s('navItem')}[data-title="Explore"]`;
const communitiesSelector = `${s('navItem')}:has([href="/communities/browse"])`;
const styleElement = style('');

const run = ({ shop, explore, communities }) => {
  const selectors = [];

  if (shop) selectors.push(shopSelector);
  if (explore) selectors.push(exploreSelector);
  if (communities) selectors.push(communitiesSelector);

  if (selectors.length) {
    styleElement.innerText = `${selectors.join(',')} { display: none !important; }`;
    return true
  } else return false;

};

export const main = async () => {
  const preferences = await getOptions('hideIcons');

  if (run(preferences)) document.head.append(styleElement);
};

export const clean = async () => styleElement.remove();

export const update = async options => run(options);