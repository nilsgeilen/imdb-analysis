
const COLOR_CNT = "blue"
const COLOR_AVG = "red"

const getCountryData = function()  {
    let data = null
    return function (callback) {
        if (data) {
            callback(data)
        } else {
            $.ajax({
                url: 'data/countries.csv',
                dataType: 'text',
                type: "GET",
                success: callback,
                error: (e1,e2,e3) => {alert(e1); alert(e2); alert(e3)}
            })
        }
    }
}()

function loadDataFromFile (evt) {
    var file = evt.target.files[0]   
    if (file) {
        let fr = new FileReader()
        fr.onload = e => {
            visualizeData(parseCsvWithHeader(e.target.result))
        }
        fr.readAsText(file)
    } else { 
        alert("Failed to load file");
    }
            
}
document.getElementById('fileinput').addEventListener('change', loadDataFromFile, false)


function visualizeData(films) {
    displayDirectorStats(films)
    displayDecadeStats(films)
    scatterRuntime(films)
    displayCoutryStats(films)
}

function displayDirectorStats (films, N = 10) {
    let directors = createDirectorList(films)
    let director_stats = []
    for (let director in directors)
        director_stats.push({
            name : director, 
            film_cnt : directors[director].films.length,
            avg_rating : avg(directors[director].films, "your_rating")
        })
    director_stats.sort((a, b) => a.film_cnt === b.film_cnt ? a.avg_rating < b.avg_rating : a.film_cnt < b.film_cnt )

    let dataset1 = {
        backgroundColor : "blue",
        label: '# of Films',
        data: director_stats.slice(0,N).map(entry => entry.film_cnt)
    }
    let dataset2 = {
        backgroundColor : "red",
        label: 'Average Rating',
        data: director_stats.slice(0,N).map(entry => entry.avg_rating)
    }

    let labels = director_stats.map(dirstat => dirstat.name).slice(0,N)
    plotBarChart($("#ctx1"), labels, [dataset1, dataset2])
}

function displayDecadeStats(films) {
    let decades = createDecadeList(films)

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
        dataset2.data.push(avg(decades[key], "your_rating"))
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

function scatterRuntime(films) {

    films = films.filter(film => film.runtime_mins && film.runtime_mins.match(/\d+/) && film.title_type.match(/movie|tvMovie/))

    let dataset = {
        backgroundColor : "red",
        label: 'Scatter Dataset',
        data: []
    }

    for (let film of films) {
        dataset.data.push({x: film.runtime_mins, y: film.your_rating})
    }

    var ctx = document.getElementById("ctx3")

    var scatterChart = new Chart(ctx, {
        type: 'scatter',
        data: {
            labels: films.map(film => film.title),
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
 
function displayCoutryStats(films) {
    getCountryData(data =>  {
        let map = parseMapfromCsv(data)

        let countries = createCountryList(films, map)

        for (let country of countries) {
            if (!country.films) {
                console.log(country.name)
                continue
            }
            country.film_cnt = country.films.length
            country.avg_rating = avg(country.films, "your_rating")
        }

        countries.sort((a,b) => a.film_cnt < b.film_cnt)

        const N = countries.length > 12 ? 12 : countries.length

        let dataset_cnt = {
            backgroundColor : ["#ff8000", "#00ff80", "#ff0080", "#80ff00", "#0080ff", "#8000ff",
                "#a0ff00", "#00a0ff", "#a000ff", "#ffa000", "#00ffa0", "#ff00a0"],
            label: '# of Films',
            data: countries.slice(0,N).map(entry => entry.film_cnt).concat([sum(countries.slice(N), "film_cnt")])
        }
        let dataset_avg = {
            backgroundColor : COLOR_AVG,
            label: 'Average Rating',
            data: countries.slice(0,N).map(entry => entry.avg_rating)
        }
    
        let labels = countries.slice(0,N).map(dirstat => dirstat.name)
        labels.push("other")
        var myDoughnutChart = new Chart($("#ctx4"), {
            type: 'doughnut',
            data: {
                labels : labels,
                datasets : [dataset_cnt]
            },
            options: {
                legend: {
                   position: "right"
                }
            }
        })
        //plotBarChart($("#ctx4"), labels, [dataset_cnt, dataset_avg])
    })
}

function plotBarChart (ctx, labels, datasets, beginAtZero = true) {
    let options = {}
    if (datasets.length === 2) {
        datasets[0].xAxisID = 'A'
        datasets[1].xAxisID = 'B'
        options.scales = {
            xAxes: [{
              id: 'A',
              type: 'linear',
              position: 'top',
              ticks: {
                beginAtZero: beginAtZero
              }
            }, {
              id: 'B',
              type: 'linear',
              position: 'bottom',
              ticks: {
                beginAtZero: beginAtZero
              }
            }]
          }
    } else {
        options.scales = {
            xAxes: [{
              type: 'linear',
              ticks: {
                beginAtZero: beginAtZero
              }
            }]
          }
    }

    return new Chart(ctx, {
        type: 'horizontalBar',
        data: {
            labels: labels,
            datasets: datasets
        },
        options: options
    })
}

function createCountryList(films, map) {
    let result = {}
    for (let film of films) {
        let countries = map[film.title+";"+film.year]
        if (countries) {
            for (let country of countries.split(',')) {
                if (result[country]) {
                    result[country].films.push(film)
                } else {
                    result[country] = {
                        films: [film],
                        name: country
                    } 
                }
            }
        }
    }
    let list = []
    for (let i in result) {
        list.push(result[i])
    }
    return list
}

function createDirectorList (data) {
    let directors = {}
    for (let film of data) {
        if (film.directors) {
            let ds = film.directors.split(/,/)
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
            let dec = decade(film.year)
            if (decades[dec]) {
                decades[dec].push(film)
            } else {
                decades[dec] = [film]
            }
        } catch (e) {
            console.log(e +" "+ film.title)
        }
    }
    return decades
}

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