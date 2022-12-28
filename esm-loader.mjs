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


// https://github.com/markedjs/marked/blob/master/lib/marked.esm.js
// https://unpkg.com/marked@4.2.5/lib/marked.esm.js
const { createObjectURL } = window.document;
// trys something and do the next thing. or handle the .error returns { next, error }
const TryNext = (errorHandler = (err) => err) => { // ()=>{} error removes the error property from Next
    const Next = { next: (fn=()=>{}) => { try { Object.assign(Next,{ value: fn() }) } catch (e) { Object.assign(Next, { error: errorHandler(e) }) }; return Next; } };
    return Next;
};

// const fifoAdd = PromiseFIFO(); //fifoAdd(()=>'');
// Concepts designed to break on first error in chain in general you can use Promise.all
// Serializes Async Instructions optional it can handle failures from the prev instruction or its value
const PromiseFIFO = () => { 
    let QUEUE = Promise.resolve();
    // (_err) => Promise.reject(_err) // toBreak the Chain on error or recover default recover
    return (fn, continueWith) => QUEUE = QUEUE.then(fn, continueWith || fn);
};

// AsyncChain().next(()=>'hi').next(()=>'hi').next((prevValue)=>prevValue).next(()=>'hi').promise.then(promiseResult, (err)=>console.error(err));
const AsyncChain = (fifoAdd=PromiseFIFO()) => {
    const Next = { next: (fn=()=>{}) => Object.assign(Next, { promise: fifoAdd(fn) }) };
    return Next;
};

// This api is relativ useless but who knows i would preferfer raw funktions.
const SyncNext = () => {
    const Next = { next: (fn=()=>{}) => Object.assign(Next,{ value: fn() }) };
    return Next;
};

const SyncNext2 = () => {
    const pipeThrough = { pipeThrough: (fn=()=>{}) => Object.assign(pipeThrough,{ value: fn() }) };
    return pipeThrough;
};

// const syncChain = (SyncNext || TryNext)().next().next();

// Supports: (Promise.resolve('').then(fetch), fetch(), response, "")
const getBlobPromiseFromResponse = (r) => Promise.resolve(r).then(async (stringOrResponsePromise) => (typeof stringOrResponsePromise === 'string' 
 ? await fetch(stringOrResponsePromise) : await stringOrResponsePromise).blob() );

const getStreamFromResponse = (r) => Promise.resolve(r).then(async (stringOrResponsePromise) => (typeof stringOrResponsePromise === 'string' 
 ? await fetch(stringOrResponsePromise) : await stringOrResponsePromise).body );

const readBlobPromiseAsDataUrl = (dataOrBlob) =>
  new Promise(async (resolve)=> {
    const reader = new FileReader();
    Object.assign(reader, { onload() { resolve(reader.result) } })
     .readAsDataURL(await dataOrBlob) });

const getResponseAsDataUrl = async (urlOrResponsePromise, type) =>
  readBlobPromiseAsDataUrl(setBlobType(await getBlobPromiseFromResponse(urlOrResponsePromise), type));

const reduceStreams = (readableStreams = [ /* conjoined response tree */ ], TransformStream) => 
  readableStreams.reduce((resultPromise, readableStream, i, arr) => resultPromise.then(() => 
    readableStream.pipeTo(TransformStream.writable, { preventClose: (i+1) !== arr.length })
  ), Promise.resolve());

const getReadableStreamFromPromise = (fn) => ({ async start(controller) { 
    controller.enqueue(typeof await fn === 'function' ? await fn() : await fn) 
}});

class FetchBlobStream extends ReadableStream { constructor(url) { 
    super(getReadableStreamFromPromise(fetch(url).then(getBlobPromiseFromResponse))); 
}};

const setBlobType = (dataOrBlob, type) => dataOrBlob instanceof Blob && dataOrBlob.type === type 
  ? dataOrBlob : new Blob([dataOrBlob], { type });

const setBlobPromiseType = async (blobPromise, type) => setBlobType(await blobPromise, type);

const getBlobFromResponseWithType = (url, type) => setBlobPromiseType(getBlobPromiseFromResponse(url), type);

const getStreamMethod = (fn, ...params) => async (dataOrBlob, controller) => { controller.enqueue( await fn(await dataOrBlob, ...params) ); };
const getTransformStreamImplementation = (fn, ...params) => ({ start(){}, transform: getStreamMethod(fn, ...params) });

class setBlobTypeTransformStream extends TransformStream { constructor(type='application/octet-stream') { 
    super(getTransformStreamImplementation(setBlobType, type)); 
} };

class TransformBlobPromiseToDataUrl extends TransformStream { constructor() { super({ start(){},
  async transform(blob,_controller) { controller.enqueue(document.createObjectURL(await blob));
} }) }};

class BackpressureTransformStream extends TransformStream { constructor() { const backpressure = []; super({ start(){},
  transform(data,_controller){ backpressure.push(data); },
  close(controller){ controller.enqueue(backpressure.flaten()); backpressure.length = 0; },
  cancel(){ backpressure.length = 0; },
}); }};

const getDataUrlFromBlobPromise = async (dataOrBlob,type) =>
  readBlobPromiseAsDataUrl(setBlobType(await dataOrBlob, type));
  
class FileReaderAsDataUrlStream extends BackpressureTransformStream { constructor(type = 'application/octet-stream') {
    super(getTransformStreamImplementation(getDataUrlFromBlobPromise, type)); 
}};

const getBase64FromDataUrl = (dataUrl) => dataUrl.split(",", 2)[1];
const getTypeFromDataUrl = (dataUrl) => dataUrl.split(";", 2)[0].slice(5);
const getDataUrlFromBase64 = (base64, type = 'application/octet-stream') => `data:${type};base64,${base64}`;
const isDataUrlType = (dataUrl,type) => dataUrl.split(";", 2)[0].indexOf(type) > -1;
const setDataUrlType = (dataUrl,type) => `data:${type};base64,${getBase64FromDataUrl(dataUrl)}`;
const getDataUrlBase64Index = (dataUrl) => dataUrl.indexOf(',') + 1;

//const b64toBlob = (base64, type) => getBlobFromResponseWithType(getDataUrlFromBase64(base64, type), type);

const streamTransformToDataUrl = (stream, type = 'application/octet-stream') => stream.pipeThrough(new BackpressureTransformStream())
  .pipeThrough(new FileReaderAsDataUrlStream(type));

// Importable 
// getReadableStreamFromPromise(getDataUrlFromBlobPromise(fetch('https://unpkg.com/marked@4.2.5/lib/marked.esm.js').then(getBlobPromiseFromResponse),'text/javascript'));
// getReadableStreamFromPromise(setBlobPromiseType(fetch('https://unpkg.com/marked@4.2.5/lib/marked.esm.js').then(getBlobPromiseFromResponse),'text/javascript').then(createObjectURL));
// getBlobFromResponseWithType('https://unpkg.com/marked@4.2.5/lib/marked.esm.js','text/javascript').then(createObjectURL);
// getDataUrlFromBlobPromise(getBlobFromResponseWithType('https://unpkg.com/marked@4.2.5/lib/marked.esm.js'))
//https://developer.mozilla.org/en-US/docs/Web/API/CryptoKey
// algo https://developer.mozilla.org/en-US/docs/Web/API/SubtleCrypto/verify#parameters
// e RSASSA-PKCS1-v1_5,  RSA-PSS, ECDSA,  HMAC, same as sign()
verify(algorithm, cryptoKeyType, signatureArrayBuffer, dataArrayBuffer)
async function fileHash(arrayBuffer) {
    
    const uint8ViewOfHash = new Uint8Array(await crypto.subtle.digest('SHA-256', arrayBuffer));
    // We then convert it to a regular array so we can convert each item to hexadecimal strings
    // Where to characters of 0-9 or a-f represent a number between 0 and 16, 
    // containing 4 bits of information, so 2 of them is 8 bits (1 byte).   
    const hashAsString = Array.from(uint8ViewOfHash).map((b) => b.toString(16).padStart(2, '0')).join('');
    return hashAsString;
}
//fileHash(await file.arrayBuffer())

const fnPipeThrough = () => ({ pipeThrough() {}});

// Creates Compressed Stream Type base64string
// fetch('https://unpkg.com/marked@4.2.5/lib/marked.esm.js')
//   .then((Response)=>Response.body
//     .pipeThrough(new CompressionStream("gzip"))
//     .pipeThrough(new BackpressureTransformStream())
//     .pipeThrough(new FileReaderAsDataUrlStream('application/octet-stream'))

//     .getReader().read(({ value }) => console.log()));
     
// // Creates Deompressed Stream from Type base64string representing compressed js returns import able URLObject
// // Caches then the URLObject under its new name in the cache. 
// fetch(dataUrl)
//     .then((Response)=>Response.body
//     .pipeThrough(new DecompressionStream('gzip'))
//     .pipeThrough(new BackpressureTransformStream())
//     .pipeThrough(new TransformBlobPromiseToDataUrl('text/javascript')))

// // Directly load 3th party
// fetch('https://unpkg.com/marked@4.2.5/lib/marked.esm.js').then((Response)=>Response.body.blob().then((blob)=>document.createObjectURL(new Blob(blob, { type: 'text/javascript' }) )));
// fetch('https://unpkg.com/marked@4.2.5/lib/marked.esm.js')
//   .then((Response)=>Response.body
//   .pipeThrough(new BackpressureTransformStream())
//   .pipeThrough(new FileReaderAsDataUrlStream('text/javascript')))

// new ReadableStream({ start(c) { 
//     c.enqueue(c.idx = c.idx || 0); 
//     c.enqueue(c.idx = c.idx || 0);
// }, close})

// fetch('https://unpkg.com/marked@4.2.5/lib/marked.esm.js')
//   .then((Response)=>Response.body.pipeThrough(new CompressionStream("gzip").pipeThrough(new DecompressionStream('gzip')))).then(x=>console.log({x}))

// fetch('https://unpkg.com/marked@4.2.5/lib/marked.esm.js')
//     .then((Response) => Response.body
//     .pipeThrough(new CompressionStream("gzip"))
//     .pipeThrough(new DecompressionStream('gzip'))
//     .pipeThrough(new TextDecoderStream())
//     )

// (await fetch('https://unpkg.com/marked@4.2.5/lib/marked.esm.js')
//     .then((Response) => Response.body
//     .pipeThrough(new CompressionStream("gzip"))
//     .pipeThrough(new DecompressionStream('gzip'))
//     .pipeThrough(new TextDecoderStream())
//     )).pipeTo(new WritableStream({ write(c) { console.log(c)}}))

//     const fetchAsDataUrl = (url) => new ReadableStream({ start(controller) { 
//         const reader = new FileReader();
//         Object.assign(reader, { onload() { controller.enqueue(reader.result) } })
//           .readAsDataURL(response.body.blob());
//     }});

//     reader.read().then(({ done, value }) => { /* … */ });

//     await fetch('https://unpkg.com/marked@4.2.5/lib/marked.esm.js')
//       .then((r) => r.blob()) // new Blob([data])
//       .then((blob) => new ReadableStream({ start(controller) {
//         const reader = new FileReader() 
//         Object.assign(reader, { onload() { controller.enqueue(reader.result) } })
//           .readAsDataURL(blob) }})
//       ).then(x=>x.pipeTo(new WritableStream({ write(c) { console.log(c)}})))

//       (await fetch('https://unpkg.com/marked@4.2.5/lib/marked.esm.js')
//       .then((Response) => Response.body
//       .pipeThrough(new CompressionStream("gzip"))
//       .pipeThrough(new DecompressionStream('gzip'))
//       .pipeThrough(new TextDecoderStream())
//       )).pipeTo(new WritableStream({ write(c) { console.log(c)} }));


// 1x Fetch => 100x Fetch => 100x document.body append or register element.


