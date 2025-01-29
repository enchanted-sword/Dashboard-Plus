import { openDatabase, updateData, updateNeeded } from './utility/database.js';
import { unique } from './utility/jsTools.js';

let db, postIndices, searchableIndices;

const keywordSearch = async (...keywords) => {
  const tx = db.transaction('searchStore', 'readonly');
  const hits = [];
  let cursor = await tx.store.openCursor(), searchable;


  while (cursor) {
    searchable = cursor.value;
    if (keywords.every(keyword => searchable.quickInfo.includes(keyword))) hits.push(searchable);
    cursor = await cursor.continue();
  }

  return hits;
};
const categorySearch = async ({ blogs, types, texts, tags }) => {
  const checks = [blogs, types, texts, tags].filter(isDefined);
  let hits = await keywordSearch(...checks);
  return hits;
};

const isDefined = x => !!x;
const quickInfo = ({ id, blog, content, trail, tags }) => {
  const blogs = [blog, ...trail.map(({ blog }) => blog)].filter(isDefined);
  const contents = unique([...content, ...trail.flatMap(({ content }) => content)].filter(isDefined));
  const tagStr = unique([...tags, ...trail.flatMap(({ tags }) => tags)]).join(',');
  const texts = unique(contents.map(({ question, answers, text }) => {
    const returnArr = [];
    question && returnArr.push(question);
    answers && returnArr.push(...answers.map(({ answerText }) => answerText));
    text && returnArr.push(text);
    return returnArr;
  }).flat(Infinity)).filter(isDefined).join(',');

  return JSON.stringify({
    id,
    blogs: unique(blogs.map(blog => blog.name)).join(','),
    types: unique(contents.map(({ type }) => type)).join(','),
    texts,
    tags: tagStr
  });
}
const indexPosts = async (force = false) => {
  const tx = db.transaction('postStore', 'readonly');
  let cursor = await tx.store.openCursor(), post;

  while (cursor) {
    post = cursor.value;
    if (!searchableIndices.includes(post.id) || updateNeeded(post) || force) {
      const searchable = { id: post.id, summary: post.summary, postUrl: post.postUrl, quickInfo: quickInfo(post) };
      updateData({ searchStore: searchable }).then(() => {
        if (searchableIndices.includes(post.id)) searchableIndices.push(post.id);
      });
    }
    cursor = await cursor.continue();
  }
};
const indexFromUpdate = async ({ detail: { targets } }) => { // take advantage of dispatched events to index new posts for free without opening extra cursors
  if ('postStore' in targets) {
    [targets.postStore].flat().map(post => {
      if (postIndices.includes(post.id)) postIndices.push(post.id);
      if (!searchableIndices.includes(post.id) || updateNeeded(post)) {
        const searchable = { id: post.id, summary: post.summary, postUrl: post.postUrl, quickInfo: quickInfo(post) };
        updateData({ searchStore: searchable }).then(() => {
          if (searchableIndices.includes(post.id)) searchableIndices.push(post.id);
        });
      }
    });
  }
};

export const main = async () => {
  db = await openDatabase();
  postIndices = await db.getAllKeys('postStore');
  searchableIndices = await db.getAllKeys('searchStore');

  indexPosts();
  window.addEventListener('dbplus-database-update', indexFromUpdate);
}

export const clean = async () => void 0;