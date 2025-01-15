import { apiFetch } from "./utility/tumblr.js";
import { mutationManager } from "./utility/mutations.js";
import { noact } from "./utility/noact.js";
import { s, smartCopy } from "./utility/style.js";

const customClass = 'dbplus-emptyInbox';
const targetSelector = `${s('main')}:has([data-timeline*="/v2/user/inbox"]) + ${s('sidebar')} aside`;
let sideBarClass, activeClass;

const empty = function () {
  apiFetch('/v2/user/inbox', { method: 'DELETE' });
}

const addEmptyButton = targets => {
  const target = targets.pop();

  sideBarClass = smartCopy(target.querySelector(s('sideBar')), 'sideBar');

  const button = noact({
    tag: 'ul',
    className: sideBarClass,
    style: 'margin-top: -60px;',
    children: {
      tag: 'li',
      style: 'background: rgba(var(--white-on-dark),.07);',
      className: activeClass,
      children: {
        style: 'width: 100%;',
        onclick: empty,
        children: 'Clear inbox'
      }
    }
  });

  target.append(button);
}

export const main = async () => {
  mutationManager.start(targetSelector, addEmptyButton);
};
export const clean = async () => {
  mutationManager.stop(addEmptyButton);
  $(`.${customClass}`).removeClass(customClass);
}