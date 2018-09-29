
const COLOR_CNT = "blue"
const COLOR_AVG = "red"
const COLOR_COPROD = "gray"

const COPRODUCTION = "coproduction"

const getCountryData = function ()  {
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

const visualizeData = function () {
    let charts = []
    let charts_async = []
    return function (films) {
        for (let chart of charts.concat(charts_async))
            chart.destroy()
        films = films.filter(film => film.title_type && film.title_type.match(/movie|tvMovie/))
        charts_async = []
        displayCoutryStatsAsync(films, charts_async)
        charts = displayDirectorStats(films)
            .concat(displayDecadeStats(films))
            .concat(scatterRuntime(films))
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

function displayDirectorStats (films, N = 10) {
    let directors = createDirectorList(films)
    for (let director of directors) {
            director.film_cnt = director.films.length,
            director.avg_rating = avg(director.films, "your_rating")
    }
    let top_10 = directors.sort((a, b) => (b.film_cnt * 1000 + b.avg_rating) - (a.film_cnt * 1000 + a.avg_rating)).slice(0, N)

    let dataset1 = {
        backgroundColor : "blue",
        label: '# of Films',
        data: top_10.map(entry => entry.film_cnt)
    }
    let dataset2 = {
        backgroundColor : "red",
        label: 'Average Rating',
        data: top_10.map(entry => entry.avg_rating)
    }

    let labels = top_10.map(dirstat => dirstat.name)
    let chart1 = plotBarChart($("#ctx1"), labels, [dataset1, dataset2])

    let top_diff = directors.filter(director => director.film_cnt >= 2).map(director => ({
        director : director, 
        diff : argmax(director.films, "your_rating").your_rating - argmin(director.films, "your_rating").your_rating
    })).sort((a,b) => b.diff - a.diff).slice(0,5).map(x => ({
        name: x.director.name,
        diff: x.diff,
        films: x.director.films.slice().sort((a,b) => a.your_rating - b.your_rating)
    }))

    let datasets = top_diff.map(elem => ({
        //label: elem.director.name,
        data: elem.films.map(film => ({x: film.your_rating, y: elem.name, title: film.title})),
        fill: false,
        borderColor: COLOR_AVG,
        backgroundColor: COLOR_AVG,
        pointStyle : 'rectRounded',
        pointRadius : 10.0,
        pointHoverRadius :10.0,
        pointHitRadius : 10.0
    }))

    let chart2 = new Chart($("#ctx1b"), {
        type: 'line',
        data: {
            yLabels : [""].concat(top_diff.map(x => x.name)).concat([""]),
            datasets : datasets
        },
        options: {
            legend: {
                display: false
            },
            scales: {
                xAxes: [{
                    type: 'linear',
                    position: 'bottom'
                }],
                yAxes: [{
                    type: 'category',
                    position: 'left',
                    display: true,
                    ticks: {
                        reverse: true
                        },
                    }]
            },
            tooltips: {
                callbacks: {
                   label: (tooltipItem, data) => data.datasets[tooltipItem.datasetIndex].data[tooltipItem.index].title
                }
             }
        }
    })

    return [chart1, chart2]
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

    let chart1 = new Chart($("#ctx2"), {
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

    return [chart1]
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

    let scatterChart = new Chart($("#ctx3"), {
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

    return [scatterChart]
}
 
function displayCoutryStatsAsync(films, charts) {
    getCountryData(data =>  {
        let map = parseMapfromCsv(data)

        let countries = createCountryList(films, map)

        for (let country of countries) {
            if (!country.films) {
                console.log("Country has no films: " + country.name)
                continue
            }
            country.film_cnt = country.films_excl_coprod.length
            country.avg_rating = avg(country.films, "your_rating")
        }

        countries.sort((a,b) => a.film_cnt < b.film_cnt)

        const N_1 = countries.length > 12 ? 12 : countries.length

        let dataset_cnt = {
            backgroundColor : ["#ff8000", "#00ff80", "#ff0080", "#80ff00", "#0080ff", "#8000ff",
                "#a0ff00", "#00a0ff", "#a000ff", "#ffa000", "#00ffa0", "#ff00a0"],
            label: '# of Films',
            data: countries.slice(0,N_1).map(entry => entry.film_cnt).concat([sum(countries.slice(N_1), "film_cnt")])
        }

        for (let i = 0; i < dataset_cnt.backgroundColor.length; i++) {
            console.log(countries[i].name)
            if (countries[i].name === COPRODUCTION) {
                dataset_cnt.backgroundColor[i] = COLOR_COPROD
                break
            }
        }
    
        let labels = countries.slice(0,N_1).map(dirstat => dirstat.name)
        labels.push("other")
        charts.push(new Chart($("#ctx4"), {
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
        }))

        const N_2 = 15

        let top_countries = countries.filter(country => country.name !== COPRODUCTION).sort((a,b) => b.films.length - a.films.length).slice(0,N_2)

        let dataset_excl_coprod = {
            backgroundColor : "#000040",
            label: '# of domestic films',
            data: top_countries.map(entry => entry.film_cnt).concat([sum(countries.slice(N_2), "film_cnt")])
        }

        let dataset_coprod = {
            backgroundColor : "#0000ff",
            label: '# of coproductions',
            data: top_countries.map(entry => entry.films.length  - entry.film_cnt).concat([sum(countries.slice(N_2), "film_cnt")])
        }

        charts.push(plotBarChart($("#ctx4b"), top_countries.map(entry => entry.name), [dataset_excl_coprod, dataset_coprod], false, true))

        const N_3 = N_2/2
        let countries_by_avg_rating = countries.filter(country => country.films.length >= 2).sort((a,b) => b.avg_rating - a.avg_rating)
        if (countries_by_avg_rating.length > N_3*2+1)
            countries_by_avg_rating = countries_by_avg_rating.slice(0,N_3).concat([{name: '...', avg_rating: 1}]).concat(countries_by_avg_rating.slice(-N_3))
        let dataset_avg = {
            backgroundColor : COLOR_AVG,
            label: 'Average Rating',
            data: countries_by_avg_rating.map(entry => entry.avg_rating)
        }
        charts.push(plotBarChart($("#ctx4c"), countries_by_avg_rating.map(entry => entry.name), [dataset_avg], false))

    })
}

function plotBarChart (ctx, labels, datasets, beginAtZero = true, stacked) {
    let options = {
        legend: {
            display: datasets.length > 1
        }
    }
    if (!stacked && datasets.length === 2) {
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
                stacked: stacked,
                type: 'linear',
                ticks: {
                beginAtZero: beginAtZero
              }
            }],
            yAxes: [{
                 stacked: stacked
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

function Country (name, films = [], films_excl_coprod = []) {
    this.name = name
    this.films = films
    this.films_excl_coprod = films_excl_coprod
}

function createCountryList(films, map) {
    let result = {}
    result[COPRODUCTION] = new Country(COPRODUCTION)
    for (let film of films) {
        let countries = map[film.title+";"+film.year]
        if (countries) {
            countries = countries.split(/,/)
            for (let country of countries) {
                if (result[country]) {
                    result[country].films.push(film)
                } else {
                    result[country] = new Country(country, [film]) 
                }
            }
            (countries.length === 1 ? result[countries[0]] : result[COPRODUCTION]).films_excl_coprod.push(film)
        }
    }
    return valList(result)
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
                        films : [film],
                        name : director
                    }
                }
            }
        }
    }
    return valList(directors)
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

