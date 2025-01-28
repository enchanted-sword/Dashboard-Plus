import { getOptions } from './utility/jsTools.js';
import { style, s } from './utility/style.js';

const mutualLabelSelector = `${s('mutualsBadgeContainer')}`;
const followingLabelSelector = `${s('followingBadgeContainer')}`;
const styleElement = style('');

export const main = async () => {
  const { mutuals, following } = await getOptions('hideNotificationLabels');
  const selectors = [];

  if (mutuals) selectors.push(mutualLabelSelector);
  if (following) selectors.push(followingLabelSelector);

  console.log(selectors);
  if (selectors.length) {
    styleElement.innerText = `${selectors.join(',')} { display: none !important; }`;
    document.body.append(styleElement);
  } else styleElement.remove();
};

export const clean = async () => styleElement.remove();