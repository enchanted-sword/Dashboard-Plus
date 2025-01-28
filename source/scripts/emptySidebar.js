import { style, s } from './utility/style.js';
import { getOptions } from './utility/jsTools.js';

let collapseStyle;
const styleElement = style('');

export const main = async () => {
  ({ collapseStyle } = await getOptions('emptySidebar'));

  if (collapseStyle === 'never') return;

  const sidebar = document.querySelector(s('sidebar'));
  let empty = true;

  Array.from(sidebar.children[0].children).forEach(elem => {
    if (elem.style.display !== 'none' && elem.getBoundingClientRect().height > 0) empty = false;
  });

  if (empty || collapseStyle === 'force') {
    styleElement.innerText = `${s('sidebar')} { display: none; }`;
    document.body.append(styleElement);
  }
};

export const clean = async () => styleElement.remove();