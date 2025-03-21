import { getOptions, getJsonFile } from './utility/jsTools.js';
import { declarativeNetRequest } from './utility/dnr.js';
import { mutationManager } from './utility/mutations.js';
import { notificationSelector } from './utility/document.js';
import { notificationObject } from './utility/reactProps.js';

let showFrom;

const customAttribute = 'data-activity-popup-filter';

const filterNotifications = notifications => {
  notifications.map(async notification => {
    const note = await notificationObject(notification);
    const { followed, followingYou, fromTumblelogName, fromTumblelogs } = note;

    if (fromTumblelogs === void 0 && fromTumblelogName !== void 0) {
      if (showFrom.all
        || (showFrom.mutuals && followed && followingYou)
        || (showFrom.following && followed)
        || (showFrom.followers && followingYou)
      ) notification.setAttribute(customAttribute, '');
      else {
        notification.setAttribute(customAttribute, 'filtered');
      }
    }
  });
};

const removeRuleIds = ['APF:all', 'APF:mentions', 'APF:reblogs', 'APF:replies'];
const regexFilter = { // it's simply joyous that this is possible
  // eslint-disable-next-line no-useless-escape
  allTab: '^https?:\/\/www\.tumblr\.com\/api\/v2\/blog\/[\\w\\d-]*\/notifications$',
  // eslint-disable-next-line no-useless-escape
  mentionsTab: '^https?:\/\/www\.tumblr\.com\/api\/v2\/blog\/[\\w\\d-]*\/notifications.*mentions$',
  // eslint-disable-next-line no-useless-escape
  reblogsTab: '^https?:\/\/www\.tumblr\.com\/api\/v2\/blog\/[\\w\\d-]*\/notifications.*reblogs_no_content$',
  // eslint-disable-next-line no-useless-escape
  repliesTab: '^https?:\/\/www\.tumblr\.com\/api\/v2\/blog\/[\\w\\d-]*\/notifications.*replies$'
};
const filters = {
  "followers": "followers",
  "likes": "likes",
  "replies": "replies",
  "mentions": "mentions",
  "asks": "asks",
  "reblogs with content": "reblogs_with_content",
  "reblogs without content": "reblogs_no_content",
  "blaze": "blaze",
  "gifts": "gifts",
  "communities": "communities",
  "conversational notes": "conversational_notes",
  "content labels": "content_labels_flags",
  "gifs": "gifs",
  "posts you missed": "posts_you_missed",
  "new group blog members": "new_group_blog_member"
};

const urlQueryFromArray = (arr = []) => {
  arr = arr.filter(type => type in filters).map(type => `filters[${filters[type]}]=${filters[type]}`);
  return `?${arr.join('&')}`;
};

/*
  this feature amazingly doesn't interfere with the activity page itself because:
  a) any notifications loaded when the page is loaded are part of the initial state and aren't fetched via XHP
  b) any new notifications loaded in afterwards have an additional query param for the timestamp
 */

export const main = async () => {
  const feature = await getJsonFile('activityPopupFilter');
  const preferences = await getOptions('activityPopupFilter');
  ({ showFrom } = preferences);
  mutationManager.start(notificationSelector + `:not([${customAttribute}])`, filterNotifications);

  const enabled = ['allTab', 'mentionsTab', 'reblogsTab', 'repliesTab'].filter(key => feature.preferences.options[key].value.sort().join('') !== preferences[key].sort().join(''));
  if (enabled.length === 0) return;

  const newRules = enabled.map(key => declarativeNetRequest.newRule(`APF:${key}`, regexFilter[key], {
    type: 'redirect',
    redirect: {
      transform: {
        query: urlQueryFromArray(preferences[key])
      }
    }
  }));
  declarativeNetRequest.updateDynamicRules(newRules);
};

export const clean = async () => {
  declarativeNetRequest.clearDynamicRules(removeRuleIds);
  mutationManager.stop(filterNotifications);
  $(`[${customAttribute}]`).removeAttr(customAttribute);
};