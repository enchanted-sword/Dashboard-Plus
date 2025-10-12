import { s } from './utility/style.js';
import { mutationManager } from './utility/mutations.js';
import { timelineObject } from './utility/reactProps.js';
import { svgIcon } from './utility/dashboardElements.js';
import { noact } from './utility/noact.js';
import { cellSelector, postSelector } from './utility/document.js';
import { getOptions, numFormat } from './utility/jsTools.js';
import { apiFetch, navigate, translate } from './utility/tumblr.js';

let restoreReblog;

const customClass = 'dbplus-betterFooters';
const hiddenClass = 'bf-hidden';
const changedBehaviourClass = 'bf-1click';

const footerSelector = s('footerContent');
const replySelector = s('button brandBlue');
const notesSelectorR = s('reblogsControl');
const notesSelectorL = s('likesControl');
const activitySelector = `${s('postActivity')} ${s('root')}`;

const deletePostButton = (uuid, id) => ({
  title: translate('Delete'),
  ariaLabel: translate('Delete'),
  onclick: function () {
    let modal;

    function removeModal(e) {
      const { type, key } = (e || {});
      if (!e || (type === 'keydown' && key === 'Escape') || type === 'click') {
        modal.remove();
        window.removeEventListener('keydown', removeModal);
      }
    }

    modal = noact({
      tag: 'dialogue',
      className: 'bf-modal',
      dataset: { role: 'modal' },
      children: {
        className: 'bf-modalContent',
        children: [
          {
            className: 'bf-modalDialogue',
            children: translate('Are you sure you want to delete this post?')
          },
          {
            className: 'bf-modalControls',
            children: [
              {
                className: 'bf-modalControl bf-modalCancel',
                onclick: removeModal,
                children: translate('Cancel')
              },
              {
                className: 'bf-modalControl bf-modalConfirm',
                onclick: function () {
                  try {
                    apiFetch(`/v2/blog/${uuid}/post/delete`, { method: 'POST', body: { id } }).then(({ response: { idString } }) => {
                      const cell = document.querySelector(`[data-id="${idString}"]`).closest(cellSelector);
                      if (cell) cell.style.display = 'none';
                    }, e => {
                      console.error(e);
                    }).finally(removeModal);
                  } catch (e) {
                    console.error(e);
                    removeModal
                  }
                },
                children: translate('OK')
              }
            ]
          }
        ]
      }
    });

    document.body.append(modal);
    window.addEventListener('keydown', removeModal);
  },
  children: svgIcon('delete', 21, 21, 'black')
});

const CBFunctions = new Map();

const fixFooters = footers => footers.forEach(async footer => {
  const post = footer.closest(postSelector);
  if (!post || post.querySelector(`:is(${s('footerRow')},.${customClass})`)) return;

  try {
    const repliesActivityButton = footer.querySelector(replySelector);
    const reblogsActivityButton = footer.querySelector(notesSelectorR);
    const likesActivityButton = footer.querySelector(notesSelectorL);
    let activityState = !!post.querySelector(activitySelector);
    let selected = 'replies';

    const replaceIcon = (icon, replacement) => {
      const wrapper = footer.querySelector(`:is(${s('truncate')},${s('icon')}):has([href="#managed-icon__${icon}"])`);
      if (wrapper && !wrapper.querySelector(`.${hiddenClass}`)) {
        wrapper.firstElementChild.classList.add(hiddenClass);
        wrapper.append(replacement);
      }
    };

    timelineObject(post).then(({ blogName, replyCount, likeCount, reblogCount, noteCount, id, reblogKey, canReblog }) => {
      /* const canManage = canEdit || canDelete;
      const unpublished = ['draft', 'queued', 'submission'].includes(state);
      const showTopRow = !unpublished && canManage; // && !isQueue && !isInbox */
      let notesButton, notesFooterControl;

      replaceIcon('ds-reply-outline-24', svgIcon('reply-empty', 21, 21, customClass, `rgba(var(--black),0.65)`));
      replaceIcon('ds-reblog-24', svgIcon('reblog', 21, 21, customClass, `rgba(var(--black), ${canReblog ? 0.65 : 0.4})`));
      replaceIcon('ds-ui-upload-24', svgIcon('share-icon-proper', 24, 24, customClass, 'rgba(var(--black),0.65)'));

      function toggleActivityState() {
        if (activityState) {
          notesButton.dataset.state = '';
          notesFooterControl.style.display = 'none';
        } else {
          notesButton.dataset.state = 'open';
          notesFooterControl.style.display = 'flex';
        }

        activityState = !activityState;
      }

      notesButton = noact({
        className: customClass + ' bf-notesWrapper',
        dataset: { state: activityState ? 'open' : '' },
        children: {
          className: 'bf-notesIcon',
          onclick: function () {
            toggleActivityState();

            if (!notesButton.dataset.state) {
              const closeButton = post.querySelector(`${s('postActivity')} ${s('tabs2025')} ${s('button')}:has([href="#managed-icon__ds-ui-x-20"])`);
              closeButton?.click();
            } else {
              switch (selected) {
                case 'replies':
                  repliesActivityButton?.click();
                  break;
                case 'reblogs':
                  reblogsActivityButton.click();
                  break;
                case 'likes':
                  likesActivityButton.click();
                  break;
              }
            }
          },
          children: [
            {
              className: 'bf-notesPill',
              children: [
                {
                  tag: 'span',
                  children: numFormat(noteCount),
                },
                (noteCount === 1 ? 'note' : 'notes')
              ]
            },
            {
              className: 'bf-notesPillOpen',
              children: [
                svgIcon('close-medium', 12, 12),
                'Close notes'
              ]
            }
          ]
        }
      });

      const selectType = type => {
        if (type === 'comments') type = 'replies';
        selected = type;
        /* Array.from(notesFooterControl.children).forEach(s => s.dataset.selected = '');
        notesFooterControl.querySelector(`.bf-${type}`).dataset.selected = 'selected';
        notesFooterControl.dataset.selected = type; */
      };

      const notesSelector = (type, action, children) => ({
        className: customClass + ` bf-notesSelector bf-${type}`,
        dataset: { selected: selected === type ? 'selected' : '' },
        onclick: function () {
          console.log(type, action)
          if (selected !== type) {
            selectType(type);
            action?.click();
          }
        },
        children
      });

      notesFooterControl = noact({
        className: customClass + ' bf-notes',
        style: 'display:none',
        dataset: { selected },
        children: [
          notesSelector('replies', repliesActivityButton, [
            svgIcon('reply-empty', 20, 20, 'bf-replies'),
            replyCount || '0'
          ]),
          notesSelector('reblogs', reblogsActivityButton, [
            svgIcon('reblog', 20, 20, 'bf-reblogs'),
            reblogCount || '0'
          ]),
          notesSelector('likes', likesActivityButton, [
            svgIcon('like-empty', 20, 20, 'bf-likes'),
            likeCount || '0'
          ])
        ]
      });

      repliesActivityButton.addEventListener('click', function ({ pointerId }) {
        // !activityState => opening
        // (activityState && selected === 'replies') => closing when selected
        if ((!activityState || (activityState && selected === 'replies')) && pointerId >= 0) {
          toggleActivityState(); // skips over .click() method triggering
        }
        selectType('replies');
      });

      function cbfunction(event) {
        event.preventDefault();
        event.stopPropagation();
        navigate(`/reblog/${blogName}/${id}/${reblogKey}`);
      }

      if (restoreReblog) {
        const rButton = footer.querySelector(`[aria-label="${translate('Reblog')}"][aria-haspopup]`);

        rButton?.addEventListener('click', cbfunction);
        rButton?.classList.add(changedBehaviourClass);
        CBFunctions.set(rButton, cbfunction);
      }

      /* if (showTopRow) {
        const editUrl = `/edit/${blogName}/${id}`;
        const topRow = noact({
          className: customClass + ' bf-topRow',
          children: [
            canDelete ? deletePostButton(blog.uuid, id) : null,
            (canEdit && state !== 'submission') ? {
              title: translate('Edit'),
              ariaLabel: translate('Edit'),
              tabindex: -1,
              href: editUrl,
              onclick: function () {
                navigate(editUrl);
              },
              children: svgIcon('edit', 21, 21)
            } : null
          ]
        });

        footer.parentElement.prepend(topRow);
      } */

      footer.append(notesButton);
      //footer.parentElement.insertBefore(notesFooterControl, footer.nextElementSibling);
    });
  } catch (e) { console.error(e, post); }

});

export const main = async () => {
  ({ restoreReblog } = await getOptions('betterFooters'));

  mutationManager.start(footerSelector, fixFooters);
};
export const clean = async () => {
  mutationManager.stop(footerSelector, fixFooters);
  document.querySelectorAll(`.${customClass}`).forEach(s => s.remove());
  document.querySelectorAll(`.${hiddenClass}`).forEach(s => s.classList.remove(hiddenClass));
  document.querySelectorAll(`.${changedBehaviourClass}`).forEach(s => {
    s.classList.remove(changedBehaviourClass);
    s.removeEventListener('click', CBFunctions.get(s));
  });
};