import { style, s } from './utility/style.js';
import { translate } from './utility/tumblr.js';

const styleElement = style(`[role="tablist"] ${s('button tab')}:first-of-type [tabindex]:after { content: "${translate('All')}" !important; }`);

export const main = async () => document.body.append(styleElement);

export const clean = async () => styleElement.remove();