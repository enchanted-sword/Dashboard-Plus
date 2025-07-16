import { getOptions } from './utility/jsTools.js';
let linkOptions;

export const main = async () => {
  ({ linkOptions } = await getOptions('linkToTheme'))
};
export const clean = async () => { };