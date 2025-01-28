import { getOptions } from './utility/jsTools.js';
import { style, s } from './utility/style.js';

const styleElement = style('');
const homeBadgeSelector = `[data-title="Home"] ${s('notificationBadge')}`;
const activityBadgeSelector = `[data-title="Activity"] ${s('notificationBadge')}`;
const inboxBadgeSelector = `[data-title="Inbox"] ${s('notificationBadge')}`;
const messagingBadgeSelector = `[data-title="Messages"] ${s('notificationBadge')}, ${s('notification')} [role="status"]${s('notificationBadge')}`;

const title = document.querySelector('title');
const modifyTitle = () => title.innerText = title.innerText.replace(/\([\d]+[+]?\)[\s]?/, '');
const titleObserver = new MutationObserver(modifyTitle);

export const main = async () => {
  const { posts, postsOnTab, activity, inbox, messaging } = await getOptions('hideUnread');
  const selectors = [];

  if (posts) selectors.push(homeBadgeSelector);
  if (activity) selectors.push(activityBadgeSelector);
  if (inbox) selectors.push(inboxBadgeSelector);
  if (messaging) selectors.push(messagingBadgeSelector);
  if (postsOnTab) {
    modifyTitle();
    titleObserver.observe(title, { subtree: true, characterData: true });
  } else titleObserver.disconnect();

  if (selectors.length) {
    styleElement.innerText = `${selectors.join(',')} { display: none !important; }`;
    document.body.append(styleElement);
  }
};

export const clean = async () => {
  styleElement.remove();
  titleObserver.disconnect();
};
