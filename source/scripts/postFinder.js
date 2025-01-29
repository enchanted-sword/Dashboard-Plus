import { openDatabase, updateData, updateNeeded } from './utility/database.js';
import { unique } from './utility/jsTools.js';

let db, postIndices, searchableIndices;
const textSeparator = 'φ(,)';

const unstringifyHits = hit => {
  const parsedInfo = JSON.parse(hit.quickInfo);

  parsedInfo.texts && (parsedInfo.texts = parsedInfo.texts.split(textSeparator));
  parsedInfo.blogs && (parsedInfo.blogs = parsedInfo.blogs.split(','));
  parsedInfo.types && (parsedInfo.types = parsedInfo.types.split(','));
  parsedInfo.tags && (parsedInfo.tags = parsedInfo.tags.split(','));

  return Object.assign(hit, { quickInfo: parsedInfo });
}

const keywordSearch = async (...keywords) => {
  const tx = db.transaction('searchStore', 'readonly');
  const hits = [];
  let cursor = await tx.store.openCursor(), searchable;

  while (cursor) {
    searchable = cursor.value;
    if (keywords.every(keyword => searchable.quickInfo.includes(keyword))) hits.push(searchable);
    cursor = await cursor.continue();
  }

  return hits.map(unstringifyHits);
};
const categorySearch = async ({ blogs, types, texts, tags, date }) => {
  const checks = [blogs, types, texts, tags, date].filter(isDefined);
  return keywordSearch(...checks);
};
const strictCategorySearch = async ({ blogs, types, texts, tags, date }) => categorySearch({ blogs, types, texts, tags, date }).then(hits => {
  const threshold = [blogs, types, texts, tags, date].filter(isDefined).length;
  const matches = [];

  hits.forEach(postInfo => {
    const { quickInfo } = postInfo;
    let n = 0;

    if (quickInfo.blogs?.length && blogs
      && blogs.split(',').every(searchedBlog => quickInfo.blogs.includes(searchedBlog))) ++n;
    if (quickInfo.types?.length && types
      && types.split(',').every(searchedType => quickInfo.types.includes(searchedType))) ++n;
    if (quickInfo.texts?.length && texts
      && quickInfo.texts.some(postText => postText.includes(texts))) ++n;
    if (quickInfo.tags?.length && tags
      && tags.split(',').every(searchedTag => quickInfo.tags.includes(searchedTag))) ++n;
    if (date && quickInfo.date?.includes(date)) ++n;

    if (n === threshold) matches.push(postInfo);
  });

  return matches;
});

const isDefined = x => !!x;
const quickInfo = ({ id, blog, content, trail, tags, date }) => {
  const blogs = [blog, ...trail.map(({ blog }) => blog)].filter(isDefined);
  const contents = unique([...content, ...trail.flatMap(({ content }) => content)].filter(isDefined));
  const tagStr = unique([...tags, ...trail.flatMap(({ tags }) => tags)]).filter(isDefined).join(',');
  const texts = unique(contents.map(({ question, answers, text }) => {
    const returnArr = [];
    question && returnArr.push(question);
    answers && returnArr.push(...answers.map(({ answerText }) => answerText));
    text && returnArr.push(text);
    return returnArr;
  }).flat(Infinity)).filter(isDefined).join(textSeparator);

  return JSON.stringify({
    id,
    blogs: unique(blogs.map(blog => blog.name)).filter(isDefined).join(','),
    types: unique(contents.map(({ type }) => type)).filter(isDefined).join(','),
    texts,
    tags: tagStr,
    date
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

  console.log(strictCategorySearch({ blogs: 'dragongirlsweetie', texts: '[e;ase' }));
}

export const clean = async () => void 0;