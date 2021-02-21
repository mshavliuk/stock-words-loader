const sstk = require("shutterstock-api");
const fs = require('fs-extra')
const request = require('request');
const glob = require("glob");

sstk.setAccessToken('v2/eVVrM2ptZXowOFBBd2JFbE02V3d1TXp3bnRVZTVDRmsvMjk0MzEzMDg3L2N1c3RvbWVyLzMva0dmTUpaTXBvUjdzZ3l1WFExdkI5RDhWNzFjeE1pMG5yM1pqS3p6ZFdWSHAyd2FadG9tUEprMTF1bmJUc2N3LXlMOENRcnp0M1Y4SVo2emk3QzFDcVNtYWI1N3FjU2JVTWdPc2dYckg5SjFOMXRKRk5lWG1XU3ZTS3VZVk1aZUJZR0RHS0tRcjI4cExoc1czVGpKMDc1R0t4a2lva1pvS1JtNnh1clhVWXZEYlJpMVpLT2duNTl5MURNb20tbWJwc0VjTjEyV3ZNU2ltWWktcElhWXNJQQ');

const imagesApi = new sstk.ImagesApi();
const chunkNum = 0;

const queryParams = {
    "query": "QUERY",
    "page": 1,
    "language": "es",
    "aspect_ratio_max": 1.7,
    "aspect_ratio_min": 1.3,
    "per_page": 10  ,
    "sort": "random",
    "view": "minimal"
};

const dir = './words-images'

const download = (url, dest) => {
    const file = fs.createWriteStream(dest);
    const sendReq = request.get(url);
    let cb;
    const result = new Promise((res) => cb = res)

    // verify response code
    sendReq.on('response', (response) => {
        if (response.statusCode !== 200) {
            return cb('Response status was ' + response.statusCode);
        }

        sendReq.pipe(file);
    });

    // close() is async, call cb after close completes
    file.on('finish', () => file.close(cb));

    // check for request errors
    sendReq.on('error', (err) => {
        fs.unlink(dest);
        return cb(err.message);
    });

    file.on('error', (err) => { // Handle errors
        fs.unlink(dest); // Delete the file async. (But we don't check the result)
        return cb(err.message);
    });

    return result;
};

const getImages = async (term, page, language) => {
    const query = {...queryParams, "query": term, page, language}
    const response = await imagesApi.searchImages(query);
    if(response.data && response.data.length > 0) {
        return response.data.map(item => item.assets.huge_thumb.url)
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
    const file = glob.sync(`${dir}/${term}\\[${part}\\].*`);
    return !!file.length;
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