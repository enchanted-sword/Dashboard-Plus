'use strict';
{
  (
    async function () {
      const { debounce, importFeatures, featureify } = await import('../scripts/utility/jsTools.js');
      const { noact } = await import('../scripts/utility/noact.js');
      const { camelCase } = await import('../scripts/utility/case.js');

      const descButton = () => {
        const button = $(`<button class='ui-descButton'><div class="ui-caretWrapper"><svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" style="transform: rotate(180deg);"><use href="#icons-caret"></use></svg></div></button>`);
        button.on('click', function () {
          const secondaryContent = this.closest('li').querySelector('.ui-secondaryContent');
          const caret = this.querySelector('svg');
          if (secondaryContent.getAttribute('active') === 'true') {
            secondaryContent.setAttribute('active', 'false');
            caret.style.transform = 'rotate(180deg)';
          } else {
            secondaryContent.setAttribute('active', 'true');
            caret.style.transform = 'rotate(360deg)';
          }
        });
        return button;
      }

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
      const onColorChange = async (color, input) => {
        let { preferences } = await browser.storage.local.get('preferences');
        $(input.nextElementSibling).css('background', color);
        const [name, key, optionsKey] = input.getAttribute('name').split('-');
        preferences[name].preferences[key][optionsKey] = color;
        browser.storage.local.set({ preferences });
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

      /* const hexToRgbString = hex =>
        hex.replace(/^#?([a-f\d])([a-f\d])([a-f\d])$/i, (m, r, g, b) => '#' + r + r + g + g + b + b)
          .substring(1).match(/.{2}/g)
          .map(x => parseInt(x, 16))
          .join(',');

      let themeStyleElement;

      const onStorageChanged = async (changes, areaName) => {
        let { themeColors, preferences } = changes;
        if (areaName !== 'local' || (typeof themeColors === 'undefined' && typeof preferences === 'undefined') || deepEquals(preferences?.oldValue.customColors, preferences?.newValue.customColors)) return;
        if (typeof themeColors === 'undefined' && !preferences?.newValue.customColors.enabled) { // case when disabling customColors
          ({ themeColors } = await browser.storage.local.get('themeColors'));
          themeColors = { newValue: themeColors };
        }

        themeHandler.updateThemeColors(themeColors?.newValue, preferences.newValue);
      };
      const themeStyle = colors => themeStyleElement.innerText = `
      :root {
        --t-black: ${colors.black};
        --t-white: ${colors.white};
        --t-white-on-dark: ${colors.whiteOnDark};
        --t-navy: ${colors.navy};
        --t-red: ${colors.red};
        --t-orange: ${colors.orange};
        --t-yellow: ${colors.yellow};
        --t-green: ${colors.green};
        --t-blue: ${colors.blue};
        --t-purple: ${colors.purple};
        --t-pink: ${colors.pink};
        --t-accent: ${colors.accent};
        --t-secondary-accent: ${colors.secondaryAccent};
        --t-follow: ${colors.follow};
      }
    `;
      const updateThemeColors = (themeColors, preferences) => {
        if (preferences && preferences.customColors.enabled) {
          const rgbColors = preferences.customColors.preferences.colors;
          Object.keys(rgbColors).forEach(function (color) { rgbColors[color] = hexToRgbString(rgbColors[color]); });
          themeStyle(rgbColors);
        } else if (themeColors) themeStyle(themeColors);
      };
      const themeHandler = {
        active: true,
        start: async function () {
          if (this.active) this.stop;
          const { themeColors, preferences } = await browser.storage.local.get();
          themeStyleElement = document.createElement('style');
          themeStyleElement.id = 'ui-themeStyleElement';
          document.documentElement.append(themeStyleElement);
          updateThemeColors(themeColors, preferences);

          this.active = true;
          browser.storage.onChanged.addListener(onStorageChanged);
        },
        stop: function () {
          if (!this.active) return;
          $('#ui-themeStyleElement').remove();
          this.active = false;
          browser.storage.onChanged.removeListener(onStorageChanged);
        }
      }; */

      const init = async () => {
        if (location.search === '?popup=true') {
          document.body.style.minHeight = '6000px';
          document.body.style.overflow = 'hidden';
        }

        const installedFeatures = await importFeatures(); // "await has no effect on this type of expression"- it does, actually!
        let { preferences } = await browser.storage.local.get('preferences');

        if (typeof preferences === 'undefined') {
          preferences = featureify(installedFeatures, preferences);
        }

        createFeatures(installedFeatures, preferences);

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
          const mm = (date.getMonth()).toString();
          const dd = date.getDate().toString();
          exportLink.href = url;
          exportLink.download = `dashboard plus preference export ${mm}-${dd}-${yy}`;

          document.documentElement.append(exportLink);
          exportLink.click();
          exportLink.remove();
          URL.revokeObjectURL(url);
        });
        document.getElementById('ui-import').addEventListener('click', () => {
          let preferences;
          const input = document.getElementById('ui-preferenceText');
          if (!input.value) return;

          preferences = JSON.parse(input.value);
          try {
            if (typeof preferences === 'object') {
              browser.storage.local.set({ preferences });
              console.log('successfully imported preferences!');
            } else throw 'invalid data type';
          } catch (e) {
            console.error('failed to import preferences!', e);
            $('#ui-import').text('import failed!').css('background-color', 'rgb(var(--red))');
            setTimeout(() => {
              $('#ui-import').text('import preferences').css('background-color', 'rgb(var(--white))');
            }, 2000);
          }

          createFeatures(installedFeatures, preferences);
        });
        document.getElementById('ui-reset').addEventListener('click', function () {
          const preferences = {};
          Object.keys(installedFeatures).map(feature => preferences[feature] = transformPreferences(installedFeatures[feature].preferences));

          browser.storage.local.set({ preferences });
          createFeatures(installedFeatures, preferences);
        });
        document.getElementById('ui-featureSearch').addEventListener('input', debounce(onSearch));

        /* const inheritColors = document.getElementById('ui-manage-inheritColors');
        if (preferences.inheritColors) {
          inheritColors.checked = true;
          themeHandler.start();
        }

        inheritColors.addEventListener('change', async function () {
          const { preferences } = await browser.storage.local.get('preferences');
          if (this.checked) {
            themeHandler.start();
            preferences.inheritColors = true;
          }
          else {
            themeHandler.stop();
            preferences.inheritColors = false;
          }
          browser.storage.local.set({ preferences });
        }); */

        const version = browser.runtime.getManifest().version;
        document.getElementById('version').innerText = `version: v${version}`;

        Object.keys(preferences).forEach(key => { if (preferences[key].new) delete preferences[key].new; });
        browser.storage.local.set({ preferences });
      };

      Coloris({
        themeMode: 'auto',
        alpha: false,
        theme: 'polaroid',
        el: '.ui-colors',
        onChange: debounce(onColorChange)
      });

      init();
    }()
  )
}