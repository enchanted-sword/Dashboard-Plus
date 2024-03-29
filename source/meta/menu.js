'use strict';

{
  import('../scripts/utility/jsTools.js').then(({ deepEquals, debounce, importFeatures }) => {
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

    const onTextInput = async ({ target }) => {
      const value = target.value;
      const [ name, key ] = target.name.split('-');
      let { preferences } = await browser.storage.local.get('preferences');
      preferences[name].preferences[key].value = value;

      browser.storage.local.set({ preferences });
    }
    const onColorChange = async (color, input) => {
      let { preferences } = await browser.storage.local.get('preferences');
      $(input.nextElementSibling).css('background', color);
      const [name, key, optionsKey] = input.getAttribute('name').split('-');
      preferences[name].preferences[key][optionsKey] = color;
      browser.storage.local.set({ preferences });
    }

    const newFeatureItem = (name, feature = {}, preference = {}) => {
      const category = typeof feature.category === 'string' ? feature.category : feature.category.join(' ');
      const wrapper = $(`<li>`, { category, name });
      const featureTitle = $(`<h2>${feature.name}</h2>`);

      try {
        const primaryContent = $(`<div class="ui-primaryContent"></div>`);
        let secondaryContent, input, label;

        wrapper.append(primaryContent);

        if (feature.description || feature.type !== 'toggle') {
          secondaryContent = $('<div>', { class: 'ui-secondaryContent' });
          const button = descButton();
          button.prepend(featureTitle);

          wrapper.append(secondaryContent);
          primaryContent.append(button);
          if (feature.description) secondaryContent.prepend($(`<p>${feature.description}</p>`));
        } else primaryContent.prepend(featureTitle);

        const inputWrapper = $('<div>', { class: 'ui-inputWrapper', type: feature.type });

        switch (feature.type) {
          case 'toggle':
            input = $('<input>', { class: 'ui-toggle', type: 'checkbox', id: `ui-feature-${name}`, name: name });
            label = $(`<label for="ui-feature-${name}" name="${name}">toggle ${feature.name}</label>`);

            inputWrapper.append(input);
            inputWrapper.append(label);
            primaryContent.append(inputWrapper);

            if (preference.enabled) input.attr('checked', '');

            input.on('change', async function (event) {
              const checked = event.target.checked ? true : false;
              let { preferences } = await browser.storage.local.get('preferences');

              if (checked) preferences[name].enabled = true;
              else preferences[name].enabled = false;
              browser.storage.local.set({ preferences });

              const secondaryContent = this.closest('li').querySelector('.ui-secondaryContent');
              if (secondaryContent) {
                const state = secondaryContent.getAttribute('active') === 'true' ? true : false;
                if (!state && checked || state && !checked) this.closest('.ui-primaryContent').querySelector('.ui-descButton').click();
              }
            });
            break;
          case 'multiSelect':
            Object.keys(feature.preferences).forEach(key => {
              const multiSelectWrapper = $(`<div class="ui-multiSelectWrapper"><h2>${feature.preferences[key].title}</h2></div>`);
              const input = $('<input>', { class: 'ui-multiSelect', type: 'checkbox', id: `ui-feature-${name}-${key}`, name: `${name}-${key}` });
              const label = $(`<label for="ui-feature-${name}-${key}" name="${name}-${key}">select ${feature.preferences[key].title}</label>`);

              multiSelectWrapper.append(input);
              multiSelectWrapper.append(label);
              inputWrapper.append(multiSelectWrapper);

              if (preference.preferences[key]) input.attr('checked', '');

              input.on('change', async function (event) {
                const checked = event.target.checked ? true : false;
                let { preferences } = await browser.storage.local.get('preferences');
      
                if (checked) preferences[name].preferences[key] = true;
                else preferences[name].preferences[key] = false;

                const preferenceArray = Object.keys(preferences[name].preferences).map(k => preferences[name].preferences[k]);
                const disabledArray = preferenceArray.filter(k => !k);
                if (preferenceArray.length === disabledArray.length) preferences[name].enabled = false;
                else preferences[name].enabled = true;

                browser.storage.local.set({ preferences });
              });
            });

            secondaryContent.append(inputWrapper);
            break;
          case 'select':
            Object.keys(feature.preferences).forEach(key => {
              const selectWrapper = $(`<div class="ui-multiSelectWrapper"><h2>${feature.preferences[key].title}</h2></div>`);
              const input = $('<input>', { class: 'ui-select', type: 'radio', id: `ui-feature-${name}-${key}`, name: `${name}` });
              const label = $(`<label for="ui-feature-${name}-${key}" name="${name}">select ${feature.preferences[key].title}</label>`);

              selectWrapper.append(input);
              selectWrapper.append(label);
              inputWrapper.append(selectWrapper);

              if (feature.dummy === key) input.attr('dummy', '');
              if (preference.preferences.selected === key) input.attr('checked', '');

              input.on('click', async function (event) {
                const checked = event.target.checked ? true : false;
                let { preferences } = await browser.storage.local.get('preferences');
      
                if (checked) preferences[name].preferences.selected = key;
                if (this.hasAttribute('dummy')) preferences[name].enabled = false;
                else preferences[name].enabled = true;

                browser.storage.local.set({ preferences });
              });
            });

            secondaryContent.append(inputWrapper);
            break;
          case 'slider':
            Object.keys(feature.preferences).forEach(key => {
              const sliderWrapper = $('<div>', { class: 'ui-sliderWrapper' });

              const title = $(`<h2>${feature.preferences[key].title}: <span id="ui-feature-${name}-${key}-value">${feature.preferences[key].display? `${preference.preferences[key].value}px` : ''}</span></h2>`);
              const input = $('<input>', {
                class: 'ui-slider',
                type: 'range',
                id: `ui-feature-${name}-${key}`,
                list: `ui-feature-${name}-${key}-list`,
                name: key,
                min: feature.preferences[key].min,
                max: feature.preferences[key].max,
                step: feature.preferences[key].step,
                value: preference.preferences[key].value,
                default: feature.preferences[key].default,
                'value-display': feature.preferences[key].display
              });
              const datalist = $('<datalist>', { id: `ui-feature-${name}-${key}-list` });
              for (const listOption of feature.preferences[key].datalist) {
                const option = $('<option>', { value: listOption.value, label: listOption.label });
                datalist.append(option);
              }

              sliderWrapper.append(title);
              sliderWrapper.append(input);
              sliderWrapper.append(datalist);
              inputWrapper.append(sliderWrapper);

              if (preference.enabled) input.attr('active', 'true');

              input.on('change', async function (event) {
                const value = event.target.value;
                let { preferences } = await browser.storage.local.get('preferences');

                preferences[name].preferences[key].value = value;
                if (value === event.target.getAttribute('default')) {
                  preferences[name].preferences[key].enabled = false;
                  event.target.setAttribute('active', 'false');
                }
                else {
                  preferences[name].preferences[key].enabled = true;
                  event.target.setAttribute('active', 'true');
                }

                const preferenceArray = Object.keys(preferences[name].preferences).map(k => preferences[name].preferences[k]);
                const disabledArray = preferenceArray.filter(k => k.enabled === false);
                if (preferenceArray.length === disabledArray.length) preferences[name].enabled = false;
                else preferences[name].enabled = true;

                browser.storage.local.set({ preferences });

                if (event.target.getAttribute('value-display') === 'true') $(`#ui-feature-${name}-${key}-value`).text(`${value}px`);
              });
            });
            
            secondaryContent.append(inputWrapper);
            break;
        }

        if (feature.extend) {
          const extendInputWrapper = $('<div>', { class: 'ui-inputWrapper ui-extend', type: 'multiSelect' });

          Object.keys(feature.preferences).forEach(key => {
            switch (feature.preferences[key].type) {
              case 'toggle':
                const multiSelectWrapper = $(`<div class="ui-multiSelectWrapper"><h2>${feature.preferences[key].title}</h2></div>`);
                const input = $('<input>', { class: 'ui-multiSelect', type: 'checkbox', id: `ui-feature-${name}-${key}`, name: `${name}-${key}` });
                const label = $(`<label for="ui-feature-${name}-${key}" name="${name}-${key}">select ${feature.preferences[key].title}</label>`);

                multiSelectWrapper.append(input);
                multiSelectWrapper.append(label);
                extendInputWrapper.append(multiSelectWrapper);

                if (preference.preferences[key]) input.attr('checked', '');

                input.on('change', async function (event) {
                  const checked = event.target.checked ? true : false;
                  let { preferences } = await browser.storage.local.get('preferences');

                  if (checked) preferences[name].preferences[key] = true;
                  else preferences[name].preferences[key] = false;

                  browser.storage.local.set({ preferences });
                });
                break;
              case 'multiSelect':
                const multiSelectInputWrapper = $(`<div class="ui-extendedSelectWrapper "><h3>${feature.preferences[key].title}</h3></div>`);
                extendInputWrapper.append(multiSelectInputWrapper);

                Object.keys(feature.preferences[key].options).forEach(optionsKey => {
                  const option = feature.preferences[key].options[optionsKey];
                  const multiSelectWrapper = $(`<div class="ui-multiSelectWrapper ui-extendedSelect"><h2>${option.title}</h2></div>`);
                  const input = $('<input>', { class: 'ui-multiSelect', type: 'checkbox', id: `ui-feature-${name}-${key}-${optionsKey}`, name: `${name}-${key}` });
                  const label = $(`<label for="ui-feature-${name}-${key}-${optionsKey}" name="${name}-${key}">select ${option.title}</label>`);
      
                  multiSelectWrapper.append(input);
                  multiSelectWrapper.append(label);
                  multiSelectInputWrapper.append(multiSelectWrapper);
      
                  if (preference.preferences[key][optionsKey]) input.attr('checked', '');
      
                  input.on('change', async function (event) {
                    const checked = event.target.checked ? true : false;
                    let { preferences } = await browser.storage.local.get('preferences');
          
                    if (checked) preferences[name].preferences[key][optionsKey] = true;
                    else preferences[name].preferences[key][optionsKey] = false;
      
                    browser.storage.local.set({ preferences });
                  });
                });
                break;
              case 'select':
                const selectInputWrapper = $(`<div class="ui-extendedSelectWrapper "><h3>${feature.preferences[key].title}</h3></div>`);
                extendInputWrapper.append(selectInputWrapper);

                Object.keys(feature.preferences[key].options).forEach(optionsKey => {
                  const option = feature.preferences[key].options[optionsKey];
                  const selectWrapper = $(`<div class="ui-multiSelectWrapper ui-extendedSelect"><h2>${option.title}</h2></div>`);
                  const input = $('<input>', { class: 'ui-select', type: 'radio', id: `ui-feature-${name}-${key}-${optionsKey}`, name: `${name}-${key}` });
                  const label = $(`<label for="ui-feature-${name}-${key}-${optionsKey}" name="${name}-${key}">select ${option.title}</label>`);
        
                  selectWrapper.append(input);
                  selectWrapper.append(label);
                  selectInputWrapper.append(selectWrapper);
        
                  if (feature.preferences[key]?.dummy === optionsKey) input.attr('dummy', '');
                  if (preference.preferences[key].selected === optionsKey) input.attr('checked', '');
        
                  input.on('click', async function (event) {
                    const checked = event.target.checked ? true : false;
                    let { preferences } = await browser.storage.local.get('preferences');
          
                    if (checked) preferences[name].preferences[key].selected = optionsKey;
                    if (this.hasAttribute('dummy')) preferences[name].preferences[key].enabled = false;
                    else preferences[name].preferences[key].enabled = true;
        
                    browser.storage.local.set({ preferences });
                  });
                });
                break;
              case 'textarea':
                const textInputWrapper = $(`<div class="ui-extendedSelectWrapper "><h3>${feature.preferences[key].title}</h3></div>`);
                const textInput = $('<textarea>', {
                  class: 'ui-textInput',
                  autocomplete: 'off',
                  autofill: 'off',
                  spellcheck: 'false',
                  placeholder: feature.preferences[key].placeholder,
                  id: `ui-feature-${name}-${key}`,
                  name: `${name}-${key}`
                });
                textInput.text(preference.preferences[key].value);

                textInputWrapper.append(textInput);
                extendInputWrapper.append(textInputWrapper);

                textInput.on('input', debounce(onTextInput));
                break;
              case 'colors':
                const colorsInputWrapper = $(`<div class="ui-extendedSelectWrapper "><h3>${feature.preferences[key].title}</h3></div>`);
                extendInputWrapper.append(colorsInputWrapper);

                Object.keys(feature.preferences[key].options).forEach(optionsKey => {
                  const option = feature.preferences[key].options[optionsKey];
                  const colorWrapper = $(`<div class="ui-multiSelectWrapper ui-extendedSelect"><h2>${option.title}</h2></div>`);
                  const colorInputWrapper = $(`<div>`, { style: 'position: relative;' });
                  const input = $('<input>', {
                    class: 'ui-colors',
                    type: 'text',
                    id: `ui-feature-${name}-${key}-${optionsKey}`,
                    name: `${name}-${key}-${optionsKey}`,
                    'data-coloris': '',
                    value: preference.preferences[key][optionsKey]
                  });
                  const label = $('<label>', { style: `background: ${preference.preferences[key][optionsKey]};` });
        
                  colorInputWrapper.append(input);
                  colorInputWrapper.append(label);
                  colorWrapper.append(colorInputWrapper);
                  colorsInputWrapper.append(colorWrapper);

                  input.on('change', async function () {
                    let { preferences } = await browser.storage.local.get('preferences');
                    preferences[name].preferences[key][optionsKey] = this.value;
                    browser.storage.local.set({ preferences });
                  })
                });
                break;
              case 'listSelect':
                const listSelectInputWrapper = $(`<div class="ui-extendedSelectWrapper"><h3>${feature.preferences[key].title}</h3></div>`);
                const listSelectWrapper = $(`<div class="ui-listSelectWrapper"></div>`);

                extendInputWrapper.append(listSelectInputWrapper);
                listSelectInputWrapper.append(listSelectWrapper);

                feature.preferences[key].listOptions.forEach(listItem => {
                  const normalizedString = listItem.replace(/\s/g, '');
                  const input = $('<input>', { class: 'ui-listSelect', type: 'checkbox', id: `ui-feature-${name}-${key}-${normalizedString}`, name: `${name}-${key}` });
                  const label = $(`<label for="ui-feature-${name}-${key}-${normalizedString}" name="${name}-${key}">${listItem}</label>`);
      
                  listSelectWrapper.append(input);
                  listSelectWrapper.append(label);
      
                  if (preference.preferences[key].list.includes(listItem)) input.attr('checked', '');
      
                  input.on('change', async function (event) {
                    const checked = event.target.checked ? true : false;
                    let { preferences } = await browser.storage.local.get('preferences');
          
                    if (checked) preferences[name].preferences[key].list.push(listItem);
                    else preferences[name].preferences[key].list = preferences[name].preferences[key].list.filter(item => item !== listItem);

                    if (feature.preferences[key].default.sort().join('') === preferences[name].preferences[key].list.sort().join('')) preferences[name].preferences[key].enabled = false;
                    else preferences[name].preferences[key].enabled = true;

                    browser.storage.local.set({ preferences });
                  });
                });
                break;
            }
          });

          secondaryContent.append(extendInputWrapper);
        }
      } catch (e) {
        console.error(`error creating feature item '${name}':`, e);
      }

      return wrapper;
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

    const onSearch = ({ target }) => {
      if (target.value) {
        document.getElementById('ui-searchFilter').innerText = `
          #ui-featureContainer > li:not([name*="${target.value.replace(/[^\w]/g, '')}" i]) { display: none; }
        `;
      }
      else document.getElementById('ui-searchFilter').innerText = '';
    };

    const hexToRgbString = hex =>
    hex.replace(/^#?([a-f\d])([a-f\d])([a-f\d])$/i, (m, r, g, b) => '#' + r + r + g + g + b + b)
      .substring(1).match(/.{2}/g)
      .map(x => parseInt(x, 16))
      .join(',');

    let themeStyleElement;

    const themeStyle = colors => themeStyleElement.innerText = `
      :root {
        --black: ${colors.black};
        --white: ${colors.white};
        --white-on-dark: ${colors.whiteOnDark};
        --navy: ${colors.navy};
        --red: ${colors.red};
        --orange: ${colors.orange};
        --yellow: ${colors.yellow};
        --green: ${colors.green};
        --blue: ${colors.blue};
        --purple: ${colors.purple};
        --pink: ${colors.pink};
        --accent: ${colors.accent};
        --secondary-accent: ${colors.secondaryAccent};
        --follow: ${colors.follow};
      }
    `;
    const updateThemeColors = (themeColors, preferences) => {
      if (preferences && preferences.customColors.enabled) {
        const rgbColors = preferences.customColors.preferences.colors;
        Object.keys(rgbColors).forEach(function (color) { rgbColors[color] = hexToRgbString(rgbColors[color]); });
        themeStyle(rgbColors);
      } else if (themeColors) themeStyle(themeColors);
    };
    const themeHandler = Object.freeze({
      active: true,
      start: async () => {
        if (this.active) this.stop;
        const { themeColors, preferences } = await browser.storage.local.get();
        themeStyleElement = document.createElement('style');
        themeStyleElement.id = 'ui-themeStyleElement';
        document.documentElement.append(themeStyleElement);
        updateThemeColors(themeColors, preferences);

        this.active = true;
        browser.storage.onChanged.addListener(onStorageChanged);
      },
      stop: () => {
        if (!this.active) return;
        $('#ui-themeStyleElement').remove();
        this.active = false;
        browser.storage.onChanged.removeListener(onStorageChanged);
      }
    })

    const onStorageChanged = async (changes, areaName) => {
      let { themeColors, preferences } = changes;
      if (areaName !== 'local' || (typeof themeColors === 'undefined' && typeof preferences === 'undefined') || deepEquals(preferences?.oldValue.customColors, preferences?.newValue.customColors)) return;
      if (typeof themeColors === 'undefined' && !preferences?.newValue.customColors.enabled) { // case when disabling customColors
        ({ themeColors } = await browser.storage.local.get('themeColors'));
        themeColors = { newValue: themeColors };
      }

      themeHandler.updateThemeColors(themeColors?.newValue, preferences.newValue);
    };

    const init = async () => {
      const features = await importFeatures();
      const { preferences } = await browser.storage.local.get('preferences');

      Object.keys(features).forEach(key => {
        const feature = features[key];
        const preference = preferences[key];

        if (feature && preference) {
          const featureItem = newFeatureItem(key, feature, preference, preferences);
          $(`#ui-featureContainer`).append(featureItem);
        }
      });

      setupButtons('ui-tab');
      setupButtons('ui-featureTab');

      document.getElementById('ui-export').addEventListener('click', async () => {
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
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = 'application/json';
        input.addEventListener('change', async function () {
          const [file] = this.files;

          if (file) {
            try {
              let obj = await file.text();
            preferences = JSON.parse(obj);
            if (typeof preferences === 'object') {
              browser.storage.local.set({ preferences });
              console.log('successfully imported preferences from file!');
            } else throw 'invalid data type';
            } catch (e) {
              console.error('failed to import preferences from file!', e);
              $('#ui-import').text('import failed!').css('background-color', 'rgb(var(--red))');
              setTimeout(() => {
                $('#ui-import').text('import preferences').css('background-color', 'rgb(var(--white))');
              }, 2000);
            }
          }
        });
        input.click();
        input.remove();
      });
      document.getElementById('ui-featureSearch').addEventListener('input', debounce(onSearch));

      const inheritColors = document.getElementById('ui-manage-inheritColors');
      if (preferences.inheritColors) {
        inheritColors.checked = true;
        themeHandler.start();
      }
      
      inheritColors.addEventListener('change', async function() {
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
      });
    };
    
    Coloris({
      themeMode: 'auto',
      alpha: false,
      theme: 'polaroid',
      el: '.ui-colors',
      onChange: debounce(onColorChange)
    });
    init();
  });
}