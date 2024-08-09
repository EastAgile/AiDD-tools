const IDBKeyval = (function () {
    function promisifyRequest(request) {
        return new Promise((resolve, reject) => {
            request.oncomplete = request.onsuccess = () => resolve(request.result);
            request.onabort = request.onerror = () => reject(request.error);
        });
    }

    function createStore(dbName, storeName) {
        const request = indexedDB.open(dbName);
        request.onupgradeneeded = () => request.result.createObjectStore(storeName);
        const dbp = promisifyRequest(request);
        return (txMode, callback) => dbp.then((db) => callback(db.transaction(storeName, txMode).objectStore(storeName)));
    }

    const defaultGetStoreFunc = createStore('keyval-store', 'keyval');

    function get(key, customStore = defaultGetStoreFunc) {
        return customStore('readonly', (store) => promisifyRequest(store.get(key)));
    }

    function set(key, value, customStore = defaultGetStoreFunc) {
        return customStore('readwrite', (store) => {
            store.put(value, key);
            return promisifyRequest(store.transaction);
        });
    }

    return {
        get,
        set
    };
})();
