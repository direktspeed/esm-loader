## Usage


String to ESM Example Cross Environment
```js
import { strToESM } from 'esm-loader/loader.mjs'

const module = strToESM('export const myModule = { yellow: \'snowflakes\'}')
    .then(({ myModule })=>console.log(myModule.yellow)) // Logs: snowflakes
``` 

Inside NodeJS with modules support
==========

```js
// The exported fetch is cross environment Nodejs and Browser
import { strToESM, fetch ,fetchImport, dynamicImport } from 'esm-loader/loader.mjs'

// Creates a dynamic import from a string
// Returns a ESM Module with exports from string has resovle for Bare and Absolut Specifiers
// can easy be rewritten for your own extensions
fetchImport('url') //is a shortHand helper for fetch('https://url.to/your/js.mjs').then(strToESM)
    .then(mod=>console.log(mod))

dynamicImport('url') // uses import in the browser and fetchImport in nodejs
```

inside browser for custom elements or scripts 
========

```js
import { strToESM, dynamicImport } from 'esm-loader/loader.mjs'

// Creates a dynamic import from a string

// can easy be rewritten for your own extensions
fetch('https://url.to/your/js.mjs')
    .then(strToESM)
    /**
     *  Returns a ESM Module with exports from string 
     *  has resolve for Bare and Absolut Specifiers
     *  Your Can Easy rewrite the String that you get from 
     *  fetch befor you use it as input to strToESM.
     */
    .then(mod=>console.log(mod))

dynamicImport('url') // uses import in the browser and fetchImport in nodejs
```

# rollup support landed
https://github.com/rollup/plugins/pull/150

# Advanced Stuff
Lets Import a mjs file from a source and rewrite it to resolve to the right locations
if relativ specifiers are used 
```js
// TODO:
``` 

