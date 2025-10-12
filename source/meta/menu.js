'use strict';
{
  (
    async function () {
      const { debounce, importFeatures, featureify, deepEquals } = await import('../scripts/utility/jsTools.js');
      const { noact } = await import('../scripts/utility/noact.js');
      const { camelCase } = await import('../scripts/utility/case.js');
      const { parse, formatRgb } = culori;

      let picker;

      let connectionPort;
      let connected = false

      const postData = action => {
        if (!connected) {
          connectionPort = browser.runtime.connect({ name: "menuPort" });
          connected = true;

          connectionPort.onDisconnect.addListener(() => connected = false)
        }
        connectionPort.postMessage({ action });
      };

      const onToggleFeature = async function () {
        const name = this.getAttribute('name');
        const checked = this.checked ? true : false;
        let { preferences } = await browser.storage.local.get('preferences');

        if (checked) preferences[name].enabled = true;
        else preferences[name].enabled = false;
        browser.storage.local.set({ preferences });

        const secondaryContent = this.closest('li').querySelector('.ui-secondaryContent');
        if (secondaryContent) {
          const state = secondaryContent.getAttribute('active') === 'true' ? true : false;
          if (!state && checked || state && !checked) this.closest('.ui-primaryContent').querySelector('.ui-featureTitle').click();
        }
      };
      const onTextInput = async function ({ target }) {
        const value = target.value;
        const [name, key] = target.name.split('-');
        let { preferences } = await browser.storage.local.get('preferences');
        preferences[name].options[key] = value;

        browser.storage.local.set({ preferences });
      };

      const updateTheme = colors => {
        colors ??= {
          "black": "0 0 0",
          "white": "255 255 255",
          "whiteOnDark": "255 255 255",
          "navy": "0 25 53",
          "red": "255 73 48",
          "orange": "255 138 0",
          "yellow": "232 215 56",
          "green": "0 207 53",
          "blue": "0 184 255",
          "purple": "124 92 255",
          "pink": "255 98 206",
          "accent": "0 184 255 / 1",
          "deprecatedAccent": "0 184 255",
          "follow": "243 248 251"
        };
        document.getElementById('ui-theme').innerText = `
          :root {
            --white: ${colors.white};
            --white-on-dark: ${colors.whiteOnDark};
            --primary: ${colors.navy};
            --accent: ${colors.accent};
            --secondary-accent: ${colors.deprecatedAccent || colors.secondaryAccent};
            --purple: ${colors.purple};
            --black: ${colors.black};
          }`;
      };

      const title = featureTitle => {
        return {
          className: 'ui-featureTitle',
          onclick: function () {
            this.closest('li').dataset.new = false;
            const secondaryContent = this.closest('li').querySelector('.ui-secondaryContent');
            const caret = this.querySelector('svg');
            if (secondaryContent.getAttribute('active') === 'true') {
              secondaryContent.setAttribute('active', 'false');
              caret.style.transform = 'rotate(180deg)';
            } else {
              secondaryContent.setAttribute('active', 'true');
              caret.style.transform = 'rotate(360deg)';
            }
          },
          children: [
            {
              tag: 'h2',
              children: [featureTitle]
            },
            {
              className: 'ui-caretWrapper',
              children: [{
                tag: 'svg',
                width: 24,
                height: 24,
                style: 'transform: rotate(180deg);',
                children: [{
                  tag: 'use',
                  href: '#icons-caret'
                }]
              }]
            }
          ]
        }
      };

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

      const newFeatureItem = (name, feature = {}, preference = {}) => {
        let featureItem;

        try {
          const category = typeof feature.category === 'string' ? feature.category : feature.category.join(' ');
          featureItem = noact({
            tag: 'li',
            dataset: {
              category,
              searchable: JSON.stringify(feature),
              new: preference.new ? true : false
            },
            children: [
              {
                className: 'ui-primaryContent',
                children: [
                  title(feature.title),
                  {
                    className: 'ui-toggleWrapper',
                    children: [
                      {
                        tag: 'input',
                        type: 'checkbox',
                        className: 'ui-toggle',
                        id: `ui-feature-${name}`,
                        name: feature.name,
                        onchange: onToggleFeature
                      }
                    ]
                  }
                ]
              },
              {
                className: 'ui-secondaryContent',
                children: [
                  'description' in feature ? { children: [feature.description] } : null,
                  'extendedDescription' in feature ? feature.extendedDescription : null,
                  'links' in feature ? {
                    tag: 'p',
                    children: [
                      'see: ',
                      feature.links.map((link, i) => {
                        return [
                          {
                            href: link.url,
                            children: [link.text]
                          },
                          i === feature.links.length - 1 ? '' : ', '
                        ]
                      })
                    ]
                  } : ''
                ]
              }
            ]
          });
          featureItem.querySelector('.ui-toggleWrapper').append($(`<label for="ui-feature-${name}">toggle ${feature.name}</label`)[0]); // for some reason, vanilla js is incapable of setting the for attribute on labels, so jquery is used

          if (preference.enabled) featureItem.querySelector('input').setAttribute('checked', '');

          if ('options' in preference) {
            const optionsWrapper = $('<div class="ui-options"><h2>options</h2></div>');

            Object.keys(feature.preferences.options).forEach(key => {
              const option = feature.preferences.options[key];
              if (typeof option.name === 'undefined') option.name = option.title; // weh
              let wrapper, tooltip, credit;
              option.tooltip && (tooltip = $(`<div class="ui-tooltipAnchor"><div class="ui-tooltip">${option.tooltip}</div></div>`));
              option.credit && ('');

              switch (option.type) {
                case 'toggle': {
                  wrapper = $(`<div class="ui-inputWrapper ui-checkboxWrapper"></div>`);
                  const input = $('<input>', { class: 'ui-checkbox', type: 'checkbox', id: `ui-feature-${name}-${key}`, name: `${name}-${key}` });
                  const label = $(`<label for="ui-feature-${name}-${key}" name="${name}-${key}">${option.name}</label>`);

                  wrapper.append(label);
                  wrapper.append(input);

                  if (preference.options[key]) input.attr('checked', '');

                  input.on('change', async function () {
                    const checked = this.checked ? true : false;
                    let { preferences } = await browser.storage.local.get('preferences');

                    if (checked) preferences[name].options[key] = true;
                    else preferences[name].options[key] = false;

                    browser.storage.local.set({ preferences });
                  });
                  break;
                } case 'select': {
                  wrapper = $(`<div class="ui-inputWrapper "><label for="ui-feature-${name}-${key}">${option.name}</label></div>`);
                  const selectInput = $(`<select class="ui-select" id="ui-feature-${name}-${key}" name="${name}-${key}"></select>`);

                  Object.keys(option.options).forEach(subKey => {
                    const subOption = option.options[subKey];
                    const value = $(`<option value="${subOption.value}">${subOption.name}</option>`);

                    selectInput.append(value);

                    if (preference.options[key] === subOption.value) value.attr('selected', '');
                  });

                  wrapper.append(selectInput);

                  selectInput.on('change', async function () {
                    const { value } = this;
                    let { preferences } = await browser.storage.local.get('preferences');

                    preferences[name].options[key] = value;

                    browser.storage.local.set({ preferences });
                  });
                  break;
                } case 'multiSelect': {
                  wrapper = $(`<div class="ui-inputWrapper "><label for="ui-feature-${name}-${key}">${option.name}</label></div>`);
                  const multiSelectWrapper = $(`<div class="ui-multiSelectWrapper"></div>`);

                  Object.keys(option.options).forEach(subKey => {
                    const subOption = option.options[subKey];
                    const multiSelectItem = $(`<div class="ui-checkboxWrapper"></div>`);
                    const input = $('<input>', { class: 'ui-checkbox', type: 'checkbox', id: `ui-feature-${name}-${key}-${subKey}`, name: `${name}-${key}` });
                    const label = $(`<label for="ui-feature-${name}-${key}-${subKey}" name="${name}-${key}">${subOption.name}</label>`);

                    multiSelectItem.append(label);
                    multiSelectItem.append(input);
                    multiSelectWrapper.append(multiSelectItem);

                    if (preference.options[key][subKey]) input.attr('checked', '');

                    input.on('change', async function () {
                      const checked = !!this.checked;
                      let { preferences } = await browser.storage.local.get('preferences');

                      if (checked) preferences[name].options[key][subKey] = true;
                      else preferences[name].options[key][subKey] = false;

                      browser.storage.local.set({ preferences });
                    });
                  });

                  wrapper.append(multiSelectWrapper);
                  break;
                } case 'listSelect': {
                  wrapper = $(`<div class="ui-inputWrapper"><label for="ui-feature-${name}-${key}">${option.name}</label></div>`);
                  const listSelectWrapper = $(`<div class="ui-listSelectWrapper"></div>`);

                  option.options.forEach(listItem => {
                    const listItemName = camelCase(listItem);
                    const input = $('<input>', { class: 'ui-listSelect', type: 'checkbox', id: `ui-feature-${name}-${key}-${listItemName}`, name: `${name}-${key}` });
                    const label = $(`<label for="ui-feature-${name}-${key}-${listItemName}" name="${name}-${key}">${listItem}</label>`);

                    listSelectWrapper.append(input);
                    listSelectWrapper.append(label);

                    if (preference.options[key].includes(listItem)) input.attr('checked', '');

                    input.on('change', async function () {
                      const checked = !!this.checked;
                      let { preferences } = await browser.storage.local.get('preferences');

                      if (checked) preferences[name].options[key].push(listItem);
                      else preferences[name].options[key] = preferences[name].options[key].filter(item => item !== listItem);

                      browser.storage.local.set({ preferences });
                    });
                  });

                  wrapper.append(listSelectWrapper);
                  break;
                } case 'number': {
                  wrapper = $(`<div class="ui-inputWrapper ui-numInputWrapper"></div>`);
                  const label = $(`<label for="ui-feature-${name}-${key}" name="${name}-${key}">${option.name}</label>`);
                  const numInput = $('<input>', {
                    type: 'number',
                    class: 'ui-numInput',
                    placeholder: option.value,
                    min: option.min,
                    max: option.max,
                    step: option.step,
                    style: `width: ${String(option.max).length}em;`,
                    value: preference.options[key],
                    id: `ui-feature-${name}-${key}`,
                    name: `${name}-${key}`
                  });

                  wrapper.append(label);
                  wrapper.append(numInput);

                  numInput.on('change', async function () {
                    const value = this.value;
                    let { preferences } = await browser.storage.local.get('preferences');
                    preferences[name].options[key] = +value;
                    browser.storage.local.set({ preferences });
                  });
                  break;
                } case 'range': {
                  wrapper = $(`<div class="ui-inputWrapper ui-rangeInputWrapper"></div>`);
                  const label = $(`<label for="ui-feature-${name}-${key}" name="${name}-${key}" id="ui-feature-${name}-${key}-label">${option.name} (value: ${preference.options[key]}${option.unit || ''})</label>`);
                  const rangeInput = $('<input>', {
                    type: 'range',
                    class: 'ui-rangeInput',
                    placeholder: option.value,
                    min: option.min,
                    max: option.max,
                    step: option.step,
                    list: 'list' in option ? `${name}-${key}-list` : '',
                    value: preference.options[key],
                    id: `ui-feature-${name}-${key}`,
                    name: `${name}-${key}`
                  });

                  wrapper.append(label);
                  wrapper.append(rangeInput);

                  if ('list' in option) {
                    const list = $(`<datalist id="${name}-${key}-list">${option.list.map(({ value, label }) => `<option value="${value}" label="${label}"></option>`).join('')}</datalist>`);
                    wrapper.append(list);
                  }

                  rangeInput.on('change', async function () {
                    const value = this.value;
                    let { preferences } = await browser.storage.local.get('preferences');
                    preferences[name].options[key] = +value;
                    document.getElementById(`ui-feature-${name}-${key}-label`).innerText = `${option.name} (value: ${value}${option.unit || ''})`;
                    browser.storage.local.set({ preferences });
                  });
                  break;
                } case 'text': {
                  const type = option.textarea ? '<textarea>' : '<input>'
                  wrapper = $(`<div class="ui-inputWrapper"></div>`);
                  const label = $(`<label for="ui-feature-${name}-${key}" name="${name}-${key}">${option.name}</label>`);
                  const textInput = $(type, {
                    class: 'ui-textInput',
                    type: 'text',
                    autocorrect: 'off',
                    spellcheck: 'false',
                    placeholder: option.placeholder,
                    list: 'list' in option ? `${name}-${key}-list` : '',
                    id: `ui-feature-${name}-${key}`,
                    name: `${name}-${key}`,
                    value: preference.options[key]
                  });
                  if (option.textarea) textInput.text(preference.options[key]);
                  if ('list' in option) {
                    const list = $(`<datalist id="${name}-${key}-list">${option.list.map(item => `<option value="${item}"></option>`).join('')}</datalist>`);
                    wrapper.append(list);
                  }

                  wrapper.append(label);
                  wrapper.append(textInput);

                  textInput.on('change', debounce(onTextInput));
                  break;
                } case 'color': {
                  wrapper = $('<div>', { class: 'ui-inputWrapper' });
                  const colorButton = $('<button>', { id: `ui-feature-${name}-${key}`, class: 'ui-colorInput', feature: name, value: key });
                  const resetButton = $('<button>', { class: 'ui-colorInput ui-reset' });

                  colorButton.text(option.name);
                  colorButton.css({
                    backgroundColor: `rgb(${preference.options[key]})`,
                    color: contrastBW(parse(`rgb(${preference.options[key]})`)),
                    borderColor: `color-mix(in srgb, rgb(${preference.options[key]}), rgb(var(--black)) 20%)`
                  });
                  colorButton.on('click', locatePicker);

                  resetButton.text('reset');
                  resetButton.css({
                    backgroundColor: `rgb(${option.value})`,
                    color: contrastBW(parse(`rgb(${option.value})`)),
                    borderColor: `color-mix(in srgb, rgb(${option.value}), rgb(var(--black)) 20%)`
                  });
                  resetButton.on('click', async () => {
                    colorButton.css({
                      backgroundColor: `rgb(${option.value})`,
                      color: contrastBW(parse(`rgb(${option.value})`)),
                      borderColor: `color-mix(in srgb, rgb(${option.value}), rgb(var(--black)) 20%)`
                    });
                    let { preferences } = await browser.storage.local.get('preferences');
                    preferences[name].options[key] = option.value;
                    browser.storage.local.set({ preferences });

                    if (preferences.customColors.enabled && preferences.customColors.options.menuTheme) {
                      updateTheme(preferences.customColors.options);
                    }
                  });

                  wrapper.append(colorButton);
                  wrapper.append(resetButton);

                  break;
                } default: {
                  console.warn(`${name}.${key} [missing support for ${option.type}]`);
                  break;
                }
              }

              tooltip && (wrapper.append(tooltip));
              credit && (wrapper.append(credit));
              wrapper && optionsWrapper.append(wrapper);
            });

            featureItem.querySelector('.ui-secondaryContent').append(optionsWrapper[0]); // jquery to html conversion
          }
        } catch (e) {
          console.error(`error creating feature item '${name}':`, e);
        }

        return featureItem;
      };

      const setupButtons = className => {
        document.querySelectorAll(`.${className}`).forEach(btn => btn.addEventListener('click', function () {
          [...this.closest(`#${className}s`).querySelectorAll(`:scope .${className}`)].filter(elem => elem.matches(`.${className}`)).forEach(btn => btn.setAttribute('active', 'false'));
          this.setAttribute('active', 'true');
          let target = `ui-${this.getAttribute('target')}`;
          target = document.getElementById(target);
          const classes = target.classList;
          [...target.parentElement.children].filter(elem => elem.matches(`.${[...classes].join('.')}`)).forEach(elem => elem.setAttribute('active', 'false'));
          target.setAttribute('active', 'true');
        }));
      };
      const createFeatures = (installedFeatures, preferences) => {
        $('[data-searchable]').remove();

        Object.keys(installedFeatures).forEach(key => {
          const feature = installedFeatures[key];
          const preference = preferences[key];

          if (feature && preference) {
            const featureItem = newFeatureItem(key, feature, preference, preferences);
            $(`#ui-featureContainer`).append(featureItem);
          }
        });

        filterAlphabetical();
      };

      const filterAlphabetical = (reverse = false) => {
        const container = document.getElementById('ui-featureContainer');
        const indexMap = reverse ? [1, -1] : [-1, 1];
        container.replaceChildren(...Array.from(container.children).sort((a, b) => {
          if (!a.dataset.searchable) return -1;
          else if (!b.dataset.searchable) return 1;
          const dataA = JSON.parse(a.dataset.searchable);
          const dataB = JSON.parse(b.dataset.searchable);

          return indexMap[[dataA.title, dataB.title].sort().indexOf(dataA.title)];
        }));
      };

      const enabledSelector = ':has(input:checked:not([dummy], .ui-options input)),:has(input[active="true"])';
      const filterEnabled = (reverse = false) => {
        const container = document.getElementById('ui-featureContainer');
        const indexMap = reverse ? [1, -1] : [-1, 1];
        container.replaceChildren(...Array.from(container.children).sort((a, b) => {
          if (!a.dataset.searchable) return -1;
          else if (!b.dataset.searchable) return 1;

          if (a.matches(enabledSelector) && !b.matches(enabledSelector)) return indexMap[0];
          else if (!a.matches(enabledSelector) && b.matches(enabledSelector)) return indexMap[1];
          else return 0;
        }));
      };

      const onSearch = ({ target }) => {
        const query = target.value.replace(/[^\w]/g, '');
        if (query) {
          document.getElementById('ui-searchFilter').innerText = `
          #ui-featureContainer > li:not([data-searchable*="${query}" i]) { display: none; }
        `;
        }
        else document.getElementById('ui-searchFilter').innerText = '';
      };

      const clampY = y => y + 456 <= visualViewport.height ? y : visualViewport.height - 456;
      const clampX = x => x + 240 <= visualViewport.width ? x : visualViewport.width - 256;
      const closePicker = () => {
        window.setTimeout(() => {
          if (!picker.is(':hover')) {
            picker.css('opacity', 0);
            picker[0].dataset.target = '';
            window.setTimeout(() => { picker.hide() }, 150);
          }
        }, 300);
      };
      const locatePicker = async ({ originalEvent }) => {
        const { target } = originalEvent;
        picker[0].dataset.target = target.id;
        const { preferences } = await browser.storage.local.get('preferences');
        const color = parse(`rgb(${preferences[target.getAttribute('feature')].options[target.value]})`);
        picker.css({
          opacity: 1,
          top: clampY(originalEvent.clientY + 8),
          left: clampX(originalEvent.clientX + 8)
        });
        $('#rgb').val(formatRgb(color));
        document.getElementById('rgb').dispatchEvent(new Event('input'));
        picker.show();
        picker.on('mouseleave', closePicker);
      };

      const updateThemeColors = (themeColors, preferences) => {
        if (preferences && preferences.customColors?.enabled && preferences.customColors?.options.menuTheme) {
          updateTheme(preferences?.customColors.options);
        } else {
          updateTheme(themeColors);
        }
      };
      const onStorageChanged = async (changes, areaName) => {
        let { themeColors, preferences } = changes;
        if (areaName !== 'local' || (typeof themeColors === 'undefined' && typeof preferences === 'undefined') || deepEquals(themeColors?.oldValue, themeColors?.newValue)) return;

        updateThemeColors(themeColors?.newValue, preferences?.newValue);
      };

      const changeWidgetState = widget => {
        document.querySelectorAll('.ui-filterWidgets button').forEach(b => b.dataset.state = '');
        widget.dataset.state = 'active';
      };

      const init = async () => {
        postData('clearBadge');

        const [contextKey, contextValue] = location.search.replace('?', '').split('=');

        if (contextKey) document.documentElement.setAttribute(`data-${contextKey}`, contextValue);
        if (contextKey === 'popup') {
          document.body.style.minHeight = '6000px';
          document.body.style.overflow = 'hidden';
        }

        picker = $('#ui-picker');
        picker.hide();

        const installedFeatures = await importFeatures(); // "await has no effect on this type of expression"- it does, actually!
        let { preferences, themeColors } = await browser.storage.local.get();

        if (typeof preferences === 'undefined') {
          preferences = featureify(installedFeatures, preferences);
        }

        updateThemeColors(themeColors, preferences);

        createFeatures(installedFeatures, preferences);

        const parsePreferenceText = text => {
          preferences = JSON.parse(text);

          if (typeof preferences === 'object') {
            browser.storage.local.set({ preferences });
            console.log('successfully imported preferences!');
          } else throw 'invalid data type';

          createFeatures(installedFeatures, preferences);
          document.getElementById('ui-preferenceText').value = JSON.stringify(preferences, null, 2);
        };

        setupButtons('ui-tab');
        setupButtons('ui-featureTab');
        document.getElementById('ui-preferenceText').value = JSON.stringify(preferences, null, 2);

        document.getElementById('ui-export').addEventListener('click', async function () {
          const { preferences } = await browser.storage.local.get('preferences');
          const preferenceExport = new Blob([JSON.stringify(preferences, null, 2)], { type: 'application/json' });
          const url = URL.createObjectURL(preferenceExport);
          const exportLink = document.createElement('a');
          const date = new Date();
          const yy = date.getFullYear().toString();
          const mm = (date.getMonth() + 1).toString(); // zero-based
          const dd = date.getDate().toString();
          exportLink.href = url;
          exportLink.download = `dashboard plus preference export ${mm}-${dd}-${yy}`;

          document.documentElement.append(exportLink);
          exportLink.click();
          exportLink.remove();
          URL.revokeObjectURL(url);
        });
        document.getElementById('ui-textImport').addEventListener('click', function () {
          const input = document.getElementById('ui-preferenceText');
          if (!input.value) return;

          try {
            parsePreferenceText(input.value);
          } catch (e) {
            console.error('failed to import preferences from text!', e);
            this.textContent = 'import failed!';
            this.style.backgroundColor = 'rgb(var(--red))';
            setTimeout(() => {
              this.textContent = 'import from textarea';
              this.style.backgroundColor = 'rgb(var(--white))';
            }, 2000);
          }

          createFeatures(installedFeatures, preferences);
        })
        document.getElementById('ui-import').addEventListener('click', function () {
          if (contextKey === 'popup') window.open(window.location.href.split('?')[0] + '?importFromFile=true');
          else document.getElementById('ui-fileImport').click();
        });
        document.getElementById('ui-fileImport').addEventListener('change', function () {
          if (this.files.length) {
            const reader = new FileReader();
            reader.readAsText(this.files[0]);
            reader.addEventListener('load', () => {
              const button = document.getElementById('ui-import');

              try {
                parsePreferenceText(reader.result);
                button.textContent = 'import successful!';
              } catch (e) {
                console.error('failed to import preferences from file!', e);
                button.textContent = 'import failed!';
                button.style.backgroundColor = 'rgb(var(--red))';
              } finally {
                setTimeout(() => {
                  button.textContent = 'import from file';
                  button.style.backgroundColor = null;
                }, 2000);
              }
            });
          }
        });
        document.getElementById('ui-reset').addEventListener('click', function () {
          const preferences = {};

          browser.storage.local.set({ preferences });
          createFeatures(installedFeatures, preferences);
        });
        document.getElementById('ui-filterAlphabetical').addEventListener('click', function () {
          changeWidgetState(this);
          filterAlphabetical();
        });
        document.getElementById('ui-filterReverseAlphabetical').addEventListener('click', function () {
          changeWidgetState(this);
          filterAlphabetical(true);
        });
        document.getElementById('ui-filterEnabled').addEventListener('click', function () {
          changeWidgetState(this);
          filterEnabled();
        });
        document.getElementById('ui-filterDisabled').addEventListener('click', function () {
          changeWidgetState(this);
          filterEnabled(true);
        });
        document.querySelector('.ui-featureTab[target="search"]').addEventListener('click', function () {
          document.getElementById('ui-featureSearch').focus();
        });
        document.getElementById('ui-featureSearch').addEventListener('input', debounce(onSearch));

        const version = browser.runtime.getManifest().version;
        document.getElementById('version').innerText = `version: v${version}`;

        Object.keys(preferences).forEach(key => { if (preferences[key].new) delete preferences[key].new; });
        browser.storage.local.set({ preferences });

        browser.storage.onChanged.addListener(onStorageChanged);

        if (location.search === '?importFromFile=true') {
          document.querySelector('.ui-tab[target="manage"]').click();
          //document.getElementById('ui-import').click();
        }
      };

      init();
    }()
  )
}