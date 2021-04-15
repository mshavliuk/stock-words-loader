require('dotenv').config()

const funcs = require('./funcs')
const express = require('express')
const path = require('path');
const app = express()
const port = 3000
const bodyParser = require("body-parser");
const Sentry = require("@sentry/node");


Sentry.init({
    dsn: "https://968ecbdf3c254624916112a402b5b5c3@o121277.ingest.sentry.io/5695432",
});

app.set("view engine", "pug");
app.set("views", path.join(__dirname, "views"));
app.use(Sentry.Handlers.requestHandler());
app.use(Sentry.Handlers.errorHandler());
app.use(bodyParser.urlencoded({extended: false}));
app.use(bodyParser.json());


app.get('/', (req, res) => {
    return funcs.nextOrRedirect(req, res)
})

app.get('/no-more-results', (req, res) => {
    res.render("no-more-results")
})

app.get('/:term/:part', async (req, res, next) => {
    const term = req.params.term;
    const part = req.params.part;
    const page = Number(req.query.page || 1);

    const providers = ['pixabay', 'shutterstock', 'google']
    const providerIndex = (page - 1) % providers.length
    const provider = providers[providerIndex]
    const providersPage = Math.ceil(page / providers.length)

    const translation = req.query.translation
    const word = app.locals.words[`${term}[${part}]`]
    if (word) {
        const lang = translation ? 'en' : 'es';
        const termToSearch = translation ? translation : term;
        try {
            let images = [];
            if (page === 1) {
                const suggestedImages = word.images
                const perPage = 10 - suggestedImages.length
                const stockImages = await funcs.getImages({
                    term: termToSearch,
                    page: providersPage,
                    lang,
                    provider,
                    perPage
                })
                images = [...suggestedImages, ...stockImages]
                    .map((value) => ({sort: Math.random(), value}))
                    .sort((a, b) => a.sort - b.sort)
                    .map((a) => a.value)
            } else {
                images = await funcs.getImages({
                    term: termToSearch,
                    page: providersPage,
                    lang,
                    provider
                })
            }

            res.render("term", {...word, images, ...app.locals})
        } catch (error) {
            return next(error)
        }
    } else {
        res.send('not found')
    }
})

app.post('/select', (req, res) => {
    const {term, url, part} = req.body;
    funcs.setImage({term, url, part});

    return funcs.nextOrRedirect(req, res)
});


app.post('/skip', (req, res) => {
    const {term, part} = req.body;
    funcs.skipWord(term, part);

    return funcs.nextOrRedirect(req, res)
});

app.use(function (err, req, res, next) {
    console.error(err.stack)

    if (err instanceof funcs.GoogleApiTooManyRequestsException) {
        res.status(err.status).render("error", {message: 'Too many requests to Google API 😭'})
    } else {
        res.status(500).render("error", {stack: err.stack})
    }

    res.status(500).render("error", {stack: err.stack})
})

app.listen(port, async () => {
    console.log(`Example app listening at http://localhost:${port}`)
    try {
        const words = await funcs.getAllWords();
        app.locals['total'] = words.length;
        app.locals['index'] = 0;
        app.locals['nextWord'] = (function* () {
            for (let word of words.reverse()) {
                app.locals['index']++;
                if (word.skip || funcs.isLoaded(word.word, word.part)) {
                    continue;
                }
                yield word
            }
            return null;
        })();
        app.locals['words'] = Object.fromEntries(words.map((word) => [`${word.word}[${word.part}]`, word]));
    } catch (e) {
        Sentry.captureException(e)
    }
})

