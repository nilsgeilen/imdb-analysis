
// cannot handle neither single quotes nor escaped quotes but works fine for this cause
function parseLine (line) {
    let cells = line.match(/[^,"]+,|"[^"]+",|[^,"]+$|"[^"]+"$/g)
    if (cells)
        return cells.map(s => s.replace(/^"|[",]+$/g, ""))
    else return null
}

function parseCsvWithHeader (source) {
    let lines = source.split (/\r?\n/)
    let headers = parseLine(lines.shift())
    alert(headers)
    let results = []
    for (let row of lines) {
        let obj = new Object()
        let cols = parseLine(row)
        if (cols) {
            for (let i = 0; i < cols.length; i++) {
                obj[headers[i]] = cols[i]
            }
            results.push(obj)
        }
    }
    return results
} 