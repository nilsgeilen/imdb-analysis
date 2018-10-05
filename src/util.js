function avg (list, field) {
    if (list.length) 
        return sum(list, field) / list.length
    else return 0
}

function sum (list, field) {
    if (field) 
        return list.reduce((sum, val) => sum + +field(val), 0)
    else return list.reduce((sum, val) => sum + +val, 0)
}

function argmax (fn) {
    return (list) => {
        if (list.length === 0)
            return null

        let result = list[0]
        for (let i = 1; i < list.length; i++) {
            if (fn(list[i], result) > 0)
                result = list[i]
        }
        return result
    }
}

function argmin (fn) {
    return (list) => {
        if (list.length === 0)
            return null

        let result = list[0]
        for (let i = 1; i < list.length; i++) {
            if (fn(list[i], result) < 0)
                result = list[i]
        }
        return result
    }
}

function round (x, decimals = 0) {
    const m = Math.pow(10, decimals)
    return Math.round(x * m) / m
}

function range (from, to) {
    if (!to) {
        to = from
        from = 0
    }
    let result = Array(to - from)
    for (let  i = 0; i < to - from; i++) {
        result[i] = from + i
    }
    return result
}

function groupBy (fn) {
    return list => {
        let map = {}
        for (let elem of list) {
            let key = fn(elem)
            if (key in map) {
                map[key].push(elem)
            } else {
                map[key] = [elem]
            }
        }
        return map
    }
}

function valList (map) {
    let list = []
    for (let i in map)
        list.push(map[i])
    return list
}

function getter (field) {
    return obj => obj[field]
}

function comparator (field) {
    if (field)
        return (a, b) => a[field] - b[field]
    else return (a, b) => a - b
}

function emitter (list) {
    let  i = 0
    return () => {
        if (i < list.length) {
            return list[i++]
        } else {
            return null
        }
    }
}

function zip (lists) {
    let result = []
    //const N = lists.reduce((min, list) => Math.min(min, list.length), lists.length ? lists[0].length : 0) 
    const N = Math.min(... lists.map(getter('length')))
    console.log(N)
    for (let i = 0; i < N; i++) {
        result.push(lists.map(list => list[i]))
    }
    console.log(result)
    return result
}

function tee (f) {
    return g => arg => {
        f(arg)
        g(arg)
    }
}