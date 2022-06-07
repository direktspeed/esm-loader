/**
 * Change Log
 * - Add Core Method ESMLoader
 * - newer fetch
 * - reference the rollup require loader i do not remember the repo :)
 * - but it is importent to know that this is like a demo for importFromString and later requireFromString. 
 */

export const moduleString = str => `data:text/javascript,${str}`;
export const SourceTextModule = str => import(moduleString(str));
export const importFromString = SourceTextModule;
export const ESMLoader = SourceTextModule;

export const strToESM = str => {
    console.log('deprecated: strToESM() use ESMLoader()')
    return SourceTextModule(str)
};
export const escapeHtml = s => (s + '').replace(/[&<>"']/g, m => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;',
    '"': '&quot;', "'": '&#39;'
})[m]);
export const nodeFetch = url =>
    import('https')
        .then(({ default: http }) =>
            new Promise((resolve, rej) => {
                http.get(url, res => {
                    const { statusCode, headers } = res;
                    if (statusCode === 200) {
                        let rawData = '';
                        //res.setEncoding('utf8');
                        res.on('data', d => rawData += d);
                        res.on('end', () => resolve(rawData));
                        res.on('error', rej)
                    } else {
                        rej({ url, statusCode, headers })
                    }
                });
            })
    );

// Node 18 got fetch but i leave the old behavior with https for demos
export const fetch = globalThis.fetch || nodeFetch;
export const fetchImport = url => fetch(url).then(SourceTextModule);
export const dynamicImport = url => {
    console.log('deprecated: please use importScript() or ESMImport() and not dynamicImport')
    typeof window === 'undefined' ? fetchImport(url) : import(url);
}

export const ESMImport = url => fetchImport(url);
export { ESMImport as importScript}

// Exports a Module that exports a str object
// Usage importStrToExport('https://mytemplate.com/index.html').then(({ str })=>console.log(str))
// Example that shows how to assign a result to a var for advanced scenarios. like in tag-html or
// tagged-template-strings packages.
// Most Advanced usecase is shim const mixinLifecycleMethods = require("./mixin-lifecycle-methods");
export const importStrToExport = url => fetch(url).then(str => SourceTextModule(`export const str = \`${str}\``))
// Most Advanced usecase is shim const mixinLifecycleMethods = require("./mixin-lifecycle-methods");
//export const inlineRequire = parseRequire statments into obj then return Obj with results of results
//Global symbol registry
//ES6 has a global resource for creating symbols: the symbol registry. The symbol registry provides us with a one-to-one relationship between strings and symbols. The registry returns symbols using Symbol.for( key ).
//Symbol.for( key1 ) === Symbol.for( key2 ) whenever key1 === key2. This correspondance works even across service workers and iframes.
