import { apiFetch, keyToClasses } from "./utility/tumblr.js";
import { mutationManager } from "./utility/mutations.js";
import { noact } from "./utility/noact.js";
import { s } from "./utility/style.js";

const customClass = 'dbplus-emptyInbox';
const targetSelector = `${s('main')}:has([data-timeline="/v2/user/inbox"]) + ${s('sidebar')} aside`;
let sideBarClass, activeClass;

const empty = function () {
  apiFetch('/v2/user/inbox', { method: 'DELETE' });
}

const addEmptyButton = targets => {
  const target = targets.pop();

  ;; debugger
  sideBarClass = target.querySelector(s('sideBar')).classList.item(0);
  activeClass = target.querySelector(s('active')).classList.item(1);

  const button = noact({
    tag: 'ul',
    className: sideBarClass,
    style: 'margin-top: -60px;',
    children: {
      tag: 'li',
      className: activeClass,
      children: {
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