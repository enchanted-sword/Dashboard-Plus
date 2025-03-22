import { apiFetch, translate } from './utility/tumblr.js';
import { userInfo, primaryBlog } from './utility/user.js';
import { timelineObject } from './utility/reactProps.js';
import { postFunction } from './utility/mutations.js';
import { noact } from './utility/noact.js';
import { getOptions } from './utility/jsTools.js';
import { onLongPress } from './utility/touch.js';

const cc = 'dbplus-quickReblog';
const customAttribute = 'data-quick-reblog';
const linkSelector = `[aria-label="${translate('Reblog')}"]`;

let addTags, addContent;

const hideMenuDelay = 500;
const descriptors = [
  { descriptor: 'reblog', weight: 8 },
  { descriptor: 'reshare', weight: 6 },
  { descriptor: 'rebug', weight: 3.2 },
  { descriptor: 'rechost', weight: 1.2 },
  { descriptor: 'rechlog', weight: 2.4 }, // shoutout to tooie <3
  { descriptor: 'clone', weight: 1 },
  { descriptor: 'propagate', weight: .5 },
  { descriptor: 'assimilate', weight: .2 },
];
const randomDescriptor = () => {
  let i;
  const weights = [descriptors[0].weight];
  for (i = 1; i < descriptors.length; i++) weights[i] = descriptors[i].weight + weights[i - 1];
  const random = Math.random() * weights[weights.length - 1];
  for (i = 0; i < weights.length; i++) if (weights[i] > random) break;
  return descriptors[i].descriptor;
}

const rechost = async (blogName, parent_tumblelog_uuid, parent_post_id, reblog_key, tags = "", content = []) => apiFetch(`/v2/blog/${blogName}/posts`, {
  method: 'POST',
  headers: { 'content-type': 'application/json' },
  body: {
    content,
    tags,
    parent_tumblelog_uuid,
    parent_post_id,
    reblog_key
  }
});

const textInput = (type, postId, placeholder) => {
  return {
    className: 'relative grid w-full overflow-auto w-14',
    children: [
      {
        className: 'invisible col-start-1 col-end-2 row-start-1 row-end-2 h-min overflow-auto whitespace-pre-wrap break-words',
        style: 'font-size: 16px; font-family: Atkinson Hyperlegible, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, &quot;Segoe UI&quot;, Roboto, &quot;Helvetica Neue&quot;, Arial, &quot;Noto Sans&quot;, sans-serif, &quot;Apple Color Emoji&quot;, &quot;Segoe UI Emoji&quot;, &quot;Segoe UI Symbol&quot;, &quot;Noto Color Emoji&quot;; font-weight: 400; font-style: normal; letter-spacing: normal; text-transform: none; padding: 8px 12px; line-height: 24px; min-height: 48px;'
      },
      {
        tag: 'input',
        type: 'text',
        id: `qrc-${type}-${postId}`,
        onkeydown: ctrlEnter,
        className: 'co-composer-text-box w-full row-start-1 row-end-2 col-start-1 col-end-2 min-h-0',
        style: 'resize: none; overflow: hidden;',
        placeholder,
      }
    ]
  }
};
const selectableBlog = (blog, index, parent_post_id) => {
  const { name, avatar, primary } = blog;

  return {
    tag: 'li',
    className: `${cc}-selector`,
    selectorId: `qrc-selector-${index}`,
    role: 'option',
    tabindex: -1,
    'aria-selected': primary,
    dataset: { headlessuiSelected: primary },
    onclick: function () {
      const selector = document.getElementById(`qrc-selector-${parent_post_id}`);
      const avatarImg = selector.querySelector('img');
      selector.activeBlog = blog;
      selector.click();
      avatarImg.src = avatar[1].url;
      avatarImg.alt = name;
      document.getElementById(`qrc-${parent_post_id}`).title = `reblog this post as ${name}`;
    },
    children: [
      {
        className: `${cc}-avatar`,
        src: avatar[1].url,
        alt: name
      },
      {
        tag: 'span',
        children: name
      }
    ]
  }
};
const newMenu = async (parent_post_id, parent_tumblelog_uuid, reblog_key) => {
  return noact({
    className: cc,
    id: `qrc-menu-${parent_post_id}`,
    onmouseleave: menuSelfHide,
    children: [{
      className: `${cc}-flexRow`,
      children: [
        addContent ? textInput('content', parent_post_id, 'content (markdown)') : '',
        addTags ? textInput('tags', parent_post_id, 'tags (comma-separated)') : '',
        {
          className: `${cc}-flexRow ${cc}-actionRow`,
          children: [
            {
              className: `${cc}-flexRow ${cc}-selector`,
              id: `qrc-selector-${parent_post_id}`,
              'aria-haspopup': 'listbox',
              'aria-expanded': false,
              dataset: { headlessuiState: '' },
              activeBlog: primaryBlog,
              onclick: toggleState,
              children: [
                {
                  className: `${cc}-selector`,
                  children: [{
                    className: `${cc}-avatar`,
                    src: primaryBlog.avatar[1].url,
                    alt: primaryBlog.name
                  }]
                },
                {
                  className: 'rounded-r-lg p-2 group-hover:bg-foreground-600 ui-open:bg-foreground-700 lg:block',
                  children: [{
                    className: 'dbplus-quickReblog-caret h-6 w-6 transition-transform ui-open:rotate-180',
                    viewBox: '0 0 24 24',
                    'aria-hidden': true,
                    'stroke-width': 0.5,
                    fill: 'currentColor',
                    children: [{
                      'fill-rule': 'evenodd',
                      'clip-rule': 'evenodd',
                      d: 'M12.53 16.28a.75.75 0 01-1.06 0l-7.5-7.5a.75.75 0 011.06-1.06L12 14.69l6.97-6.97a.75.75 0 111.06 1.06l-7.5 7.5z'
                    }]
                  }]
                }
              ]
            },
            {
              tag: 'ul',
              className: 'dbplus-quickReblog-list lg:cohost-shadow-light dark:lg:cohost-shadow-dark left-0 top-8 !overflow-y-auto truncate bg-foreground !outline-none absolute lg:max-h-[calc(100vh_-_100px)] lg:divide-none rounded-lg bg-notWhite text-notBlack',
              'aria-orientation': 'vertical',
              role: 'listbox',
              onmouseleave: function () {
                const selector = document.getElementById(`qrc-selector-${parent_post_id}`);
                window.setTimeout(() => selector.dataset.headlessuiState = '', hideMenuDelay);
              },
              tabindex: 0,
              children: userInfo.blogs.map((blog, index) => selectableBlog(blog, index, parent_post_id))
            },
            {
              className: 'co-filled-button flex items-center justify-center rounded-lg px-4 py-2 text-sm font-bold',
              title: `reblog this post as ${primaryBlog.name}`,
              id: `qrc-${parent_post_id}`,
              reblog_key,
              parent_tumblelog_uuid,
              onclick: quickReblog,
              children: [randomDescriptor()]
            }
          ]
        }
      ]
    }]
  });
};

const toggleState = function (event) {
  const target = event.target.closest('[data-headlessui-state]');
  const state = target.dataset.headlessuiState;

  if (state === 'open') {
    target.dataset.headlessuiState = '';
    target['aria-expanded'] = '';
  } else {
    target.dataset.headlessuiState = 'open';
    target['aria-expanded'] = true;
  }
};
const quickReblog = function (event) {
  const target = event.target.closest('button');
  const parent_post_id = target.id.split('-')[1];
  const { reblog_key, parent_tumblelog_uuid } = target;
  const contentInput = document.getElementById(`qrc-content-${parent_post_id}`);
  const tagsInput = document.getElementById(`qrc-tags-${parent_post_id}`);
  const pageSelector = document.getElementById(`qrc-selector-${parent_post_id}`);
  const { name } = pageSelector.activeBlog;
  let tags = "", content = [];

  if (addContent && contentInput.value) content = [contentInput.value];
  if (addTags && tagsInput.value) tags = tagsInput.value.replace(/#/g, '');

  target.style = 'color: rgb(var(--color-notWhite)); background-color: rgb(49 157 53);'

  rechost(name, parent_tumblelog_uuid, +parent_post_id, reblog_key, tags, content)
    .then(() => addStatusMessage(true, name))
    .catch(e => {
      addStatusMessage(false, name);
      console.error(e);
    })
    .finally(() => {
      document.getElementById(`qrc-menu-${parent_post_id}`).style = null;
      target.style = null;
      document.getElementById(`qrc-selector-${parent_post_id}`).dataset.headlessuiState = '';
    });
};
const addStatusMessage = (success, name) => {
  const message = noact({
    className: `dbplus-quickReblog-status flex justify-between gap-3 !bg-${success ? 'green' : 'red'}-200 !text-${success ? 'green' : 'red'}-800 cohost-shadow-light dark:cohost-shadow-dark rounded-lg px-3 py-2 font-bold`,
    style: `left: calc(50% - ${success ? 130 : 194.8335}px);`,
    children: [
      {
        className: `h-6 flex-none text-${success ? 'green' : 'red'}-800`,
        viewBox: '0 0 24 24',
        fill: 'none',
        'stroke-width': 1.5,
        stroke: 'currentColor',
        'aria-hidden': true,
        children: [{
          'stroke-linecap': 'round',
          'stroke-linejoin': 'round',
          d: 'M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z'
        }]
      },
      {
        role: 'status',
        'aria-live': 'polite',
        children: [success ? `posted to ${name}!` : 'an error occurred while processing the post']
      }
    ]
  });

  document.body.append(message);
  window.setTimeout(() => message.remove(), 5000);
};
const ctrlEnter = function (event) {
  if (event.ctrlKey && event.key === 'Enter') {
    document.getElementById(`qrc-${event.target.id.split('-')[2]}`).click();
  }
};
const clampX = x => Math.min(Math.max(x, 128), visualViewport.width - 128);

const showMenu = event => {
  const target = event.target.closest(linkSelector);
  const id = target.href.split('/').slice(-2)[0];
  const yPos = (event.pageY || event.changedTouches[0].pageY) + 16;
  let xPos = event.pageX || event.changedTouches[0].pageX;
  xPos = clampX(xPos);

  document.getElementById(`qrc-menu-${id}`).style = `top: ${yPos}px; left: ${xPos - 120}px; display: block;`;
};
const hideMenu = event => {
  const target = event.target.closest(linkSelector);
  window.setTimeout(() => {
    const id = target.href.split('shareOfPostId=')[1];
    const menu = document.getElementById(`qrc-menu-${id}`)
    if (menu && !menu.matches(':hover')) menu.style = null;
  }, hideMenuDelay);
};
const hideMenuOnTouch = event => {
  try {
    if (!event.originalTarget.matches(`.${cc},.${cc} *,${linkSelector},${linkSelector} svg`)) document.querySelectorAll(`.${cc}`).forEach(function (menu) { menu.style = null });
  } catch { null } // can't check .matches() on some inputs so this keeps the console free of extra errors
};
const menuSelfHide = function (event) {
  event.stopPropagation();
  const menu = event.target.closest('.co-themed-box');
  if (!menu.matches(':hover')) {
    window.setTimeout(() => { if (menu && !menu.matches(':hover')) menu.style = null; }, hideMenuDelay);
  }
}
const addMenus = async posts => {
  for (const post of posts) {
    if (post.matches(`[${customAttribute}]`)) return;
    post.setAttribute(customAttribute, '');

    const { id, canShare, reblogKey, blogName } = await timelineObject(post);

    if (!canShare) return;

    const shareButton = post.querySelector(linkSelector);
    $(shareButton).on('mouseenter', showMenu);
    $(shareButton).on('mouseleave', hideMenu);
    onLongPress(shareButton, showMenu);

    document.getElementById('root').append(await newMenu(id, blogName, reblogKey));
  }
};

export const main = async () => {
  ({ addTags, addContent } = await getOptions('quickReblog'));

  postFunction.start(addMenus, ':not([data-quick-reblog="true"])');
  document.addEventListener('touchstart', hideMenuOnTouch);
};

export const clean = async () => {
  postFunction.stop(addMenus);

  $(linkSelector).off('mouseenter', showMenu);
  $(`.${cc}`).remove();
  $(`[${customAttribute}]`).removeAttr(customAttribute);
  document.removeEventListener('touchstart', hideMenuOnTouch);
};