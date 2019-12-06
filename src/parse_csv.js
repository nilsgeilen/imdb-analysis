
// cannot handle neither single quotes nor escaped quotes but works fine for this cause
function parseLine (line, sep) {
    let cells = line.match(new RegExp(`[^${sep}"]*${sep}|"[^"]*"${sep}|[^${sep}"]*$|"[^"]*"$`, "g"))
    if (cells) {
        cells.pop()
        return cells.map(s => s.replace(/^"|[",]+$/g, ""))
    }
    else return null
}

function parseCsvWithHeader (source, sep = ',') {
    let lines = source.split (/\r?\n/)
    let headers = parseLine(lines.shift(), sep).map(header => header.replace(/\(|\)/g,"").replace(/\s/g, "_").toLowerCase())
    let results = []
    for (let row of lines) {
        let obj = new Object()
        let cols = parseLine(row, sep)
        if (cols) {
            for (let i = 0; i < cols.length; i++) {
                if (headers[i]) {
                    obj[headers[i]] = cols[i]
                }
            }
            results.push(obj)
        }
    }
    return results
} 

function parseMapfromCsv(source) {
    let lines = source.split (/\r?\n/)
    let result = {}
    for (let row of lines) {
        let matches = row.match(/^(.+);([^;]+)$/)
        if(matches)
        result[matches[1]] = matches[2]
        else   console.log('Could not parse csv row: "'+row+'"') 
    }
    return result
}