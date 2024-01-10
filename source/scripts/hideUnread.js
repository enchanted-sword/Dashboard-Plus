import { getPreferences } from './utility/jsTools.js';
import { style, s } from './utility/style.js';

const styleElement = style('');
const homeBadgeSelector = `[data-title="Home"] ${s('notificationBadge')}`;
const activityBadgeSelector = `[data-title="Activity"] ${s('notificationBadge')}`;
const inboxBadgeSelector = `[data-title="Inbox"] ${s('notificationBadge')}`;

const title = document.querySelector('title');
const modifyTitle = () => title.innerText = title.innerText.replace(/\([\d]+[+]?\)[\s]?/, '');
const titleObserver = new MutationObserver(modifyTitle);

export const main = async () => {
  const { posts, postsOnTab, activity, inbox } = await getPreferences('hideUnread');
  const selectors = [];

  if (posts) selectors.push(homeBadgeSelector);
  if (activity) selectors.push(activityBadgeSelector);
  if (inbox) selectors.push(inboxBadgeSelector);
  if (postsOnTab) {
    modifyTitle();
    titleObserver.observe(title, { subtree: true, characterData: true });
  }
  
  styleElement.innerText = `${selectors.join(',')} { display: none !important; }`
  document.head.append(styleElement);
};

export const clean = async () => {
  styleElement.remove();
  titleObserver.disconnect();
};
