const headerState = {
    'authorization': localStorage.usertoken,
}

const newHeaderState = (opts) => {
    let newHeader = headerState
    for (const [key, value] of Object.entries(opts)) {
        newHeader[key] = value
    }
    return newHeader
}

const reqGetOpt = (opts) => {
    return ({
        method: 'GET',
        headers: newHeaderState(opts)
    })
}

const reqPostOpt = (opts, optbody) => {
    return ({
        method: 'POST',
        headers: newHeaderState(opts),
        body: optbody
    })
}

export const fetchGet = (url, headeropts = {}) => {
    console.log("fetch header: ", reqGetOpt(headeropts))
    return (
        new Promise((resolve) => {
            fetch(url, reqGetOpt(headeropts))
            .then(data => {
                console.log(data.status)
                return data.body.getReader()
            })
            .then(reader => reader.read())
            .then(data => resolve(new TextDecoder("utf-8").decode(data.value)))
        })
    );
}
export const fetchGetJSON = (url, headeropts={}) => {
    console.log("fetch header: ", reqGetOpt(headeropts))
    return (
        new Promise((resolve) => {
            fetch(url, reqGetOpt(headeropts))
            .then(data => resolve(data.json()))
        })
    );
}

export const fetchPost = (url, headeropts={}, optbody) => {
    console.log(reqPostOpt(headeropts, optbody))
    return (
        new Promise((resolve) => {
            fetch(url, reqPostOpt(headeropts, optbody))
            .then(data => 
                data.body.getReader())
            .then(reader => reader.read())
            .then(data => resolve(new TextDecoder("utf-8").decode(data.value)))
        })
    );
}