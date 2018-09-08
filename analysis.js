let data = null

function getData() {
    return data
}

function loadDataFromFile (evt) {
    var file = evt.target.files[0]   
    if (file) {
        let fr = new FileReader()
        fr.onload = e => {
            data = parseCsvWithHeader(e.target.result)
        }
        fr.readAsText(file)
    } else { 
        alert("Failed to load file");
    }            
}
document.getElementById('fileinput').addEventListener('change', loadDataFromFile, false)

function filmCount() {
    return data.length
}

function evalDirectorStats (data) {
    let directors = {}
    for (let film of data) {
        let ds = film.Directors.split(/,/)
        for (let director of ds) {
            if (directors[director]) {
                directors[director].films.push(film)
            } else {
                directors[director] = {
                    films : [film]
                }
            }
        }
    }
    return directors
}