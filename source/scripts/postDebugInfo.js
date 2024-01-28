import { postFunction } from './utility/mutations.js';
import { timelineObject } from './utility/reactProps.js';

const logPosts = async posts => {
  for (const post of posts) { console.log(post, await timelineObject(post)); }
};

export const main = async () => postFunction.start(logPosts);

export const clean = async () => postFunction.stop(logPosts);