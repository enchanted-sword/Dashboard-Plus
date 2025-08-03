import { s } from './utility/style.js';
import { postFunction } from './utility/mutations.js';
import { timelineObject } from './utility/reactProps.js';
import { svgIcon, controlIcons } from './utility/dashboardElements.js';
import { noact } from './utility/noact.js';

const customClass = 'dbplus-betterFooters';

const footerSelector = s('footerContent');
const replySelector = s('button brandBlue');
const reblogSelector = s('button brandGreen');
const likeSelector = s('button brandRed');
const notesSelectorR = s('reblogsControl');
const notesSelectorL = s('likesControl');
const shareSelector = s('button brandPurple');

const newLikeIcon = (action, state) => ({
  className: customClass + ' bf-icon',
  ariaLabel: action.ariaLabel,
  dataset: state,
  onclick: function () {
    if (this.dataset.state) {
      this.dataset.state = '';
      this.ariaLabel = 'Like';
      this.querySelector('.bf-like').replaceWith(svgIcon('like-empty', 24, 24, 'bf-like'));
    }
    else {
      this.dataset.state = 'liked';
      this.ariaLabel = 'Unlike';
      this.querySelector('.bf-like').replaceWith(svgIcon('like-filled', 24, 24, 'bf-like', 'var(--brand-red)'));
    }

    action.click();
  },
  children: state ? svgIcon('like-filled', 24, 24, 'bf-like', 'var(--brand-red)') : svgIcon('like-empty', 24, 24, 'bf-like'),
});
const newReblogIcon = (action) => ({
  className: customClass + ' bf-icon',
  ariaLabel: action.ariaLabel,
  onclick: function () {
    action.click();
  },
  children: svgIcon('reblog', 24, 24, 'bf-reblog'),
});
const newReplyIcon = (action, actionR, actionL) => ({
  className: customClass + ' bf-icon',
  ariaLabel: action.ariaLabel,
  dataset: { state: '' },
  onclick: function () {
    const notes = this.closest(s('postFooter')).querySelector('.bf-notes');

    if (this.dataset.state) {
      this.dataset.state = '';
      this.querySelector('.bf-reply').style.setProperty('--icon-color-primary', 'rgba(var(--black),.65)');

      if (notes.style.display === 'flex') {
        notes.style.display = 'none';
        if (notes.dataset.selected === 'reply') action.click();
        else if (notes.dataset.selected === 'reblog') actionR.click();
        else actionL.click();
      }
    } else {
      this.dataset.state = 'open';
      this.querySelector('.bf-reply').style.setProperty('--icon-color-primary', 'var(--brand-blue)');

      if (notes.style.display === 'none') {
        notes.style.display = 'flex';
        action.click();
      } else {
        notes.querySelector('.bf-notesSelector.bf-reply')?.click();
      }
    }

    action.click();
  },
  children: svgIcon('reply-empty', 24, 24, 'bf-reply'),
});
const newNotesButton = (action, actionR, actionL, count) => ({
  className: customClass + ' bf-notesIcon',
  dataset: { state: '' },
  onclick: function () {
    const notes = this.closest(s('postFooter')).querySelector('.bf-notes');

    if (this.dataset.state) {
      this.dataset.state = '';

      if (notes.style.display === 'flex') {
        notes.style.display = 'none';
        if (notes.dataset.selected === 'reply') action.click();
        else if (notes.dataset.selected === 'reblog') actionR.click();
        else actionL.click();
      }
    } else {
      if (notes.style.display === 'none') {
        this.dataset.state = 'open';
        notes.style.display = 'flex';
        action.click();
      }
    }
  },
  children: count + (count === 1 ? ' note' : ' notes')
});
const newNotes = (action, actionR, actionL, count, rCount, lCount) => {
  let selected = 'reply';

  return {
    className: customClass + ' bf-notes',
    style: 'display:none',
    dataset: { selected },
    children: [
      {
        className: customClass + ' bf-notesSelector bf-reply',
        dataset: { selected: selected === 'reply' ? 'selected' : '' },
        onclick: function () {
          if (selected !== 'reply') {
            selected = 'reply';
            Array.from(this.parentElement.children).forEach(s => s.dataset.selected = '');
            this.dataset.selected = 'selected';
            this.parentElement.dataset.selected = 'reply';
            action.click();
          }
        },
        children: [
          svgIcon('reply-empty', 24, 24, 'bf-reply'),
          count || '0'
        ]
      },
      {
        className: customClass + ' bf-notesSelector bf-reblog',
        dataset: { selected: selected === 'reblog' ? 'selected' : '' },
        onclick: function () {
          if (selected !== 'reblog') {
            selected = 'reblog';
            Array.from(this.parentElement.children).forEach(s => s.dataset.selected = '');
            this.dataset.selected = 'selected';
            this.parentElement.dataset.selected = 'reblog';
            actionR.click();
          }
        },
        children: [
          svgIcon('reblog', 24, 24, 'bf-reblog'),
          rCount
        ]
      },
      {
        className: customClass + ' bf-notesSelector bf-like',
        dataset: { selected: selected === 'like' ? 'selected' : '' },
        onclick: function () {
          if (selected !== 'like') {
            selected = 'like';
            Array.from(this.parentElement.children).forEach(s => s.dataset.selected = '');
            this.dataset.selected = 'selected';
            this.parentElement.dataset.selected = 'like';
            actionL.click();
          }
        },
        children: [
          svgIcon('like-empty', 24, 24, 'bf-like'),
          lCount
        ]
      }
    ]
  };
};

const fixFooters = posts => posts.forEach(async post => {
  try {
    const footer = post.querySelector(footerSelector);
    const replyButton = footer.querySelector(replySelector);
    const reblogButton = footer.querySelector(reblogSelector);
    const likeButton = footer.querySelector(likeSelector);
    const notesButtonR = footer.querySelector(notesSelectorR);
    const notesButtonL = footer.querySelector(notesSelectorL);
    const shareButton = footer.querySelector(shareSelector);

    timelineObject(post).then(({ liked, replyCount, likeCount, reblogCount, noteCount }) => {
      const buttonContainer = {
        className: 'bf-container',
        children: [

          newReplyIcon(replyButton, notesButtonR, notesButtonL),
          newReblogIcon(reblogButton),
          newLikeIcon(likeButton, liked),
        ]
      };

      footer.prepend(noact(newNotesButton(replyButton, notesButtonR, notesButtonL, noteCount)));
      footer.append(noact(buttonContainer));
      footer.parentElement.insertBefore(noact(newNotes(replyButton, notesButtonR, notesButtonL, replyCount, reblogCount, likeCount)), footer.nextElementSibling);
    });
  } catch (e) { console.error(e, post); }

});

export const main = async () => {
  postFunction.start(fixFooters);
};
export const clean = async () => {
  postFunction.stop(fixFooters);
  document.querySelectorAll(`.${customClass}`).forEach(s => s.remove());
};