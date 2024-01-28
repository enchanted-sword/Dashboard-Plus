import { mutationManager } from './utility/mutations.js';
import { timelineObject } from './utility/reactProps.js';

const postSelector = '[tabindex="-1"][data-id] article';
const logPosts = async posts => {
  for (const post of posts) { console.log(post, await timelineObject(post)); }
};

export const main = async () => mutationManager.start(postSelector, logPosts);

export const clean = async () => mutationManager.stop(logPosts);