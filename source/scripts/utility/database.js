const DB_VERSION = 14; // database version
const EXPIRY_TIME = 86400000; // period after which data is considered expired
export const txOptions = { durability: 'relaxed' }; // more performant

const updateEvent = 'dbplus-database-update';

const conditionalCreateStore = (db, storeName, options) => {
  if (!db.objectStoreNames.contains(storeName)) db.createObjectStore(storeName, options);
};
const conditionalCreateIndex = (store, indexName, keyPath, options) => {
  if (!store.indexNames.contains(indexName)) {
    store.createIndex(indexName, keyPath, options);
  }
};
const conditionalDeleteIndex = (store, indexName, condition = true) => {
  if (store.indexNames.contains(indexName) && condition) store.deleteIndex(indexName);
};

export const promisifyIDBRequest = request => new Promise((resolve, reject) => {
  request.onerror = event => reject(event);
  request.onsuccess = () => resolve(request.result);
});

export const openDatabase = async () => new Promise((resolve, reject) => {
  const request = window.indexedDB.open('dbplus', DB_VERSION);

  request.onerror = event => {
    console.error(`failed to open database version ${DB_VERSION}`, event);
    reject(event);
  };

  request.onupgradeneeded = event => {
    const db = event.target.result;
    const tx = event.target.transaction;

    conditionalCreateStore(db, 'postStore', { keyPath: 'id' });
    conditionalCreateStore(db, 'blogStore', { keyPath: 'name' });
    conditionalCreateStore(db, 'searchStore', { keyPath: 'id' });

    tx.oncomplete = () => { // upgrade transaction must finish before we can open a transaction to access objectStores and open indices
      const itx = db.transaction(['postStore', 'blogStore', 'searchStore']);
      const postStore = itx.objectStore('postStore');
      conditionalCreateIndex(postStore, 'id', 'id', { unique: true });
      conditionalCreateIndex(postStore, 'date', 'date', { unique: false });
      conditionalCreateIndex(postStore, 'storedAt', 'storedAt', { unique: false });
      conditionalDeleteIndex(postStore, 'quickInfo');

      const blogStore = itx.objectStore('blogStore');
      conditionalCreateIndex(blogStore, 'name', 'name', { unique: true });
      conditionalDeleteIndex(blogStore, 'uuid', (blogStore.indexNames.contains('uuid') && blogStore.index('uuid').unique)); // need to delete old version of uuid index so we can recreate it as non-unique
      conditionalCreateIndex(blogStore, 'uuid', 'uuid', { unique: false });
      /* 
        uuids ARE unique, but blog urls can be changed.
        so if we're using the blog url as a key path and it changes, suddenly the uuid is no longer unique from IDB's point of view.
        it isn't *optimal* that uuids aren't a unique index, but they're not the primary key and it's possible we'll never even need to access them.
        although the issue there would be that it could potentially fetch the previous url's blog and not the newer one,
        but still, a niche case regardless
   
        consider this message preventation for any future headaches related to mysteriously getting the wrong blog from a uuid cursor.
      */
      conditionalCreateIndex(blogStore, 'storedAt', 'storedAt', { unique: false });

      const searchStore = itx.objectStore('searchStore');
      conditionalCreateIndex(searchStore, 'id', 'id', { unique: true });
      conditionalCreateIndex(searchStore, 'quickInfo', 'quickInfo', { unique: false });
      conditionalCreateIndex(searchStore, 'storedAt', 'storedAt', { unique: false });

      console.info(`updated database from v${event.oldVersion} to v${event.newVersion}`)
    };
  };

  request.onsuccess = () => resolve(request.result);
});

const db = await openDatabase();

export const updateNeeded = data => (Date.now() - data.storedAt) > EXPIRY_TIME;

const smartGetData = async (store, data) => {
  let val;
  const key = data[store.keyPath];
  if (!key) {
    const indices = Array.from(store.indexNames).filter(index => index in data);
    if (indices.length) {
      const targetIndex = indices.find(index => store.index(index).unique) || indices[0]; // prioritise unique indices
      val = promisifyIDBRequest(store.index(targetIndex).get(data[targetIndex]));
    } else return void 0;
  } else {
    val = promisifyIDBRequest(store.get(key));
  }
  return val;
};

const dispatchUpdate = (type, targets) => {
  const event = new CustomEvent(updateEvent, {
    detail: { type, targets }
  });
  window.dispatchEvent(event);
};

const newTransactionError = (tx, i) => new Promise((resolve, reject) => {
  tx.oncomplete = resolve;
  tx.onerror = e => {
    try {
      console.error(`database cache transaction error originating from module ${import.meta.url}: `, e, 'relevant info: ', i);
    } catch { // in the case we ever copy this module verbatim to a non-module environment and get annoyed when error logging breaks
      console.error('database cache transaction error: ', e, 'relevant info: ', i);
    }
    reject(e);
  };
});

/** caches data into stores, overwriting any existing data tied to those keys (if not an autoincremented store)
 * @param {object} data - object containing key-value pairs of object stores and data to enter into those stores
 * @returns {Promise <void>} fulfils with completion of the transaction
 */
export const cacheData = async dataObj => {
  const dataStores = Object.keys(dataObj);
  const tx = db.transaction(dataStores, 'readwrite', txOptions);
  dataStores.map(dataStore => {
    const store = tx.objectStore(dataStore);
    [dataObj[dataStore]].flat().map(data => {
      data.storedAt = Date.now();
      store.put(data);
    });
  });
  dispatchUpdate('cache', dataObj);
  return newTransactionError(tx, dataObj);
};

/** updates cached data in stores. stores data by default if it doesn't already exist
 * @param {object} data - object containing key-value pairs of object stores and data to update those stores with
 * @param {object} [options] - object containing key-value pairs of object stores and options objects to use for those stores;
 * @param {string} [options.STORE_NAME.index] - the index to use when updating data
 * @param {boolean} [options.STORE_NAME.updateStrict] - if true, data is only updated if the key is already present in the store
 * @returns {Promise <void>} fulfils with completion of the transaction
 */
export const updateData = (dataObj, options = null) => {
  const dataStores = Object.keys(dataObj);
  const tx = db.transaction(dataStores, 'readwrite', txOptions);
  dataStores.map(dataStore => {
    let storeOptions;
    options && (storeOptions = options[dataStore]);
    const store = tx.objectStore(dataStore);
    [dataObj[dataStore]].flat().map(async data => {
      if (typeof data === 'undefined') return;

      let updateData;
      const existingData = await smartGetData(store, data);
      if (storeOptions?.updateStrict && typeof existingData === 'undefined') return;
      else if (typeof existingData === 'object') updateData = Object.assign(structuredClone(existingData), data);
      else updateData = data;
      updateData.storedAt = Date.now();
      store.put(updateData);
    });
  });

  dispatchUpdate('update', dataObj);
  return newTransactionError(tx, dataObj);
};

/**
 * @param {object} data - object containing key-value pairs of object stores and keys to retrieve from those stores
 * @param {object} [options] - object containing key-value pairs of object stores and options objects to use for those stores;
 * @param {string} [options.STORE_NAME.index] - the index to use when retrieving data
 * @returns {Promise <object>}
 */
export const getData = async (dataObj, options = null) => {
  const dataStores = Object.keys(dataObj);
  const tx = db.transaction(dataStores, 'readonly');
  const returnObj = {};

  await Promise.all(dataStores.map(async dataStore => {
    let storeOptions, index;
    options && (storeOptions = options[dataStore]);
    const store = tx.objectStore(dataStore);
    storeOptions?.index && (index = store.index(storeOptions.index));
    const storeData = await Promise.all([dataObj[dataStore]].flat().map(async key => {
      if (!key) {
        console.warn('getData: key is undefined');
        return void 0;
      }
      if (index) return promisifyIDBRequest(index.get(key));
      else return promisifyIDBRequest(store.get(key));
    }));
    returnObj[dataStore] = storeData.map(data => typeof data === 'object' ? structuredClone(Object.assign(data, { expired: updateNeeded(data) })) : structuredClone(data));
  }));

  //await tx.done;
  return returnObj;
};

/**
 * opens an IDBCursor on an object store and returns its contents as an array
 * @param {string} storeName - object store to open a cursor on
 * @param {string|IDBKeyRange} [query] - an index or IDBKeyRange to be queried
 * @returns {Promise <object[]>}
 */
export const getCursor = async (storeName, query = null) => {
  const tx = db.transaction(storeName, 'readwrite');
  const returnData = [];
  let cursor = await promisifyIDBRequest(tx.store.openCursor(query));
  while (cursor) {
    returnData.push(typeof cursor.value === 'object' ? Object.assign(structuredClone(cursor.value), { expired: updateNeeded(cursor.value) }) : structuredClone(cursor.value));
    cursor = await cursor.continue();
  }

  return returnData;
};

/** deletes data from stores
 * @param {object} data - object containing key-value pairs of object stores and keys to delete from those stores
 * @param {object} [options] - object containing key-value pairs of object stores and options objects to use for those stores;
 * @param {string} [options.STORE_NAME.index] - the index to use when deleting data
 * @returns {Promise <void>} fulfils with completion of the transaction
 */
export const clearData = (dataObj, options = null) => {
  const dataStores = Object.keys(dataObj);
  const tx = db.transaction(dataStores, 'readwrite', txOptions);

  Promise.all(dataStores.map(async dataStore => {
    let storeOptions, index;
    options && (storeOptions = options[dataStore]);
    const store = tx.objectStore(dataStore);
    storeOptions && ('index' in storeOptions) && (index = store.index(storeOptions.index));
    return [dataObj[dataStore]].flat().map(async key => {
      if (!key) {
        console.warn('clearData: key is undefined');
        return;
      }
      if (index) return promisifyIDBRequest(index.openCursor(key)).then(cursor => promisifyIDBRequest(cursor.delete()));
      else return promisifyIDBRequest(store.delete(key));
    });
  })).then(() => dispatchUpdate('clear', dataObj));

  return newTransactionError(tx, dataObj);
};

const resourceQueue = new WeakMap();

/**
 * @param {string} store - single object store to access 
 * @param {Number|string|Array} keys - keys to retrieve from that store
 * @param {object} [options] - options to  use when retrieving keys
 * @param {string} [options.index] - the index to use when retrieving data
 * @returns {Promise <object>}
 */
export const getIndexedResources = async (store, keys, options = null) => {
  const isArray = Array.isArray(keys); // need to save the initial key state before arrayifying it
  keys = [keys].flat();
  const mapKey = [store, keys, options];

  if (!resourceQueue.has(mapKey)) {
    const indexedResources = await getData(Object.fromEntries([[store, keys]]), Object.fromEntries([[store, options]]));
    if (!indexedResources[store]) console.log(store, Object.entries(indexedResources), indexedResources[store]);
    const data = isArray ? indexedResources[store] : indexedResources[store][0];

    resourceQueue.set(mapKey, data);
  }

  return resourceQueue.get(mapKey);
};

/**
 * @param {Number|Number[]} keys - single id or array of ids to fetch from the database
 * @returns {object|object[]} post(s) - type of return matches type of input
 */
export const getIndexedPosts = keys => getIndexedResources('postStore', keys);

/**
 * @param {Number|Number[]} keys - single key (handle or projectId) or array of indices to fetch from the database
 * @returns {Promise <object|object[]>} project(s) - type of return matches type of input
 */
export const getIndexedBlogs = keys => getIndexedResources('blogStore', keys);