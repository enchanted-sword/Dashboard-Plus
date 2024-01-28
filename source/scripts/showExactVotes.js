import { mutationManager } from './utility/mutations.js';
import { percentageNumber } from './utility/reactProps.js';
import { s } from './utility/style.js';

const customClass = 'dbplus-exactVotes'; 
const pollSelector = `${s('pollBlock')}:not(.${customClass})`;

const detailPolls = async polls => {
  for (const poll of polls) {
    const answers = poll.querySelectorAll(`:scope ${s('pollAnswer results')}`);
    const totalCount = Number(poll.querySelector(s('pollSummary')).innerText.replace(/,/, '').match(/\d+/)[0]);
    answers.forEach(async answer => {
      const { percentage } = await percentageNumber(answer);
      $(answer).append($(`<span class="dbplus-answerVoteCount">(${Math.round(totalCount * percentage / 100)})</span>`));
    });
    poll.classList.add(customClass);
  }
};

export const main = async () => mutationManager.start(pollSelector, detailPolls);

export const clean = async () => {
  mutationManager.stop(detailPolls);
  $(`.${customClass}`).removeClass(customClass);
  $('.dbplus-answerVoteCount').remove();
}