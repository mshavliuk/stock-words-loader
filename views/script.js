function follow() {
    if (this.status !== 200) {
        alert(`Error ${this.status}: ${this.statusText}`);
    } else {
        const nextUrl = new URL(this.responseURL)
        window.location = nextUrl.pathname;
    }
}

function selectImage(term, url) {
    console.log(url)
    const xhr = new XMLHttpRequest();
    xhr.onload = follow
    xhr.open("POST", `/select`);
    xhr.responseType = 'json';
    xhr.setRequestHeader("Content-Type", "application/json;charset=UTF-8");
    xhr.send(JSON.stringify({term, url}));
}

function skip(term) {
    const xhr = new XMLHttpRequest();
    xhr.onload = follow

    xhr.open("POST", `/skip`);
    xhr.responseType = 'json';
    xhr.setRequestHeader("Content-Type", "application/json;charset=UTF-8");
    xhr.send(JSON.stringify({term }));
}

function nextPage() {
    const params = getQueryParams();
    const currentPage = Number(params.page) || 1;
    addQueryParam({page: currentPage + 1})
}

function loadPageBySearch(e) {
    if (e) {
        e.preventDefault();
    }

    const search = document.querySelector('input[name="termInput"]').value
    addQueryParam({search, page: 1})

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