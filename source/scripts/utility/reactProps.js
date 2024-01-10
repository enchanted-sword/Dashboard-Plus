import { inject } from './inject.js';

const timelineObjectCache = new WeakMap();
const notificationCache = new WeakMap();

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

/**
 * @param {Element} post - Post element to fetch property from
 * @returns {any} Fetched timelineObject property
 */
export const timelineObject = async post => {
  if (!timelineObjectCache.has(post)) {
    timelineObjectCache.set(post, inject(getTimelineObject, [], post));
  }

  return timelineObjectCache.get(post);
};

/**
 * @param {Element} notification - Notification element to fetch property from
 * @returns {any} Fetched notification property
 */
export const notificationObject = async notification => {
  if (!notificationCache.has(notification)) {
    notificationCache.set(notification, inject(getNotificationObject, [], notification));
  }

  return notificationCache.get(notification);
};