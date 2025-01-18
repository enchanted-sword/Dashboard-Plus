'use strict';

{
  const { formatCss, formatRgb, hsl, parse, clampChroma, converter } = culori;
  const { Poline } = poline;

  const lightnessDisplay = document.getElementById('lightness-display');
  const lightnessValue = document.getElementById('lightness-value');
  const lightness = document.getElementById('lightness');
  const chromaDisplay = document.getElementById('chroma-display');
  const chromaValue = document.getElementById('chroma-value');
  const chroma = document.getElementById('chroma');
  const hueDisplay = document.getElementById('hue-display');
  const hueValue = document.getElementById('hue-value');
  const hue = document.getElementById('hue');
  const oklch = document.getElementById('oklch');
  const rgb = document.getElementById('rgb');
  const picker = document.getElementById('ui-picker');

  let color = { mode: 'oklch', l: Number(lightness.value) / 100, c: Number(chroma.value), h: Number(hue.value) };
  let timeoutID;

  const toOklch = converter('oklch');
  const toRgb = converter('rgb');
  const serialize = color => formatCss(clampChroma(color));
  const extractChannels = /rgb\((\d{1,3}), (\d{1,3}), (\d{1,3})\)/;
  const luminance = rgb => {
    const channels = [rgb.r, rgb.g, rgb.b];
    const a = channels.map(c => c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4));
    return a[0] * 0.2126 + a[1] * 0.7152 + a[2] * 0.0722;
  };
  const ratio = (lum1, lum2) => lum1 > lum2 ? ((lum2 + 0.05) / (lum1 + 0.05)) : ((lum1 + 0.05) / (lum2 + 0.05));
  const black = { mode: 'rgb', r: 0.09803921568627451, g: 0.09803921568627451, b: 0.09803921568627451 };
  const white = { mode: 'rgb', r: 1, g: 1, b: 1 };
  const lumBlack = luminance(black);
  const lumWhite = luminance(white);
  const contrastBW = rgb => {
    const lum = luminance(rgb);
    const ratioBlk = ratio(lum, lumBlack);
    const ratioWht = ratio(lum, lumWhite);
    if (ratioBlk < ratioWht) return formatRgb(black);
    else return formatRgb(white);
  };
  const hslify = ({ h, s, l }) => ([h, s, l]);

  const exportColor = async color => timeoutID = setTimeout(async () => {
    const formattedColor = formatRgb(color);
    const [, r, g, b] = extractChannels.exec(formattedColor);
    const value = [r, g, b].join(' ');
    const [, , feature, option] = picker.dataset.target.split('-');
    const button = document.getElementById(picker.dataset.target);
    button.style.backgroundColor = formattedColor;
    button.style.color = contrastBW(toRgb(color));
    button.style.borderColor = `color-mix(in srgb, ${formattedColor}, rgb(var(--black)) 20%)`;

    const anchor = hsl(color);
    const lower = Object.assign(structuredClone(anchor), { l: .05 });
    const upper = Object.assign(structuredClone(anchor), { l: .95 });
    const colorRange = new Poline({
      anchorColors: [lower, upper, anchor].map(hslify)
    });
    colorRange.numPoints = 3;
    const rangeValues = colorRange.cssColors().map((rangeColor, i) => `--${option}-${(i + 1) * 100}:${formatRgb(parse(rangeColor))};`);

    let { preferences } = await browser.storage.local.get('preferences');
    preferences[feature].options[option] = value;
    browser.storage.local.set({ preferences });

    if (preferences.customColors.enabled && preferences.customColors.options.menuTheme) {
      document.getElementById('ui-theme').innerText = `
      :root {
        --white: ${preferences.customColors.options.white};
        --white-on-dark: ${preferences.customColors.options.whiteOnDark};
        --primary: ${preferences.customColors.options.navy};
        --accent: ${preferences.customColors.options.accent};
        --secondary-accent: ${preferences.customColors.options.secondaryAccent};
        --black: ${preferences.customColors.options.black};
      }`
    }
  }, 500);
  const draw = () => {
    clearTimeout(timeoutID);
    const displayColor = clampChroma(color);
    lightnessDisplay.style.background = `linear-gradient(.25turn, ${serialize({ ...color, l: 0 })}, ${serialize({ ...color, l: .5 })}, ${serialize({ ...color, l: 1 })})`;
    chromaDisplay.style.background = `linear-gradient(.25turn, ${serialize({ ...color, c: 0 })}, ${serialize({ ...color, c: .4 })})`;
    hueDisplay.style.background = `linear-gradient(.25turn in oklch longer hue, ${serialize({ ...color, h: 0 })}, ${serialize({ ...color, h: 360 })})`;

    document.documentElement.style.setProperty('--picker-color', formatCss(displayColor));

    if (picker.dataset.target) exportColor(displayColor);
  };
  const update = type => ({ target: { value } }) => {
    if (['oklch', 'rgb'].includes(type)) {
      const newColor = type === 'oklch' ? parse(value) : toOklch(parse(value));
      if (newColor === void 0) return;
      else color = newColor;
    } else color[type[0]] = type.includes('lightness') ? Number(value) / 100 : Number(value);
    const displayColor = { ...color, l: color.l * 100 };
    (displayColor.c === void 0 || displayColor.c === 'none') && (displayColor.c = 0);
    (displayColor.h === void 0 || displayColor.h === 'none') && (displayColor.h = 0);
    displayColor.l = displayColor.l === 0 ? 0 : displayColor.l.toFixed(2);
    displayColor.c = displayColor.c === 0 ? 0 : displayColor.c.toFixed(4);
    displayColor.h = displayColor.h === 0 ? 0 : displayColor.h.toFixed(2);

    if (type !== 'lightness') lightness.value = displayColor.l;
    if (type !== 'lightness-value') lightnessValue.value = displayColor.l;
    if (type !== 'chroma') chroma.value = displayColor.c;
    if (type !== 'chroma-value') chromaValue.value = displayColor.c;
    if (type !== 'hue') hue.value = displayColor.h;
    if (type !== 'hue-value') hueValue.value = displayColor.h;
    if (type !== 'oklch') oklch.value = `oklch(${displayColor.l}%, ${displayColor.c}, ${displayColor.h})`;
    if (type !== 'rgb') rgb.value = formatRgb(color);

    draw();
  };

  window.addEventListener('load', draw);

  [lightness, lightnessValue, chroma, chromaValue, hue, hueValue, oklch, rgb].map(input => input.addEventListener('input', update(input.id)));
}