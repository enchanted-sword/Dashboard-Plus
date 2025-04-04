import { noact } from './utility/noact.js';
import { postFunction } from './utility/mutations.js';
import { timelineObject } from './utility/reactProps.js';
import { s } from './utility/style.js';
import { addUrlPopover, svgIcon } from './utility/dashboardElements.js';
import { keyToClasses, navigate, translate } from './utility/tumblr.js';

const NEWDASH = () => !!document.querySelector(s('userBlock')); // Quick 'n dirty check

const customClass = 'dbplus-revertHeaders'
const postSelector = `[data-timeline-id]:not([data-route="user/inbox"]) [data-id] article:not(.${customClass})`;

function navigateWrapper(event) {
  event.preventDefault();
  event.stopPropagation();

  const postUrl = new URL(event.target.href);

  navigate(postUrl.pathname);
}

const reblogIcon = () => noact({
  tag: 'span',
  className: 'dbplus-reblogIcon',
  children: svgIcon('reblog-compact', 15, 15)
});
const newRebloggedFrom = parentPostUrl => noact({
  tag: 'a',
  href: parentPostUrl,
  onclick: navigateWrapper,
  title: translate('View previous reblog'),
  className: 'dbplus-rebloggedFrom',
  children: parentPostUrl.split('/')[3]
});

const revertHeaders = async posts => {
  for (const post of posts) {
    const { parentPostUrl } = await timelineObject(post);
    const header = post.querySelector('header');

    if (parentPostUrl)

      if (parentPostUrl) {
        const rebloggedFrom = newRebloggedFrom(parentPostUrl);
        addUrlPopover(rebloggedFrom);
        const title = header.querySelector(`${s('headline')}>${s('title')}`);
        title.insertAdjacentElement('afterend', rebloggedFrom);
        rebloggedFrom.before(reblogIcon());
      }

    post.classList.add(customClass);
  }
};

const legacyRevertHeaders = async posts => {
  for (const post of posts) {
    const { parentPostUrl } = await timelineObject(post);
    const header = post.querySelector('header');
    const attribution = header.querySelector(s('attribution'));
    let rebloggedFrom = attribution.querySelector(s('rebloggedFromName'));
    let addingNewRebloggedFrom = false;
    let rebloggedFromName;

    if (parentPostUrl) rebloggedFromName = parentPostUrl.split('/')[3];
    if (!rebloggedFrom && rebloggedFromName) {
      const labels = post.querySelectorAll(`:scope ${s('username')} ${s('label')}`);

      if (labels.length !== 0) {
        addingNewRebloggedFrom = true;
        const classes = keyToClasses('rebloggedFromName');
        rebloggedFrom = [...labels].find(node => node.querySelector(s('attribution')).innerText === rebloggedFromName).cloneNode(true);
        addUrlPopover(rebloggedFrom.querySelector('a'));
        const follow = rebloggedFrom.querySelector(s('followButton'));

        classes.push('dbplus-rebloggedFrom');
        rebloggedFrom.classList.add(...classes);
        $(rebloggedFrom.querySelector(s('attribution'))).css({ color: 'rgba(var(--black),.65)' });
        if (follow) $(follow).hide();
      }
    }

    [...attribution.childNodes].filter(node => node.nodeName === '#text').forEach(function (node) { node.textContent = '' });
    if (addingNewRebloggedFrom) attribution.append(rebloggedFrom);
    if (rebloggedFrom && !header.querySelector('dbplus-reblogIcon')) rebloggedFrom.before(reblogIcon());

    post.classList.add(customClass);
  }
};

export const main = async () => {
  const revertFunction = NEWDASH() ? revertHeaders : legacyRevertHeaders;
  postFunction.start(revertFunction, postSelector);
}

export const clean = async () => {
  const revertFunction = NEWDASH() ? revertHeaders : legacyRevertHeaders;
  postFunction.stop(revertFunction);

  $('.dbplus-rebloggedFrom').remove();
  NEWDASH() ? $('.dbplus-reblogIcon').remove() : $('.dbplus-reblogIcon').replaceWith(`${translate('reblogged')}`);
  $(`.${customClass}`).removeClass(customClass);
}