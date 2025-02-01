'use strict';
{
  const deserialiseFunction = funcString => eval(`(${funcString})`);

  // == MODULES ==
  let module_hooks = {
    featureTweaker: {
      match: "tumblr-client-begin",
      transformation: (x) => x.replace(/"production"===(\w+\.\w+\.)(Development|Production)/g, (_, y, z) => `"development"===${y + z}`)
    },
    /* devMode: {
      match: 'return e.Development="development",e.Production="production",e',
      transformation: (x) => {
        let module = x.replaceAll('return e.Development="development",e.Production="production",e', 'return e.Development = "production", e.Production = "development", e');
        return module;
      }
    } */
  };

  // == LOADER ==
  window.__runtime_hook__ = function __runtime_hook__(runtime) {
    return function hooked_runtime(require) {
      console.info('Tumblr is hydrating!', runtime.toString());
      return runtime(require);
    }
  };

  window.__module_hook__ = function __module_hook__(moduleId) {
    if (!window.__webpack_modules__[moduleId]) return;

    let module_str = window.__webpack_modules__[moduleId].toString(); // Turn this func into a string!

    if (module_str.includes('"production"===')) console.log(moduleId, module_str);

    // Do we have any requests for this module? If not, move on.
    if (!Object.values(module_hooks).some(x => module_str.match(x.match))) return;

    for (const hook in module_hooks) {
      if (!module_str.match(module_hooks[hook].match)) continue; // Check that it's wanted here.

      console.info(hook, moduleId) // Log that it matched.
      module_str = module_hooks[hook].transformation(module_str); // Transform the module.
    }

    window.__webpack_modules__[moduleId] = deserialiseFunction(module_str); // Turn that string back into a func!
  }

  // Black magic beyond here
  async function load(src) {
    // Pull the sourcemap.
    const loader_map = (await fetch(src + '.map').then(x => x.json()));
    let loader = loader_map.sourcesContent.join('\n'); // Mush it together.

    // Transformations to apply to the sourcemap. Should happen in order.
    const transformations = [
      (source) => source.substr(source.indexOf('\n') + 1, source.length),
      (source) => source.substr(source.indexOf('\n') + 1, source.length),
      (source) => source.replace(/\/\*\*\*\*\*\*\/ }\)\(\)/, 'window.__webpack_require__ = __webpack_require__; window.__webpack_modules__ = __webpack_modules__; window.__webpack_module_cache__ = __webpack_module_cache__;'),
      (source) => source.replace('// Execute the module function', '__module_hook__(moduleId)'),
      (source) => source.replace(/if\(runtime\) (.*)/, 'if(runtime) { runtime = __runtime_hook__(runtime); $1 }'),
      (source) => source.replace('if (typeof document === "undefined") return;', ''),
      (source) => 'var __webpack_modules__ = [];\nvar __webpack_module_cache__ = [];\n' + source
    ];

    for (let transform of transformations) {
      loader = transform(loader);
    }

    // Your tum has been blred. Have a wonderful day.
    window.__webpack_loader__ = loader;
    window.eval(loader);
  }

  // CONTROL

  const controlInfoScript = document.getElementById('dbplus-moduleHookControl');
  const controlInfo = JSON.parse(controlInfoScript.textContent);
  console.info(controlInfo);

  const importedModuleHooks = Object.fromEntries(Object.entries(controlInfo.module_hooks).map(([key, val]) => {
    if (val.regexMatch) val.match = new RegExp(val.match, 'i');
    val.transformation = deserialiseFunction(val.transformation);
    return [key, val];
  }));
  console.info(importedModuleHooks);

  Object.assign(module_hooks, importedModuleHooks);

  const runtimeObserver = new MutationObserver(() => {
    if (document.querySelector('script[src^="https://assets.tumblr.com/pop/js/modern/runtime"]')) {
      runtimeObserver.disconnect();
      console.info("Found runtime! (finally!)");
      load(document.querySelector('script[src^="https://assets.tumblr.com/pop/js/modern/runtime"]').src);
    }
  });

  if (document.querySelector('script[src^="https://assets.tumblr.com/pop/js/modern/runtime"]')) {
    console.info("Runtime found on initial load");
    load(document.querySelector('script[src^="https://assets.tumblr.com/pop/js/modern/runtime"]').src);
  } else {
    console.warn("Didn't find runtime on initial load, waiting patiently...");
    runtimeObserver.observe(document.documentElement, { childList: true, subtree: true });
  }
}