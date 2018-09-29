function avg (list, field) {
    if (list.length) 
        return sum(list, field) / list.length
    else return 0
}

function sum (list, field) {
    if (field) 
        return list.reduce((sum, val) => sum + +val[field], 0)
    else return list.reduce((sum, val) => sum + +val, 0)
}

function argmax (list, field) {
    if (list.length === 0)
        return null
    if (!field) {
        throw "not supported yet!"
    } else if (typeof field === 'function') {
        let result = list[0]
        for (let i = 1; i < list.length; i++) {
            if (field(list[i], result) > 0)
                result = list[i]
        }
        return result
    } else if (typeof field === 'string') {
        let result = list[0]
        for (let i = 1; i < list.length; i++) {
            if (+list[i][field] > +result[field])
                result = list[i]
        }
        return result
    } 
}

function argmin (list, field) {
    if (list.length === 0)
        return null
    if (!field) {
        throw "not supported yet!"
    } else if (typeof field === 'function') {
        let result = list[0]
        for (let i = 1; i < list.length; i++) {
            if (field(list[i], result) < 0)
                result = list[i]
        }
        return result
    } else if (typeof field === 'string') {
        let result = list[0]
        for (let i = 1; i < list.length; i++) {
            if (+list[i][field] < +result[field])
                result = list[i]
        }
        return result
    } 
}

function valList (map) {
    let list = []
    for (let i in map)
        list.push(map[i])
    return list
}