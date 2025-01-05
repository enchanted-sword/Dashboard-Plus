import { getOptions } from './utility/jsTools.js';
import { style } from './utility/style.js';
import { hexToRgbString } from './utility/color.js';

const styleElement = style('');

const run = ({ colors }) => {
  Object.keys(colors).forEach(hex => colors[hex] = hexToRgbString(colors[hex]));
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
      --accent: ${colors.accent} !important;
      --secondary-accent: ${colors.secondaryAccent} !important;
      --follow: ${colors.follow} !important;
    }
  `;
};

export const main = async () => {
  const preferences = await getOptions('customColors');

  run(preferences);
  document.getElementById('root').append(styleElement);
}

export const clean = async () => styleElement.remove();

export const update = async preferences => run(preferences);