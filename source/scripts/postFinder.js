import { openDatabase, updateData, updateNeeded, getIndexedPosts } from './utility/database.js';
import { unique, debounce } from './utility/jsTools.js';
import { noact } from './utility/noact.js';
import { svgIcon } from './utility/dashboardElements.js';
import { navigate } from './utility/tumblr.js';

const customClass = 'dbplus-postFinder';

let db, postIndices, searchableIndices, splitMode = 'comma';
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

  return hits.map(unstringifyHits).sort((a, b) => (new Date(b.quickInfo.date)) - (new Date(a.quickInfo.date)));
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

const months = ['jan', 'feb', 'mar', 'apr', 'may', 'june', 'july', 'aug', 'sept', 'oct', 'nov', 'dec'];

const typeIconColour = {
  text: 'black',
  photo: 'red',
  quote: 'orange',
  link: 'green',
  chat: 'blue',
  audio: 'purple',
  video: 'pink',
  ask: 'blue'
};

const renderResult = (post, hit) => {
  const d = new Date(post.date);

  return noact({
    tag: 'li',
    onclick: function (event) {
      closeDialog(event);
      navigate(`/${post.blogName}/${post.id}`)
    },
    className: 'postFinder-result',
    children: [
      {
        className: 'postFinder-info',
        children: [
          {
            className: 'postFinder-blog',
            children: [
              {
                children: [
                  {
                    src: post.blog.avatar[2].url,
                    alt: post.blogName
                  },
                  post.blogName,
                ]
              },
              `${d.getDate()} ${months[d.getMonth()]}, ${d.getFullYear()}`
            ]
          },
          {
            className: 'postFinder-types',
            children: hit.quickInfo.types.map(type => {
              type === 'image' && (type = 'photo');
              return svgIcon(`posts-${type}`, 24, 24, '', `rgb(var(--${typeIconColour[type]}))`);
            })
          }
        ]
      },
      {
        className: 'postFinder-post',
        children: [
          post.summary ? post.summary : null
        ]
      },
      post.tags.length ? {
        className: 'postFinder-tags',
        children: post.tags.map(t => ({ children: '#' + t }))
      } : null,
      {
        className: 'postFinder-link',
        href: post.postUrl,
        children: post.postUrl
      }
    ]
  });
};

async function onKeywordSearch({ target }) {
  let keywords = target.value;

  if (splitMode === 'comma') keywords = keywords.split(',').map(v => v.trim()).filter(isDefined);

  if (!(keywords.length)) {
    document.getElementById('postFinder-results').replaceChildren([]);
    return;
  }

  const hits = await keywordSearch(...keywords);
  console.info(hits);

  if (!hits.length) return;

  const posts = await getIndexedPosts(hits.map(({ id }) => id));
  const results = posts.map((post, i) => renderResult(post, hits[i]));

  console.info(posts);

  document.getElementById('postFinder-results').replaceChildren(...results);
}

function showDialog(event) {
  event.preventDefault();
  searchWindow.setAttribute('open', '');
};
function closeDialog(event) { if (!('key' in event) || (event.key === 'Escape' && searchWindow.hasAttribute('open'))) searchWindow.removeAttribute('open'); }

const button = noact({
  className: 'postFinder-button',
  onclick: showDialog,
  children: [
    {
      tag: 'h2',
      className: 'postFinder-title',
      children: 'post finder'
    },
    svgIcon('search', 24, 24, 'postFinder-icon', 'rgb(var(--white-on-dark))')
  ]
});
const searchWindow = noact({
  tag: 'dialog',
  className: `${customClass} postFinder-dialog`,
  onclick: function (event) {
    try {
      event.stopPropagation();
      if (event.target.matches(':is(dialog, .postFinder-close)')) searchWindow.removeAttribute('open');
    } catch { void 0; }
  },
  children: [{
    className: 'postFinder-container',
    children: [
      {
        className: 'postFinder-titleRow',
        children: [
          {
            tag: 'h2',
            children: ['search']
          },
          {
            tag: 'svg',
            className: 'postFinder-close',
            fill: 'none',
            viewBox: '0 0 24 24',
            'stroke-width': 2,
            stroke: 'rgb(var(--red))',
            'aria-hidden': true,
            children: [{
              'stroke-linecap': 'round',
              'stroke-linejoin': 'round',
              d: 'M6 18L18 6M6 6l12 12'
            }]
          }
        ]
      },
      {
        tag: 'input',
        className: 'w-full',
        type: 'text',
        name: 'q1',
        placeholder: 'search cached posts',
        oninput: debounce(onKeywordSearch)
      },
      {
        className: 'postFinder-placeholder',
        children: ['enter a query to see results!']
      },
      {
        id: 'postFinder-results',
        tag: 'ul',
        children: [
        ]
      }
    ]
  }]
});

export const main = async () => {
  db = await openDatabase();
  postIndices = await db.getAllKeys('postStore');
  searchableIndices = await db.getAllKeys('searchStore');

  indexPosts();
  window.addEventListener('dbplus-database-update', indexFromUpdate);

  document.body.append(button);
  document.body.append(searchWindow);
  document.addEventListener('keydown', closeDialog);
};

export const clean = async () => {
  button.remove();
  searchWindow.remove();
  document.querySelectorAll(`.${customClass}`).forEach(e => e.remove());
  document.removeEventListener('keydown', closeDialog);
};