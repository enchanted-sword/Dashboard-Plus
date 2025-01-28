import { mutationManager } from './utility/mutations.js';
import { percentageNumber } from './utility/reactProps.js';
import { s, style } from './utility/style.js';

const customClass = 'dbplus-exactVotes';
const pollSelector = `${s('pollBlock')}:not(.${customClass})`;
const styleElement = style(`
  ${s('pollAnswerPercentage')} {
    position: relative; bottom: 4px;
  }
  ${s('results')} { overflow: hidden; }
  .dbplus-answerVoteCount {
    position: absolute;
    bottom: -2px;
    right: 16px;
    font-size: 12px;
  }
`);

const detailPolls = async polls => {
  for (const poll of polls) {
    const answers = Array.from(poll.querySelectorAll(`:scope ${s('pollAnswer results')}`));
    const totalCount = Number(poll.querySelector(s('pollSummary')).innerText.replace(/,/, '').match(/\d+/)[0]);
    await Promise.all(answers.map(async answer => {
      const { percentage } = await percentageNumber(answer);
      $(answer).append($(`<span class="dbplus-answerVoteCount">(${Math.round(totalCount * percentage / 100)})</span>`));
    }));
    poll.classList.add(customClass);
  }
};

export const main = async () => {
  document.body.append(styleElement);
  mutationManager.start(pollSelector, detailPolls);
}

export const clean = async () => {
  mutationManager.stop(detailPolls);
  $(`.${customClass}`).removeClass(customClass);
  $('.dbplus-answerVoteCount').remove();
  styleElement.remove();
}