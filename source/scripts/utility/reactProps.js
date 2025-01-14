import { inject } from './inject.js';
import { isFollowing } from './user.js';
import { updateData } from './database.js';

const timelineObjectCache = new WeakMap();
const notificationCache = new WeakMap();
const conversationCache = new WeakMap();
const percentageCache = new WeakMap();
const noteCache = new WeakMap();

const getTimelineObject = async () => {
  const elem = document.currentScript.parentElement;
  const fiberKey = Object.keys(elem).find(key => key.startsWith('__reactFiber'));
  let fiber = elem[fiberKey];

  while (fiber !== null) {
    const { timelineObject } = fiber.memoizedProps || {};
    if (typeof timelineObject !== 'undefined') {
      return timelineObject;
    } else {
      fiber = fiber.return;
    }
  }
};
const getNotificationObject = async () => {
  const elem = document.currentScript.parentElement;
  const fiberKey = Object.keys(elem).find(key => key.startsWith('__reactFiber'));
  let fiber = elem[fiberKey];

  while (fiber !== null) {
    const { notification } = fiber.memoizedProps || {};
    if (typeof notification !== 'undefined') {
      return notification;
    } else {
      fiber = fiber.return;
    }
  }
};
const getActivityItem = async () => {
  const elem = document.currentScript.parentElement;
  const fiberKey = Object.keys(elem).find(key => key.startsWith('__reactFiber'));
  let fiber = elem[fiberKey];

  while (fiber !== null) {
    const { content, title } = fiber.memoizedProps || {};
    if ((typeof content !== 'undefined') && (typeof title !== 'undefined')) {
      return fiber.memoizedProps;
    } else {
      fiber = fiber.return;
    }
  }
};
const getOtherBlog = async () => {
  const elem = document.currentScript.parentElement;
  const fiberKey = Object.keys(elem).find(key => key.startsWith('__reactFiber'));
  let fiber = elem[fiberKey];
  let conversationWindowObject, headerImageFocused, backgroundColor, titleColor, linkColor;

  while (fiber !== null) {
    ({ conversationWindowObject } = fiber.memoizedProps || {});
    if (typeof conversationWindowObject !== 'undefined') {
      break;
    } else {
      fiber = fiber.return;
    }
  }

  const { otherParticipantName, selectedBlogName } = conversationWindowObject;

  await window.tumblr.apiFetch(`/v2/blog/${otherParticipantName}/info?fields[blogs]=theme`).then(response => {
    ({ headerImageFocused, backgroundColor, titleColor, linkColor } = response.response.blog.theme);
  });

  return ({ headerImageFocused, backgroundColor, titleColor, linkColor, otherParticipantName, selectedBlogName });
};
const getPercentage = async () => {
  const elem = document.currentScript.parentElement;
  const fiberKey = Object.keys(elem).find(key => key.startsWith('__reactFiber'));
  let fiber = elem[fiberKey];

  while (fiber !== null) {
    const { percentage, answer } = fiber.memoizedProps || {};
    if (typeof percentage !== 'undefined' && typeof answer !== 'undefined') {
      return { percentage };
    } else {
      fiber = fiber.return;
    }
  }
};
const getNoteObject = async () => {
  const elem = document.currentScript.parentElement;
  const fiberKey = Object.keys(elem).find(key => key.startsWith('__reactFiber'));
  let fiber = elem[fiberKey];

  while (fiber !== null) {
    const { note } = fiber.memoizedProps || {};
    if (typeof note !== 'undefined') {
      return note;
    } else {
      fiber = fiber.return;
    }
  }
};

/**
 * @param {Element} post - Post element to fetch property from
 * @returns {any} Fetched timelineObject property
 */
export const timelineObject = async post => {
  if (!timelineObjectCache.has(post)) {
    const postObject = await inject(getTimelineObject, [], post);
    if (typeof postObject !== 'undefined') updateData({ postStore: postObject });
    timelineObjectCache.set(post,);
  }

  return timelineObjectCache.get(post);
};

const activityToNotification = async activityItem => {
  const { title, relationship } = activityItem;
  const { start, end } = title.formatting.find(i => i.type === 'mention');
  const fromTumblelogName = Array.from(title.text).slice(start, end).join('');
  const followed = ['following', 'mutuals'].includes(relationship);
  let followingYou = false;
  if (relationship === 'mutuals') followingYou = true;
  else if (await isFollowing(fromTumblelogName)) followingYou = true; // these two conditions are split to improve execution time (maybe?)

  return { fromTumblelogName, followed, followingYou };
};

/**
 * @param {Element} notification - Notification element to fetch property from
 * @returns {any} Fetched notification property
 */
export const notificationObject = async notification => {
  if (!notificationCache.has(notification)) {
    if (notification.matches('[data-css~="activityItem"]')) {
      const activityItem = await inject(getActivityItem, [], notification);
      notificationCache.set(notification, await activityToNotification(activityItem));
    } else {
      notificationCache.set(notification, inject(getNotificationObject, [], notification));
    }
  }

  if (notificationCache.get(notification) === null) {
    console.warn('null notificationObject:', notification);
  }
  return notificationCache.get(notification);
};

export const conversationInfo = async conversation => {
  if (!conversationCache.has(conversation)) {
    conversationCache.set(conversation, inject(getOtherBlog, ['z'], conversation));
  }

  return conversationCache.get(conversation);
};

export const percentageNumber = async answer => {
  if (!percentageCache.has(answer)) {
    percentageCache.set(answer, inject(getPercentage, [], answer));
  }

  return percentageCache.get(answer);
};

export const noteObject = async note => {
  if (!noteCache.has(note)) {
    noteCache.set(note, inject(getNoteObject, [], note));
  }

  return noteCache.get(note);
};