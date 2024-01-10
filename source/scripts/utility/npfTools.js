/**
 * @param {object} block - NPF text block
 * @returns {string} The formatted contents of the text block as an HTML string
 */
export const formatTextBlock = block => {
  if (block.type !== 'text') return;
  if ('formatting' in block === false) return block.text;

  const textArray = [...block.text];
  const formattedArray = [];
  const formatKey = {
    bold: 'b',
    italic: 'i',
    strikethrough: 's',
    small: 'small',
    color: 'span'
  };
  block.formatting.forEach(formatting => {
    const type = formatting.type;
    const format = formatKey[type] || 'a';
    switch (type) {
      case "link":
        formatting.startTag = `<a target="_blank" rel="noopener" href="${formatting.url}">`
        break;
      case "mention":
        formatting.startTag = `<a target="_blank" rel="noopener" href="${formatting.blog.url}">`
        break;
      case "color":
        formatting.startTag = `<span style="color: ${formatting.hex};">`;
        break;
      default: 
        formatting.startTag = `<${format}>`;
    }
    formatting.endTag = `</${format}>`;
  });
  textArray.forEach((char, index) => {
    block.formatting.forEach(formatting => {
      if (formatting.end === index || (index === (textArray.length - 1) && formatting.end === textArray.length)) {
        formattedArray.push(formatting.endTag);
      } else if (formatting.start === index) {
        formattedArray.push(formatting.startTag);
      }
    });
    formattedArray.push(char);
  });

  return formattedArray.join('');
};