'use strict';

{
  const getJsonFile = async name => {
    try {
      const url = browser.runtime.getURL(`/scripts/${name}.json`);
      const file = await fetch(url);
      const json = await file.json();

      return json;
    } catch (e) {
      console.error(name, e);
      return null;
    }
  };

  const importFeatures = async () => {
    const installedFeatures = await getJsonFile('!features');
    const features = {};

    installedFeatures.forEach(async name => {
      const featureData = await getJsonFile(name);
      if (featureData) features[name] = featureData;
    });

    return features;
  };

  const descButton = () => {
    const button = $(`<button class='ui-descButton'>+</button>`);
    button.on('click', function () {
      const secondaryContent = this.closest('li').querySelector('.ui-secondaryContent');
      if (secondaryContent.getAttribute('active') === 'true') {
        secondaryContent.setAttribute('active', 'false');
        this.innerText = '+';
      } else {
        secondaryContent.setAttribute('active', 'true');
        this.innerText = '-';
      }
    });
    return button;
  }

  const newFeatureItem = (name, feature = {}, preference = {}, allPreferences) => {
    const wrapper = $('<li>');
    const primaryContent = $(`<div class="ui-primaryContent"><h2>${feature.name}</h2></div>`);
    let secondaryContent, input, label;

    wrapper.append(primaryContent);

    if (feature.description || feature.type !== 'toggle') {
      secondaryContent = $('<div>', { class: 'ui-secondaryContent' });

      wrapper.append(secondaryContent);
      primaryContent.append(descButton());
      if (feature.description) {
        secondaryContent.append($(`<p>${feature.description}</p>`));
      }
    }

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

        secondaryContent.prepend(inputWrapper);
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

        secondaryContent.prepend(inputWrapper);
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
        
        secondaryContent.prepend(inputWrapper);
        break;
    }

    if (feature.extend) {
      const extendInputWrapper = $('<div>', { class: 'ui-inputWrapper', type: 'multiSelect' });

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
        }
      });

      secondaryContent.prepend(extendInputWrapper);
    }

    return wrapper;
  };

  const buildMenu = async () => {
    const features = await importFeatures();
    const { preferences } = await browser.storage.local.get('preferences');

    Object.keys(features).forEach(key => {
      const feature = features[key];
      const preference = preferences[key];

      if (feature && preference) {
        const featureItem = newFeatureItem(key, feature, preference, preferences);
        $(`#ui-${feature.category} ul`).append(featureItem);
      }
    });
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

  const init = async () => {
    setupButtons('ui-tab');
    setupButtons('ui-featureTab');
  };
  
  buildMenu().then(init);
}