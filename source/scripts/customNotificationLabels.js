import { getOptions } from './utility/jsTools.js';
import { s } from './utility/style.js';
import { mutationManager } from './utility/mutations.js';
import { apiFetch } from './utility/tumblr.js';
import { notificationObject } from './utility/reactProps.js';
import { notificationSelector } from './utility/document.js';
import { svgIconString } from './utility/dashboardElements.js';

const untitledStrings = [
  'Untitled', // en
  'Sans titre', // fr
  'Intitulado', // es
  'Ohne titel', // de
  'Senza titolo', // it
  '無題', // jp
  'Başlıksız', // tr
  'Без названия', // ru
  'Bez tytułu', // pl
  'Sem título', // pt
  'Ongetiteld', // nl
  '무제', // ko
  '无标题', // zh
  'Tanpa judul', // id
  'शीर्षकहीन' // hi
];
const followingYouLabel = () => $(`
  <div class="dbplus-customLabelContainer dbplus-followingYou">
    Following You
    ${svgIconString('profile-checkmark', 12, 12, 'dbplus-customLabelIcon', 'rgb(var(--blue))')}
    <span class="dbplus-customLabelInfo dbplus-followingYou">
      This blog is following you. This feature is added by Dashboard Plus.
    </span>
  </div>
`);
const potentialBotLabel = () => $(`
  <div class="dbplus-customLabelContainer dbplus-potentialBot">
    Potential Bot
    ${svgIconString('warning-circle', 12, 12, 'dbplus-customLabelIcon', 'rgb(var(--red))')}
    <span class="dbplus-customLabelInfo dbplus-potentialBot">
     This blog may be a bot; block at your own discretion. This feature is added by Dashboard Plus.
    </span>
  </div>
`);

const addFollowingYouLabels = async notifications => {
  for (const notification of notifications) {
    const { followingYou, mutuals } = await notificationObject(notification);
    if (followingYou && !mutuals && !notification.querySelector('.dbplus-customLabelContainer')) {
      $(notification).find(s('tumblelogName')).append(followingYouLabel());
    }
  }
};
const addPotentialBotLabels = async notifications => {
  for (const notification of notifications) {
    const { type, fromTumblelogUuid } = await notificationObject(notification);
    if (type === 'follower') {
      apiFetch(`/v2/blog/${fromTumblelogUuid}/info`).then(response => {
        const { title, name, posts, likes } = response.response.blog;
        if ((posts === 0 && untitledStrings.includes(title))
          || (likes === 0 && untitledStrings.includes(title))
          || (name === title && posts === 1)) {
          $(notification).find('.dbplus-customLabelContainer').remove();
          $(notification).css({ backgroundColor: 'rgba(255,37,47,.15)' });
          $(notification).find(s('tumblelogName')).append(potentialBotLabel());
        }
      });
    }
  }
};

export const main = async () => {
  const { followingYou, potentialBot } = await getOptions('customNotificationLabels');

  if (followingYou) mutationManager.start(notificationSelector, addFollowingYouLabels);
  if (potentialBot) mutationManager.start(notificationSelector, addPotentialBotLabels);
};

export const clean = async () => {
  mutationManager.stop(addFollowingYouLabels);
  mutationManager.stop(addPotentialBotLabels);

  $('.dbplus-followingYou, .dbplus-potentialBot').remove();
};