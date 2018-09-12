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

function displayDirectorStats(N = 20) {
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