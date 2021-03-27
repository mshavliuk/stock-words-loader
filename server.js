const funcs = require('./funcs')
const express = require('express')
const path = require('path');
const app = express()
const port = 3000
const bodyParser = require("body-parser");

app.set("view engine", "pug");
app.set("views", path.join(__dirname, "views"));
app.use(bodyParser.urlencoded({extended: false}));
app.use(bodyParser.json());


app.get('/', (req, res) => {
    const next = app.locals.nextWord.next().value;
    res.redirect(`/${next.word}/${next.part}`)
})

app.get('/:term/:part', async (req, res) => {
    const term = req.params.term;
    const part = req.params.part;
    const page = req.query.page || 1;


    const providers = ['pixabay', 'shutterstock', 'google']
    const providerIndex = (page - 1) % providers.length
    const provider = providers[providerIndex]
    const providersPage = page / (providerIndex + 1)

    const translation = req.query.translation
    const word = app.locals.words.find(word => word.word === term && word.part === part)
    if (word) {
        const lang = translation ? 'en' : 'es';
        const termToSearch = translation ? translation : term;
        const images = await funcs.getImages(termToSearch, providersPage, lang, provider)
        res.render("term", {images, ...word, ...app.locals})
    } else {
        res.send('not found')
    }
})

app.post('/:term/:part', (req, res) => {
    const {term, url, part, skip } = req.body;

    if(skip) {
        funcs.skipWord(term, part);
    } else {
        funcs.setImage({term, url, part});
    }
    const next = app.locals.nextWord.next().value
    res.send({next})
});

app.listen(port, async () => {
    console.log(`Example app listening at http://localhost:${port}`)
    const words = await funcs.getAllWords();
    app.locals['total'] = words.length;
    app.locals['index'] = 0;
    app.locals['nextWord'] = (function* () {
        for (let word of words.reverse()) {
            app.locals['index']++;
            if(word.skip || funcs.isLoaded(word.word, word.part)) {
                continue;
            }
            yield word
        }
        return null;
    })();
    app.locals['words'] = words;
})

