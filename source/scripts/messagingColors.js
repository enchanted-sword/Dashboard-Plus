import { style, s } from './utility/style.js';
import { getOptions } from './utility/jsTools.js';
import { mutationManager } from './utility/mutations.js';
import { conversationInfo } from './utility/reactProps.js';
import { conversationSelector } from './utility/document.js';
import { getThemeColor, hexToRgbString, contrastBW } from './utility/color.js';

const customClass = 'dbplus-messagingColor';

let styleElement = style('');
styleElement.classList.add(customClass);

const colorMessaging = async conversations => {
  for (const conversation of conversations) {
    conversationInfo(conversation).then(({ headerImageFocused, backgroundColor, titleColor, linkColor }) => {
      const messageBackground = contrastBW(titleColor);
      const timestampColor = contrastBW(backgroundColor);

      const uniqueStyleElement = style(`
        ${s('conversation')} {
          ${s('headerWrapper')} { background: no-repeat top/100% url(${headerImageFocused}) !important; }
          --dbplus-backgroundColor: ${hexToRgbString(backgroundColor)};
          --dbplus-messageBackground: ${messageBackground};
          --dbplus-titleColor: ${hexToRgbString(titleColor)};
          --dbplus-linkColor: ${hexToRgbString(linkColor)};
          --dbplus-timestampColor: ${timestampColor};
        }
      `);
      uniqueStyleElement.classList.add(customClass);
      conversation.append(uniqueStyleElement);
    });
  }
}

const run = ({ colorStyle, customColors }) => {
  let headerBackground, backgroundColor, messageBackground, titleColor, linkColor, timestampColor;

  switch (colorStyle) {
    case 'theme':
      mutationManager.stop(colorMessaging);

      headerBackground = getThemeColor('white');
      backgroundColor = headerBackground;
      messageBackground = getThemeColor('secondary-accent');
      titleColor = getThemeColor('black');
      linkColor = titleColor;
      timestampColor = titleColor;
      break;
    case 'blog':
      mutationManager.start(conversationSelector, colorMessaging);
      break;
    case 'custom':
      mutationManager.stop(colorMessaging);

      headerBackground = hexToRgbString(customColors.backgroundColor);
      backgroundColor = headerBackground;
      messageBackground = hexToRgbString(customColors.messageColor);
      titleColor = hexToRgbString(customColors.textColor);
      linkColor = titleColor;
      timestampColor = titleColor;
      break;
  }

  if (colorStyle === 'theme' || colorStyle === 'custom') {
    styleElement.innerText = `
      :root {
        --dbplus-headerBackground: ${headerBackground};
        --dbplus-backgroundColor: ${backgroundColor};
        --dbplus-messageBackground: ${messageBackground};
        --dbplus-titleColor: ${titleColor};
        --dbplus-linkColor: ${linkColor};
        --dbplus-timestampColor: ${timestampColor};
      }
    `;
  } else styleElement.innerText = '';
};

export const main = async () => {
  const preferences = await getOptions('messagingColors');

  run(preferences);
  document.body.append(styleElement);
};

export const clean = async () => {
  mutationManager.stop(colorMessaging);
  $(`${conversationSelector}.${customClass}`).removeClass(customClass);
  $(`.${customClass}`).remove();
};

export const update = async preferences => run(preferences);