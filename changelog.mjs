import { Marked } from "marked";
import * as fs from 'node:fs/promises';

const preprocess = text => text.replace('new feature!', '<span class="ui-new">new feature!</span>');
const renderer = {
  heading({ tokens, depth }) {
    return `<h${depth} ${depth < 3 ? 'style="text-align:center;"' : ''}>${this.parser.parseInline(tokens)}</h${depth}>`;
  }
};

const parser = new Marked();
parser.use({
  renderer,
  hooks: { preprocess },
  gfm: true,
  breaks: true
});

const main = async () => {
  const [markdownChangelog, htmlChangelog, textChangelog] = await Promise.all([fs.open("changelog.md", "r"), fs.open("changelog.html", "w"), fs.open("changelog.txt", "w")]);

  const markdown = await markdownChangelog.readFile({ encoding: 'utf-8' });
  const html = parser.parse(markdown);

  htmlChangelog.write(html, 0);
  textChangelog.write(markdown.replace(/#{1,3}\s/g, ''), 0);

  [markdownChangelog, htmlChangelog, textChangelog].map(fileHandle => fileHandle.close());
};

main();