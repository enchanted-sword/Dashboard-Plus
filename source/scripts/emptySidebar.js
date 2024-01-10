import { style, s } from './utility/style.js';
import { getPreferences } from './utility/jsTools.js';

let selected;
const styleElement = style('');

export const main = async () => {
  ({ selected } = await getPreferences('emptySidebar'));

  if (selected === 'never') return;

  const sidebar = document.querySelector(s('sidebar'));
  let empty = true;

  Array.from(sidebar.children[0].children).forEach(elem => {
    if (elem.style.display !== 'none' && elem.getBoundingClientRect().height > 0) empty = false;
  });

  if (empty || selected === 'force') {
    styleElement.innerText = `${s('sidebar')} { display: none; }`;
    document.head.append(styleElement);
  }
};

export const clean = async () => styleElement.remove();