import { getOptions } from './utility/jsTools.js';
import { style, s } from './utility/style.js';

const styleElement = style('');

const run = ({ scale }) => {
  styleElement.innerText = `
    [data-css~="conversationWindow"] {
      --dbplus-messagingScale: ${scale} !important;

      &:has([data-css~="conversation"]:not(.dbplus-revertMessaging)) {
        width: calc(360px * var(--dbplus-messagingScale)); 
        height: calc(560px * var(--dbplus-messagingScale));
        max-height: calc(100vh - 80px);
      }
    }
  `;

  return true;
};

export const main = async () => {
  const preferences = await getOptions('messagingScale');

  if (run(preferences)) document.head.append(styleElement);
};

export const clean = async () => styleElement.remove();

export const update = async preferences => run(preferences);