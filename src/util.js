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

function argmax (list, field) {
    if (list.length === 0)
        return null
    if (!field) 
        field = id => id

    let result = list[0]
    for (let i = 1; i < list.length; i++) {
        if (field(list[i], result) > 0)
            result = list[i]
    }
    return result
}

function argmin (list, field) {
    if (list.length === 0)
        return null
    if (!field) 
        field = id => id
    
    let result = list[0]
    for (let i = 1; i < list.length; i++) {
        if (field(list[i], result) < 0)
            result = list[i]
    }
    return result
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