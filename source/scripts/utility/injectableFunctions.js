/**
 * tumblr.js
 */

export async function apiFetch (resource, init = {}) {
  init.headers ??= {};
  init.headers['DBPlus'] = '1';

  if (init.body !== undefined) {
    const objects = [init.body];

    while (objects.length !== 0) {
      const currentObjects = objects.splice(0);

      currentObjects.forEach(obj => {
        Object.keys(obj).forEach(key => {
          const snakeCaseKey = key
            .replace(/^[A-Z]/, match => match.toLowerCase())
            .replace(/[A-Z]/g, match => `_${match.toLowerCase()}`);

          if (snakeCaseKey !== key) {
            obj[snakeCaseKey] = obj[key];
            delete obj[key];
          }
        });
      });

      objects.push(
        ...currentObjects
          .flatMap(Object.values)
          .filter(value => value instanceof Object)
      );
    }
  }

  return window.tumblr.apiFetch(resource, init);
}

export async function navigate (path) {
  window.tumblr.navigate(path);
}

/**
 * reactProps.js
 */

export async function getTimelineObject (elem) {
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
}

export async function getNotificationObject (elem) {
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
}

export async function getOtherBlog (elem) {
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
}

export async function getPercentage (elem) {
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
}

export async function getNoteObject (elem) {
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
}
