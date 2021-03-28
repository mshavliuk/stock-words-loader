function selectImage(term, part, url) {
    console.log(url)
    const xhr = new XMLHttpRequest();
    xhr.onload = () => {
        if (xhr.status !== 200) {
            alert(`Error ${xhr.status}: ${xhr.statusText}`);
        } else {
            const part = xhr.response.next.part
            const term = xhr.response.next.word
            window.location = `/${term}/${part}`;
        }
    };
    xhr.open("POST", `/${term}/${part}`);
    xhr.responseType = 'json';
    xhr.setRequestHeader("Content-Type", "application/json;charset=UTF-8");
    xhr.send(JSON.stringify({url, term, part}));
}

function skip(term, part) {
    const xhr = new XMLHttpRequest();
    xhr.onload = () => {
        if (xhr.status !== 200) {
            alert(`Error ${xhr.status}: ${xhr.statusText}`);
        } else {
            const part = xhr.response.next.part
            const term = xhr.response.next.word
            window.location = `/${term}/${part}`;
        }
    };
    xhr.open("POST", `/${term}/${part}`,);
    xhr.responseType = 'json';
    xhr.setRequestHeader("Content-Type", "application/json;charset=UTF-8");
    xhr.send(JSON.stringify({term, part, skip: true}));
}

function nextPage() {
    const params = getQueryParams();
    const currentPage = Number(params.page) || 1;
    addQueryParam({page: currentPage + 1})
}

function loadPageByTranslation(e) {
    if(e) {
        e.preventDefault();
    }

    const translation = document.querySelector('input[name="termInput"]').value
    addQueryParam({translation})

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
        if(!param) {
            continue;
        }
        const [key, value] = param.split('=')
        paramObj[key] = value
    }
    return paramObj
}