const funcs = require('./funcs')
const fs = require('fs-extra')


const splitWords = async () => {
    const words = await funcs.getAllWords();
    let chunk = [];
    let chunkNum = 0;
    for(const word of words) {
        chunk.push(word)
        if(chunk.length === 1e3) {
            await fs.writeFile(`./data/chunk-${chunkNum++}.json`, JSON.stringify(chunk, null, ' '))
            chunk = [];
        }
    }

    await fs.writeFile(`./data/chunk-${chunkNum}.json`, JSON.stringify(chunk, null, ' '))
}

splitWords();