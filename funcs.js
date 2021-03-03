const fs = require('fs-extra')
const glob = require("glob");
const axios = require('axios');

const chunkNum = 0;

const queryParams = {
    "q": "QUERY",
    "page": 1,
    "lang": "es",
    "orientation": "horizontal",
    "per_page": 10,
    "key": "20509761-69eba55d7f7743bd91cf9ae54"
};

const dir = './words-images'

const download = async (fileUrl, outputLocationPath) => {
    const writer = fs.createWriteStream(outputLocationPath);
    return axios({
        method: 'get',
        url: fileUrl,
        responseType: 'stream',
    }).then(async response => {
        response.data.pipe(writer);
        return writer;
    });
};


const getImages = async (term, page, language) => {
    const query = new URLSearchParams({...queryParams, "q": term, page, language})
    const url = `https://pixabay.com/api/?${query.toString()}`

    const response = await axios({
        method: 'get',
        url: url,
    }).catch(error => {
        console.log(error)
    });


    if (response.data && response.data.hits && response.data.hits.length > 0) {
        return response.data.hits.map(item => item.webformatURL)
    } else {
        return [];
    }
}

const setImage = async ({term, url, part}) => {
    const ext = url.replace(/.*\.(\w+)$/, '$1')
    await download(url, `${dir}/${term}[${part}].${ext}`)
}

const getAllWords = () => {
    return fs.readJson(`./data/chunk-${chunkNum}.json`);
}

const isLoaded = (term, part) => {
    return glob.sync(`${dir}/*.*`)
        .map(filename => filename.replace(/.*\/(.*)\.\w+/, "$1"))
        .some(filename => filename === `${term}[${part}]`);
}

const skipWord = async (term, part) => {
    const words = await getAllWords();
    const index = words.findIndex(word => word.word === term && word.part === part)
    words[index].skip = true;
    fs.writeFile(`./data/chunk-${chunkNum}.json`, JSON.stringify(words, null, ' '))
}

module.exports = {
    download,
    getImages,
    getAllWords,
    isLoaded,
    setImage,
    skipWord
}