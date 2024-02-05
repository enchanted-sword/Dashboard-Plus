import { getPreferences } from './utility/jsTools.js';
import { declarativeNetRequest } from './utility/dnr.js';

const removeRuleIds = ['APF:all', 'APF:mentions', 'APF:reblogs', 'APF:replies'];
const regexFilter = {
  all: '^https?://www\\.tumblr\\.com/api/v2/blog/[\\w\\d-]*/notifications.*earned_badge$',
  mentions: '^https?://www\\.tumblr\\.com/api/v2/blog/[\\w\\d-]*/notifications.*mention_in_reply$',
  reblogs: '^https?://www\\.tumblr\\.com/api/v2/blog/[\\w\\d-]*/notifications.*tags$',
  replies: '^https?://www\\.tumblr\\.com/api/v2/blog/[\\w\\d-]*/notifications.*reply$'
};
const map = {
  "rollups": [ "rollups" ],
  "asks": [
    "answered_ask",
    "ask"
  ],
  "replies": [ 'reply' ],
  "blaze": [
    "blaze_approved",
    "blaze_completed",
    "blaze_rejected",
    "blaze_golden_buzzed",
    "blaze_blazee_created",
    "blaze_blazer_canceled",
    "blaze_blazee_canceled",
    "blaze_blazer_approved",
    "blaze_blazee_approved",
    "blaze_blazer_golden_buzzed",
    "blaze_blazee_golden_buzzed",
    "blaze_blazer_rejected",
    "blaze_blazee_rejected",
    "blaze_blazer_extinguished",
    "blaze_blazee_extinguished",
    "blaze_blazer_completed",
    "blaze_blazee_completed"
  ],
  "mentions": [
    "mention_in_post",
    "mention_in_reply"
  ],
  "tips": [
    "tip",
    "tip_blog"
  ],
  "community labels": [
    "post_community_label_flagged",
    "post_community_label_accepted",
    "post_community_label_rejected"
  ],
  "conversational notes": [ "conversational_note" ],
  "follows": [ "follow" ],
  "gifts": [ "gift" ],
  "likes": [ "like" ],
  "milestones": [
    "milestone_like",
    "milestone_like_received",
    "milestone_post",
    "milestone_reblog_received",
    "milestone_birthday"
  ],
  "new group blog members": [ "new_group_blog_member" ],
  "post flagged": [
    "post_appeal_accepted",
    "post_appeal_rejected",
    "post_flagged"
  ],
  "post attribution": [ "post_attribution" ],
  "posting prompts": [ "posting_prompt", ],
  "reblogs without comments": [ "reblog_naked" ],
  "reblogs with comments": [ "reblog_with_content" ],
  "reblogs with tags": [ "tags" ],
  "badges": [ "earned_badge", ],
  "what you missed": [ "what_you_missed" ],
  "back in town": [ "back_in_town" ],
  "spam reported": [ "spam_reported" ]
};

const urlQueryFromArray = (arr = []) => {
  const rollups = arr.includes('rollups');
  arr = arr.flatMap(category => map[category]).map((type, index) => `types[${index}]=${type}`);
  return `?rollups=${rollups}&${arr.join('&')}`;
};

export const main = async () => {
  const preferences = await getPreferences('activityPopupFilter');
  const enabled = Object.keys(preferences).filter(preference => preferences[preference].enabled);
  if (enabled.length === 0) return;

  const newRules = enabled.map(type => declarativeNetRequest.newRule(`APF:${type}`, regexFilter[type], {
    type : 'redirect',
    redirect: {
      transform: {
        query: urlQueryFromArray(preferences[type].list)
      }
    }
  }));
  declarativeNetRequest.updateDynamicRules(newRules);
};

export const clean = async () => declarativeNetRequest.clearDynamicRules(removeRuleIds);