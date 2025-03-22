import { getOptions } from './utility/jsTools.js';
import { style, s } from './utility/style.js';

const styleElement = style('');

const run = ({ radius }) => {
  styleElement.innerText = `
    :root {
      --dbplus-cornerRadius: ${radius}px;
    }
    ${s('postColumn')} > ${s('bar')}, 
    ${s('activityPopover')} ${s('selectorPopover')},
    article${s('post')}, ${s('tabManagement')},
    ${s('selectorPopover')}:has(${s('blogsList')}),
    ${s('searchbarContainer')},
    .dbplus-timelineSearchContainer { border-radius: ${radius}px !important; }
    article${s('post')} header { border-radius: ${radius}px ${radius}px 0 0 !important; }
  `;

  return true;
};

export const main = async () => {
  const preferences = await getOptions('cornerRadii');

  if (run(preferences)) document.body.append(styleElement);
};

export const clean = async () => styleElement.remove();

export const update = async preferences => run(preferences);