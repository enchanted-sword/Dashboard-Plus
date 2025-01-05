import { getOptions } from './utility/jsTools.js';
import { style, s } from './utility/style.js';
import { translate } from './utility/tumblr.js';

const badgeSelector = `${s('badgesContainer')},${s('peeprHeaderBadgesWrapper')}`;
const tipSelector = `${s('targetWrapperFlex')}:has(button[aria-label='${translate('Tip')}']),button[aria-label='${translate('Tip button')}']`;
const blazeSelector = `${s('controlIcon')}:has(button[aria-label='${translate('Blaze')}'])`;
const followSelector = `button[aria-label='${translate('Follow')}']`;
const styleElement = style('`.${hiddenClass} { display: none !important; }`');

export const main = async () => {
  const { badges, tips, blaze, follow } = await getOptions('hideInPosts');
  const selectors = [];

  if (badges) selectors.push(badgeSelector);
  if (tips) selectors.push(tipSelector);
  if (blaze) selectors.push(blazeSelector);
  if (follow) selectors.push(followSelector);

  if (selectors.length) {
    styleElement.innerText = `${selectors.join(',')} { display: none !important; }`;
    document.head.append(styleElement);
  } else styleElement.remove();
};

export const clean = async () => styleElement.remove();