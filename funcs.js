const fs = require('fs-extra')
const glob = require("glob");
const axios = require('axios');
const sstk = require("shutterstock-api");


sstk.setAccessToken('v2/eVVrM2ptZXowOFBBd2JFbE02V3d1TXp3bnRVZTVDRmsvMjk0MzEzMDg3L2N1c3RvbWVyLzMva0dmTUpaTXBvUjdzZ3l1WFExdkI5RDhWNzFjeE1pMG5yM1pqS3p6ZFdWSHAyd2FadG9tUEprMTF1bmJUc2N3LXlMOENRcnp0M1Y4SVo2emk3QzFDcVNtYWI1N3FjU2JVTWdPc2dYckg5SjFOMXRKRk5lWG1XU3ZTS3VZVk1aZUJZR0RHS0tRcjI4cExoc1czVGpKMDc1R0t4a2lva1pvS1JtNnh1clhVWXZEYlJpMVpLT2duNTl5MURNb20tbWJwc0VjTjEyV3ZNU2ltWWktcElhWXNJQQ');
const imagesApi = new sstk.ImagesApi();
const chunkNum = process.env.CHUNK_NUM;


const googleKeyPairs = [
    {key: 'AIzaSyB7-hlob9p0ak1TK3VhHq-K36L9kfa_Uws', cx: '97db1c92acc9da786'},
    {key: 'AIzaSyDme1vYIZgbCOgvVtZunIaixptrseKY6KE', cx: '39f4e4b553cd22a08'}
]

class GoogleApiTooManyRequestsException {
    status = 429
}

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


const _getPixabayImages = async (term, page, language) => {
    const queryParams = {
        "q": "QUERY",
        "page": "1",
        "lang": "es",
        "orientation": "horizontal",
        "per_page": "10",
        "key": "20509761-69eba55d7f7743bd91cf9ae54"
    };
    const query = new URLSearchParams({...queryParams, "q": term, page, language})
    const url = `https://pixabay.com/api/?${query.toString()}`

    const response = await axios({
        method: 'get',
        url: url,
    })

    if (response && response.data && response.data.hits && response.data.hits.length > 0) {
        return response.data.hits.map(item => item.webformatURL)
    } else {
        return [];
    }
}

const _getShutterstockImages = async (term, page, language) => {
    const queryParams = {
        "query": "QUERY",
        "page": 1,
        "language": "es",
        "aspect_ratio_max": 1.7,
        "aspect_ratio_min": 1.3,
        "per_page": 10,
        "sort": "random",
        "view": "minimal"
    };

    const query = {...queryParams, "query": term, page, language}
    const response = await imagesApi.searchImages(query);
    if (response && response.data && response.data.length > 0) {
        return response.data.map(item => item.assets.huge_thumb.url)
    } else {
        return [];
    }
}

const _getGoogleImages = async (term, page, language) => {
    const keyPair = googleKeyPairs[Math.round(Math.random() * 100) % googleKeyPairs.length];
    const queryParams = {
        ...keyPair,
        searchType: 'image',
        fileType: 'jpg',
        num: '10',
        start: String(1 + 10 * (page - 1))
    }
    const query = new URLSearchParams({...queryParams, "q": term, page, lr: `lang_${language}`})
    const url = `https://www.googleapis.com/customsearch/v1?${query.toString()}`

    const response = await axios({
        method: 'get',
        url: url,
    }).catch((err) => {
        if(err.response.status === 429) {
            throw new GoogleApiTooManyRequestsException();
        } else {
            throw err
        }
    })

    if (response && response.data && response.data.items) {
        return response.data.items.map(item => item.link)
    } else {
        return [];
    }
}


const getImages = async (term, page, lang, provider) => {
    switch (provider) {
        case 'pixabay':
            return _getPixabayImages(term, page, lang)
        case 'shutterstock':
            return _getShutterstockImages(term, page, lang)
        case 'google':
            return _getGoogleImages(term, page, lang)
    }
}

const setImage = async ({term, url, part}) => {
    const extRegEx = /.*\.(\w{3,4})$/
    let ext = 'jpg'
    if (extRegEx.test(url)) {
        ext = url.match(extRegEx)[1]
    }
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

const nextOrRedirect = (req, res) => {
    const next = req.app.locals.nextWord.next().value;
    if (next == null) {
        return res.redirect(`/no-more-results`)
    } else {
        return res.redirect(`/${encodeURIComponent(next.word)}/${encodeURIComponent(next.part)}`)
    }
}

module.exports = {
    GoogleApiTooManyRequestsException,
    download,
    getAllWords,
    getImages,
    isLoaded,
    nextOrRedirect,
    setImage,
    skipWord,
}