import { mutationManager } from './utility/mutations.js';
import { s } from './utility/style.js'

const buttonSelector = `${s('adultBlogWall')} button`;
const buttonHandler = async buttons => {
  for (const button of buttons) { button.click(); }
};

export const main = async () => mutationManager.start(buttonSelector, buttonHandler);

export const clean = async () => mutationManager.stop(buttonHandler);