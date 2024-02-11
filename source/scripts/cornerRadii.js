import { getPreferences } from './utility/jsTools.js';
import { style, s } from './utility/style.js';

const styleElement = style('');

const run = ({ value }) => {
  if (value.enabled === false) return false;
  
  styleElement.innerText = `
    ${s('postColumn')} > ${s('bar')}, 
    ${s('activityPopover')} ${s('selectorPopover')},
    article${s('post')}, ${s('tabManagement')},
    ${s('selectorPopover')}:has(${s('blogsList')}) { border-radius: ${value.value}px !important; }
    article${s('post')} header { border-radius: ${value.value}px ${value.value}px 0 0 !important; }
  `;

  return true;
};

export const main = async () => {
  const preferences = await getPreferences('cornerRadii');

  if (run(preferences)) document.head.append(styleElement);
};

export const clean = async () => styleElement.remove();

export const update = async ({ preferences }) => run(preferences);