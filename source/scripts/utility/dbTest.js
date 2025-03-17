import { primaryBlogName } from './user.js';
import { apiFetch } from './tumblr.js';
import { updateData } from './database.js';

let offset = 0;

const loadPage = async () => apiFetch(`/v2/blog/${primaryBlogName}/posts?offset=${offset}`);

const cachePage = async () => {

  let { response: { posts } } = await loadPage(offset);
  posts = posts.filter(({ objectType }) => objectType === 'post');
  console.log(`cache offset: ${offset}`);
  offset += posts.length;

  return updateData({ postStore: posts });
};

export const fillDb = async (startOffset, limit) => {
  offset = startOffset;

  while (offset - startOffset < limit) {
    await cachePage();
  }
}