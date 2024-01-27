import { style, s } from './utility/style.js';
import { mutationManager } from './utility/mutations.js';
import { conversationInfo } from './utility/reactProps.js';
import { conversationSelector } from './utility/document.js';

const customClass = 'dbplus-revertMessaging';

const revertMessaging = async conversations => {
  for (const conversation of conversations) {
    conversationInfo(conversation).then(({ otherParticipantName, selectedBlogName }) => {
      conversation.classList.add(customClass);
      conversation.id = `dbplus-messaging-${otherParticipantName}-${selectedBlogName}`;

      const join = $(`<span class='${customClass}'> + </span>`);
      const newParticipant = $(`
        <a target='_blank' rel='noopener' href='/${selectedBlogName}' role='link' class='dbplus-customPopover-blogLink ${customClass}' tabindex='0'>
          ${selectedBlogName}
        </a>
      `);
      
      const participant = $(conversation).find(s('participantName'));
      participant.append(join);
      participant.append(newParticipant);

      $(conversation).find(`${s('footer')} ${s('avatarWrapper')}`).hide();
      $(conversation).find(`${s('participant')} ${s('avatarWrapper')}`).hide();

      const styleElement = style(`
        #dbplus-messaging-${otherParticipantName}-${selectedBlogName} {
          ${s('message')}:has(${s('ownMessage')},${s('timestamp')}) + ${s('message')} ${s('bubble')}:not(${s('ownMessage')}):before,
          ${s('message')}:has(${s('bubble')}:not(${s('ownMessage')}),${s('timestamp')}) + ${s('message')} ${s('bubble')}${s('ownMessage')}:before {
            position: absolute;
            content: "";
            width: 32px;
            height: 32px;
            left: -4px;
            border-radius: 16px;
            background-size: contain;
          }
          ${s('message')}:has(${s('ownMessage')},${s('timestamp')}) + ${s('message')} ${s('bubble')}:not(${s('ownMessage')}):before { background-image: url(https://api.tumblr.com/v2/blog/${otherParticipantName}/avatar/64); }
          ${s('message')}:has(${s('bubble')}:not(${s('ownMessage')}),${s('timestamp')}) + ${s('message')} ${s('bubble')}${s('ownMessage')}:before { background-image: url(https://api.tumblr.com/v2/blog/${selectedBlogName}/avatar/64); }
          ${s('messageText')}${s('ownMessage')} ${s('messageHeader')}:before { content: "${selectedBlogName}"; }
          ${s('messageText')}:not(${s('ownMessage')}) ${s('messageHeader')}:before { content: "${otherParticipantName}"; }
        }
      `);
      styleElement.classList.add(customClass);
      conversation.append(styleElement);
    });
  }
}

export const main = async () => mutationManager.start(conversationSelector, revertMessaging);

export const clean = async () => {
  mutationManager.stop(revertMessaging);
  $(`${conversationSelector}.${customClass}`).removeClass(customClass);
  $(`.${customClass}`).remove();
  $(`${s('footer')} ${s('avatarWrapper')}`).show();
  $(`${s('participant')} ${s('avatarWrapper')}`).show();
};