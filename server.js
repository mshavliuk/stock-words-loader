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
    const page = req.query.page || 1;


    const providers = ['pixabay', 'shutterstock', 'google']
    const providerIndex = (page - 1) % providers.length
    const provider = providers[providerIndex]
    const providersPage = Math.ceil(page / providers.length)

    const translation = req.query.translation
    const word = app.locals.words.find(word => word.word === term && word.part === part)
    if (word) {
        const lang = translation ? 'en' : 'es';
        const termToSearch = translation ? translation : term;
        try {
            const images = await funcs.getImages(termToSearch, providersPage, lang, provider)
            res.render("term", {images, ...word, ...app.locals})
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
        app.locals['words'] = words;
    } catch (e) {
        Sentry.captureException(e)
    }
})

