const targetElement = document.getElementById('root');
const white = [255,255,255];
const black = [12,12,12];

export const getThemeColor = color => getComputedStyle(targetElement).getPropertyValue(`--${color}`);

const rgbToHex = (r, g, b) => '#' + [r, g, b]
  .map(x => x.toString(16).padStart(2, '0')).join('');
const hexToRgb = hex =>
  hex.replace(/^#?([a-f\d])([a-f\d])([a-f\d])$/i, (m, r, g, b) => '#' + r + r + g + g + b + b)
    .substring(1).match(/.{2}/g)
    .map(x => parseInt(x, 16));
const luminance = rgb => {
  const a = rgb.map(v => {
    v /= 255;
    return v <= 0.03928
      ? v / 12.92
      : Math.pow((v + 0.055) / 1.055, 2.4);
  });
  return a[0] * 0.2126 + a[1] * 0.7152 + a[2] * 0.0722;
};
const ratio = (lum1, lum2) => lum1 > lum2 ? ((lum2 + 0.05) / (lum1 + 0.05)) : ((lum1 + 0.05) / (lum2 + 0.05));
const contrast = (hex1, hex2) => {
  const lum1 = luminance(hexToRgb(hex1));
  const lum2 = luminance(hexToRgb(hex2));
  return ratio(lum1, lum2);
};
export const contrastBW = hex => {
  const lum = luminance(hexToRgb(hex));
  const lumBlk = luminance(black);
  const lumWht = luminance(white);
  const ratioBlk = ratio(lum, lumBlk);
  const ratioWht = ratio(lum, lumWht);
  if (ratioBlk < ratioWht) return rgbToString(black);
  else return rgbToString(white);
};
const stringToRgb = str => str.replace(/\s/g, '').split(',');
const rgbToString = rgb => rgb.join(',');

export const hexToRgbString = hex => rgbToString(hexToRgb(hex));
export const rgbStringToHex = rgb => rgbToHex(...stringToRgb(rgb));