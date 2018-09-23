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
            visualizeData()
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

function visualizeData() {
    displayDirectorStats()
    displayDecadeStats()
    scatterRuntime()
}

function displayDirectorStats (N = 10) {
    let directors = createDirectorList(data)
    let director_stats = []
    for (let director in directors)
        director_stats.push({
            name : director, 
            film_cnt : directors[director].films.length,
            avg_rating : directors[director].films.reduce((sum, film) => sum + +film["Your Rating"], 0) / directors[director].films.length
        })
    director_stats.sort((a, b) => a.film_cnt === b.film_cnt ? a.avg_rating < b.avg_rating : a.film_cnt < b.film_cnt )

    var ctx = document.getElementById("ctx1")
    let dataset1 = {
        backgroundColor : "blue",
        label: '# of Films',
        xAxisID: 'A',
        data: [],
        
    }
    for (let entry of director_stats.slice(0,N)) {
        dataset1.data.push(entry.film_cnt)
    }
    let dataset2 = {
        backgroundColor : "red",
        label: 'Average Rating',
        xAxisID: 'B',
        data: [],
        
    }
    for (let entry of director_stats.slice(0,N)) {
        dataset2.data.push(entry.avg_rating)
    }
    var myChart = new Chart(ctx, {
        type: 'horizontalBar',
        data: {
            
            labels: director_stats.map(dirstat => dirstat.name).slice(0,N),
            datasets: [dataset1, dataset2]
        },
        options: {
            scales: {
                xAxes: [{
                  id: 'A',
                  type: 'linear',
                  position: 'top',
                  ticks: {
                    beginAtZero: true
                  }
                }, {
                  id: 'B',
                  type: 'linear',
                  position: 'bottom',
                  ticks: {
                    beginAtZero: true
                  }
                }]
              }
            
        }
    });

}

function displayDecadeStats() {
    let decades = createDecadeList(data)

    let dataset1 = {
        backgroundColor : "blue",
        label: '# of Films',
        yAxisID: 'A',
        data: [],
        
    }

    let dataset2 = {
        backgroundColor : "red",
        label: 'Average Rating',
        yAxisID: 'B',
        data: [],
        
    }

    for (let key of Object.keys(decades).sort()) {
        dataset1.data.push(decades[key].length)
        dataset2.data.push(decades[key].reduce((sum, film) => sum + +film["Your Rating"], 0) / decades[key].length)
    }

    var ctx = document.getElementById("ctx2")

    var myChart = new Chart(ctx, {
        type: 'bar',
        data: {
            
            labels: Object.keys(decades).sort(),
            datasets: [dataset1, dataset2]
        },
        options: {
            scales: {
                yAxes: [{
                  id: 'A',
                  type: 'linear',
                  position: 'left',
                  ticks: {
                    beginAtZero: true
                  }
                }, {
                  id: 'B',
                  type: 'linear',
                  position: 'right',
                  ticks: {
                    beginAtZero: true
                  }
                }]
              }
            
        }
    })
}

function scatterRuntime() {

    let films = data.filter(film => film["Runtime (mins)"] && film["Runtime (mins)"].match(/\d+/) && film["Title Type"].match(/movie|tvMovie/))

    let dataset = {
        backgroundColor : "red",
        label: 'Scatter Dataset',
        data: []
    }

    for (let film of films) {
        dataset.data.push({x: film["Runtime (mins)"], y: film["Your Rating"]})
    }

    var ctx = document.getElementById("ctx3")

    var scatterChart = new Chart(ctx, {
        type: 'scatter',
        data: {
            labels: films.map(film => film.Title),
            datasets: [dataset]
        },
        options: {
            scales: {
                xAxes: [{
                    type: 'linear',
                    position: 'bottom'
                }]
            },
            tooltips: {
                callbacks: {
                   label: function(tooltipItem, data) {
                      var label = data.labels[tooltipItem.index];
                      return label + ' (' + tooltipItem.xLabel + 'mins, rating:' + tooltipItem.yLabel + ')';
                   }
                }
             }
        }
    })
}

function createDirectorList (data) {
    let directors = {}
    for (let film of data) {
        if (film.Directors) {
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
    }
    return directors
}

function decade (year) {
    let dec = year.match(/(\d\d\d)\d/)
    if (dec)   
        return dec[1] + "0s"
    else throw "Not a valid year: " + year
}

function createDecadeList (data) {
    let decades = {}
    for (let film of data) {
        try {
        let dec = decade(film.Year)
        if (decades[dec]) {
            decades[dec].push(film)
        } else {
            decades[dec] = [film]
        }
    } catch (e) {
        console.log(e +" "+ film.Title)
    }
    }
    return decades
}