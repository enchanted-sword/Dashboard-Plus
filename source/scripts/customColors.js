import { getOptions } from './utility/jsTools.js';
import { style } from './utility/style.js';

const styleElement = style('');

const newToOldRgb = rgba => { // tumblr uses the old rgb format, rgba(r,g,b,a), whereas dbplus internals use the new format, rgb(r g b / a)
  const [r, g, b] = rgba.replace(/[^\d]/g, ' ').replace(/\s{2,}/g, ' ').trim().split(' ');
  return `${r},${g},${b}`;
}

const run = preferences => {
  const colors = Object.fromEntries(Object.entries(preferences).filter(([key]) => key !== 'menuTheme').map(([key, color]) => [key, newToOldRgb(color)]));
  styleElement.innerText = `
    :root {
      --black: ${colors.black} !important;
      --white: ${colors.white} !important;
      --white-on-dark: ${colors.whiteOnDark} !important;
      --navy: ${colors.navy} !important;
      --red: ${colors.red} !important;
      --orange: ${colors.orange} !important;
      --yellow: ${colors.yellow} !important;
      --green: ${colors.green} !important;
      --blue: ${colors.blue} !important;
      --purple: ${colors.purple} !important;
      --pink: ${colors.pink} !important;
      --accent: rgba(${colors.accent}, 1) !important;

      --color-primary-link: rgb(${colors.accent}) !important;
      --unread-tint: rgba(${colors.accent}, .1) !important;

      --chrome: rgba(${colors.navy}, 1) !important;
      --chrome-ui: rgba(${colors.accent}, 1) !important;
      --chrome-ui-hover: color-mix(in srgb, rgb(${colors.accent}), white 10%) !important;
    }
  `;
};

export const main = async () => {
  const preferences = await getOptions('customColors');

  run(preferences);
  document.head.append(styleElement);
}

export const clean = async () => styleElement.remove();

export const update = async preferences => run(preferences);