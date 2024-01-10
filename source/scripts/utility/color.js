const hexToRgb = (hex = '') => {
  hex = hex.replace(/^#?([a-f\d])([a-f\d])([a-f\d])$/i, (m, r, g, b) => {
    return r + r + g + g + b + b;
  });
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result
    ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16)
      }
    : null;
};
const luminance = ({ r, g, b }) => {
  const a = [r, g, b].map(v => {
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
const contrastBW = hex => {
  const lum = luminance(hexToRgb(hex));
  const lumBlk = luminance({ r: 12, g: 12, b: 12 });
  const lumWht = luminance({ r: 255, g: 255, b: 255 });
  const ratioBlk = ratio(lum, lumBlk);
  const ratioWht = ratio(lum, lumWht);
  if (ratioBlk < ratioWht) return '12,12,12';
  else return '255,255,255';
};
const rgbToString = ({ r, g, b }) => `${r},${g},${b}`;

export const hexToRgbString = hex => rgbToString(hexToRgb(hex));