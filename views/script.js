function follow() {
    if (this.status !== 200) {
        alert(`Error ${this.status}: ${this.statusText}`);
    } else {
        const nextUrl = new URL(this.responseURL)
        window.location = nextUrl.pathname;
    }
}

function selectImage(term, part, url) {
    console.log(url)
    const xhr = new XMLHttpRequest();
    xhr.onload = follow
    xhr.open("POST", `/select`);
    xhr.responseType = 'json';
    xhr.setRequestHeader("Content-Type", "application/json;charset=UTF-8");
    xhr.send(JSON.stringify({term, part, url}));
}

function skip(term, part) {
    const xhr = new XMLHttpRequest();
    xhr.onload = follow

    xhr.open("POST", `/skip`);
    xhr.responseType = 'json';
    xhr.setRequestHeader("Content-Type", "application/json;charset=UTF-8");
    xhr.send(JSON.stringify({term, part}));
}

function nextPage() {
    const params = getQueryParams();
    const currentPage = Number(params.page) || 1;
    addQueryParam({page: currentPage + 1})
}

function loadPageByTranslation(e) {
    if (e) {
        e.preventDefault();
    }

    const translation = document.querySelector('input[name="termInput"]').value
    addQueryParam({translation, page: 1})

    return false;
}

function addQueryParam(param) {
    let params = getQueryParams();
    params = {...params, ...param};
    document.location.search = '?' + new URLSearchParams(params).toString()
}

function getQueryParams() {
    const params = document.location.search.substr(1).split('&');
    const paramObj = {};
    for (let param of params) {
        if (!param) {
            continue;
        }
        const [key, value] = param.split('=')
        paramObj[key] = value
    }
    return paramObj
}

function handleKeyPress(e) {
    if (e.code === "Space") {
        nextPage();
        document.removeEventListener('keydown', handleKeyPress);
        e.preventDefault();
        return false;
    }
}

document.addEventListener('keydown', handleKeyPress);