/**
 * Change Log
 * Add Core Method strToESM
 */

export const strToESM = str => import(`data:text/javascript,${str}`);

export const nodeFetch = url =>
    import('https')
        .then(({ default: http }) =>
            new Promise((resolve, rej) => {
                http.get(url, res => {
                    const { statusCode, headers } = res;
                    if (statusCode === 200) {
                        let rawData = [];
                        //res.setEncoding('utf8');
                        res.on('data', d => rawData.push(d));
                        res.on('end', () => resolve([rawData.join(''), url]));
                        res.on('error', rej)
                    } else {
                        const { statusCode, headers } = res
                        rej({ url, statusCode, headers })
                    }
                });
            })
    );

export const fetch = typeof window !== 'undefined' ? window.fetch : nodeFetch;
export const fetchImport = url => fetch(url).then(strToESM);
export const dynamicImport = url => typeof window === 'undefined' ? fetchImport(url) : import(url);
// Exports a Module that exports a str object
// Usage importStrToExport('https://mytemplate.com/index.html').then(({ str })=>console.log(str))
export const importStrToExport = url => fetch(url).then(str=>strToESM(`export const str = \`${str}\``))