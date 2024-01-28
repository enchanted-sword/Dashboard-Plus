import { mutationManager } from './utility/mutations.js';
import { percentageNumber } from './utility/reactProps.js';
import { s } from './utility/style.js';
import { elem } from './utility/jsTools.js';

const customClass = 'dbplus-votelessResults'; 
const pollSelector = `${s('pollBlock')}:not(.${customClass})`;

const showVotes = async polls => {
  for (const poll of polls) {
    const votes = poll.querySelectorAll(`:scope button${s('vote')}`);
    votes.forEach(async vote => {
      const { percentage } = await percentageNumber(vote);
      const percentageBar = elem('div', { class: 'dbplus-percentageBar', style: `width: ${percentage}%;` }, null, null);
      vote.prepend(percentageBar);
    });
    poll.classList.add(customClass);
  }
};

export const main = async () => mutationManager.start(pollSelector, showVotes);

export const clean = async () => {
  mutationManager.stop(showVotes);
  $(`.${customClass}`).removeClass(customClass);
  $('.dbplus-percentageBar').remove();
}