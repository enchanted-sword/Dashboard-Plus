import { inject } from './inject.js';

const timelineObjectCache = new WeakMap();
const notificationCache = new WeakMap();
const conversationCache = new WeakMap();
const percentageCache = new WeakMap();
const noteCache = new WeakMap();

/**
 * @param {Element} post - Post element to fetch property from
 * @returns {any} Fetched timelineObject property
 */
export const timelineObject = async post => {
  if (!timelineObjectCache.has(post)) {
    timelineObjectCache.set(post, inject('getTimelineObject', [], post));
  }

  return timelineObjectCache.get(post);
};

/**
 * @param {Element} notification - Notification element to fetch property from
 * @returns {any} Fetched notification property
 */
export const notificationObject = async notification => {
  if (!notificationCache.has(notification)) {
    notificationCache.set(notification, inject('getNotificationObject', [], notification));
  }

  return notificationCache.get(notification);
};

export const conversationInfo = async conversation => {
  if (!conversationCache.has(conversation)) {
    conversationCache.set(conversation, inject('getOtherBlog', [], conversation));
  }

  return conversationCache.get(conversation);
};

export const percentageNumber = async answer => {
  if (!percentageCache.has(answer)) {
    percentageCache.set(answer, inject('getPercentage', [], answer));
  }

  return percentageCache.get(answer);
};

export const noteObject = async note => {
  if (!noteCache.has(note)) {
    noteCache.set(note, inject('getNoteObject', [], note));
  }

  return noteCache.get(note);
};