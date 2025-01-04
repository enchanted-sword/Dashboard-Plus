import { getPreferences } from './utility/jsTools.js';
import { style, s } from './utility/style.js';

const shopSelector = `${s('targetPopoverWrapper')}:has([data-title="TumblrMart"]),${s('targetWrapper')}:has([data-title='TumblrMart']),${s('navItem')}[data-title="Payment & Purchases"]`;
const exploreSelector = `${s('navItem')}[data-title="Explore"]`;
const domainsSelector = `${s('navItem')}:has([href="/domains"]),ul${s('sideBar')}>li:has([href="/settings/domains"])`;
const styleElement = style('');

const run = ({ shop, explore, domains }) => {
  const selectors = [];

  if (shop) selectors.push(shopSelector);
  if (explore) selectors.push(exploreSelector);
  if (domains) selectors.push(domainsSelector);

  if (selectors.length) { 
    styleElement.innerText = `${selectors.join(',')} { display: none !important; }`;
    return true
  } else return false;

};

export const main = async () => {
  const preferences = await getPreferences('hideIcons');
  
  if(run(preferences)) document.head.append(styleElement);
};

export const clean = async () => styleElement.remove();

export const update = async ({ options }) => run(options);