import { apiFetch, translate } from './utility/tumblr.js';
import { userBlogs } from './utility/user.js';
import { timelineObject } from './utility/reactProps.js';
import { postFunction } from './utility/mutations.js';
import { noact } from './utility/noact.js';
import { getOptions } from './utility/jsTools.js';
import { onLongPress } from './utility/touch.js';
import { svgIcon } from './utility/dashboardElements.js';

const customClass = 'dbplus-quickReblog';
const customAttribute = 'data-quick-reblog';
const linkSelector = `[aria-label="${translate('Reblog')}"]`;
const cleanActions = new Set();

let blogCount;

const reblogPost = async (blogName, { reblog_key, parent_tumblelog_uuid, parent_post_id, content = [], tags = '', state = 'published' }) => apiFetch(
  `/v2/blog/${blogName}/posts`,
  {
    method: 'POST',
    body: {
      content,
      state,
      tags,
      reblog_key,
      parent_tumblelog_uuid,
      parent_post_id
    }
  }).then(({ meta: { status }, response }) => {
    console.log(status, response);
    const arr = JSON.parse(window.sessionStorage.getItem('rebloggedPosts')) || [];
    arr.push(parent_post_id, response.id);
    window.sessionStorage.setItem('rebloggedPosts', JSON.stringify(arr));
  });

function quickReblog(target) {
  console.log(target);
  const { blogName, parent_post_id, reblog_key, parent_tumblelog_uuid } = target.dataset;

  reblogPost(blogName, { parent_post_id, parent_tumblelog_uuid, reblog_key })
    .then(() => addStatusMessage(true, blogName), e => {
      console.error(e);
      addStatusMessage(false, blogName);
    })
    .finally(() => document.getElementById(`qrb-${parent_post_id}`)?.remove());
}

const addStatusMessage = (success, name) => {
  const message = noact({
    className: 'dbplus-quickReblog dbplus-quickReblog-statusContainer',
    children: {
      className: 'dbplus-quickReblog-status',
      style: `background-color:${success ? 'var(--accent)' : 'var(--content-danger)'}`,
      children: [
        svgIcon(success ? 'ds-circle-info-filled-16' : 'ds-circle-alert-filled-16', 16, 16, '', 'rgb(var(--black), .65)'),
        {
          role: 'status',
          'aria-live': 'polite',
          children: [success ? `Reblogged to ${name}` : 'An error occurred while processing the post']
        }
      ]
    }
  });

  document.getElementById('glass-container').append(message);
  //window.setTimeout(() => message.remove(), 5000);
};

const radius = 72, offset = 24, theta = Math.PI / 4;

const bubbleTransform = (index) => {
  const a = Math.PI / 2 + index * theta;
  const x = Math.cos(a) * radius - offset;
  const y = (-Math.sin(a) * radius) - offset;

  return `top:${y}px;left:${x}px`;
};

const bubble = ({ blog, parent_post_id, reblog_key, parent_tumblelog_uuid }, i) => ({
  tag: 'button',
  className: 'dbplus-quickReblog-bubble',
  style: bubbleTransform(i),
  dataset: { blogName: blog.name, parent_post_id, reblog_key, parent_tumblelog_uuid },
  children: {
    src: blog.avatar.slice(-1)[0].url,
  }
});
const radialMenu = ({ parent_post_id, reblog_key, parent_tumblelog_uuid, cx, cy }) => ({
  id: `qrb-${parent_post_id}`,
  className: 'dbplus-quickReblog dbplus-quickReblog-menu',
  style: `top:${cy}px;left:${cx}px`,
  children: [
    ...userBlogs.slice(0, blogCount).map((blog, i) => bubble({ blog, parent_post_id, reblog_key, parent_tumblelog_uuid }, i)),
    /* {
      className: 'dbplus-quickReblog-bubble',
      style: bubbleTransform(blogCount),
    } */
  ]
});

const getCenter = elem => {
  const { x, y, height, width } = elem.getBoundingClientRect();
  const cx = window.scrollX + x + width / 2;
  const cy = window.scrollY + y + height / 2;
  return { cx, cy };
};

const displayMenuFn = ({ parent_post_id, reblog_key, parent_tumblelog_uuid, }) => function (event) {
  const { cx, cy } = getCenter(event.target);

  const m = noact(radialMenu({ parent_post_id, reblog_key, parent_tumblelog_uuid, cx, cy }));
  document.getElementById('glass-container').append(m);
};

function onTouchMove(event) {
  const target = document.elementFromPoint(event.changedTouches[0].clientX, event.changedTouches[0].clientY)?.closest('.dbplus-quickReblog-bubble');
  document.querySelectorAll('.dbplus-quickReblog-bubble').forEach(e => e.dataset.state = '');

  if (target) target.dataset.state = 'hover';
}
const touchEndFn = id => function (event) {
  const target = document.elementFromPoint(event.changedTouches[0].clientX, event.changedTouches[0].clientY)?.closest('.dbplus-quickReblog-bubble');

  if (target) quickReblog(target);
  else document.getElementById(`qrb-${id}`)?.remove();
};
const touchCancelFn = id => function (event) {
  document.getElementById(`qrb-${id}`)?.remove();
};

const addMenus = async posts => {
  for (const post of posts) {
    if (post.matches(`[${customAttribute}]`)) return;
    post.setAttribute(customAttribute, '');

    const { id: parent_post_id, canShare, reblogKey: reblog_key, blog: parentTumblelog } = await timelineObject(post);

    if (!canShare) return;

    const shareButton = post.querySelector(linkSelector);
    const action = displayMenuFn({ parent_post_id, reblog_key, parent_tumblelog_uuid: parentTumblelog.uuid });
    const endAction = touchEndFn(parent_post_id);
    const cancelAction = touchCancelFn(parent_post_id);

    shareButton.addEventListener('mouseenter', action);
    const cleanAction = onLongPress(shareButton, action, onTouchMove, endAction, cancelAction);
    cleanActions.add(cleanAction);
  }
};

export const main = async () => {
  ({ blogCount } = await getOptions('quickReblog'));

  postFunction.start(addMenus, ':not([data-quick-reblog="true"])');
};

export const clean = async () => {
  postFunction.stop(addMenus);

  document.querySelectorAll(`.${customClass}`).forEach(e => e.remove());
  document.querySelectorAll(`[${customAttribute}]`).forEach(e => e.removeAttribute(customAttribute));
  cleanActions.forEach(func => func());
};