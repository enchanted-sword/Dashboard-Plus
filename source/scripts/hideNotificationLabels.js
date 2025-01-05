import { getOptions } from './utility/jsTools.js';
import { style, s } from './utility/style.js';

const mutualLabelSelector = `${s('mutualsBadgeContainer')}`;
const followingLabelSelector = `${s('followingBadgeContainer')}`;
const styleElement = style('');

const run = ({ mutuals, following }) => {
  const selectors = [];

  if (mutuals) selectors.push(mutualLabelSelector);
  if (following) selectors.push(followingLabelSelector);

  if (selectors.length) {
    styleElement.innerText = `${selectors.join(',')} { display: none !important; }`;
    return true
  } else return false;

};

export const main = async () => {
  const preferences = await getOptions('hideNotificationLabels');

  if (run(preferences)) document.head.append(styleElement);
};

export const clean = async () => styleElement.remove();

export const update = async preferences => run(preferences);