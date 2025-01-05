import { getOptions, getJsonFile } from './utility/jsTools.js';
import { declarativeNetRequest } from './utility/dnr.js';

const removeRuleIds = ['APF:all', 'APF:mentions', 'APF:reblogs', 'APF:replies'];
const regexFilter = { // it's simply joyous that this is possible
  // eslint-disable-next-line no-useless-escape
  all: '^https?:\/\/www\.tumblr\.com\/api\/v2\/blog/[\\w\\d-]*\/notifications\\?rollups=true$',
  // eslint-disable-next-line no-useless-escape
  mentions: '^https?:\/\/www\.tumblr\.com\/api\/v2\/blog\/[\\w\\d-]*\/notifications.*mention_in_reply$',
  // eslint-disable-next-line no-useless-escape
  reblogs: '^https?:\/\/www\.tumblr\.com\/api\/v2\/blog\/[\\w\\d-]*\/notifications.*tags$',
  // eslint-disable-next-line no-useless-escape
  replies: '^https?:\/\/www\.tumblr\.com\/api\/v2\/blog\/[\\w\\d-]*\/notifications.*reply_to_comment$'
};
const map = {
  "rollups": ["rollups"],
  "asks": [
    "answered_ask",
    "ask"
  ],
  "replies": ['reply'],
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
  "conversational notes": ["conversational_note"],
  "follows": ["follow"],
  "gifts": ["gift"],
  "likes": ["like"],
  "milestones": [
    "milestone_like",
    "milestone_like_received",
    "milestone_post",
    "milestone_reblog_received",
    "milestone_birthday"
  ],
  "new group blog members": ["new_group_blog_member"],
  "post flagged": [
    "post_appeal_accepted",
    "post_appeal_rejected",
    "post_flagged"
  ],
  "post attribution": ["post_attribution"],
  "posting prompts": ["posting_prompt",],
  "reblogs without comments": ["reblog_naked"],
  "reblogs with comments": ["reblog_with_content"],
  "reblogs with tags": ["tags"],
  "badges": ["earned_badge",],
  "what you missed": ["what_you_missed"],
  "back in town": ["back_in_town"],
  "spam reported": ["spam_reported"],
  "boops": ["boop"],
  "communities moderation": ['community_admin_promoted', 'community_member_kicked', 'community_moderator_demoted', 'community_moderator_promoted', 'community_post_removed', 'community_reply_removed', 'community_request_approved'],
  "communities": ['community_invitation', 'community_membership_request_accepted', 'community_membership_request_declined', 'community_reaction_count']
};

const urlQueryFromArray = (arr = []) => {
  const rollups = arr.includes('rollups');
  arr = arr.flatMap(category => map[category]).map((type, index) => `types[${index}]=${type}`);
  return `?rollups=${rollups}&${arr.join('&')}`;
};

/* 
  this feature amazingly doesn't interfere with the activity page itself because:
  a) the default activity page notifications served fetched via html (possibly?)
  b) all other activity page fetches end with type[n]=earned_badge and can be filtered out
  c) any notifications loaded when the page is loaded are part of the initial state and aren't fetched via XHP
  d) any new notifications loaded in afterwards have an additional query param for the timestamp
 */

export const main = async () => {
  const feature = await getJsonFile('activityPopupFilter');
  const preferences = await getOptions('activityPopupFilter');
  const enabled = Object.keys(preferences).filter(key => feature.preferences.options[key].value.sort().join('') !== preferences[key].sort().join(''));
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

export const clean = async () => declarativeNetRequest.clearDynamicRules(removeRuleIds);