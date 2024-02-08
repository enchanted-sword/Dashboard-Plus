import { mutationManager } from './utility/mutations.js';
import { percentageNumber } from './utility/reactProps.js';
import { s, style } from './utility/style.js';
import { elem } from './utility/jsTools.js';

const customClass = 'dbplus-votelessResults'; 
const pollSelector = `${s('pollBlock')}:not(.${customClass})`;
const styleElement = style(`
  button${s('pollAnswer')} { overflow: clip; }
  .dbplus-percentageBar {
    position: absolute;
    content: "";
    height: 100%;
    top: 0;
    left: 0;
    background: rgba(var(--accent),.2);
    border-radius: 18px;
  }
`);

const showVotes = async polls => {
  for (const poll of polls) {
    const votes = Array.from(poll.querySelectorAll(`:scope button${s('vote')}`));
    await Promise.all(votes.map(async vote => {
      const { percentage } = await percentageNumber(vote);
      const percentageBar = elem('div', { class: 'dbplus-percentageBar', style: `width: ${percentage}%;` }, null, null);
      vote.prepend(percentageBar);
    }));
    poll.classList.add(customClass);
  }
};

export const main = async () => {
  document.head.append(styleElement);
  mutationManager.start(pollSelector, showVotes);
}

export const clean = async () => {
  mutationManager.stop(showVotes);
  $(`.${customClass}`).removeClass(customClass);
  $('.dbplus-percentageBar').remove();
  styleElement.remove();
}