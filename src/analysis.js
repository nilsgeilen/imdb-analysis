
const COLOR_CNT = "blue"
const COLOR_AVG = "red"
const COLOR_RATING = "orange"
const COLOR_SCORE = "#80ff00"
const COLOR_COPROD = "gray"
const COLOR_OTHER = "gray"

const STD_COLORS = ["#ff8000", "#00ff80", "#ff0080", "#80ff00", "#0080ff", "#8000ff",
    "#a0ff00", "#00a0ff", "#a000ff", "#ffa000", "#00ffa0", "#ff00a0"]

const COUNTRY_COPRODUCTION = "coproduction"
const COUNTRY_OTHER = "other"

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
    return function (films) {
        for (let chart of charts)
            chart.destroy()
        films = films.filter(film => film.title_type && film.title_type.match(/movie|tvMovie/))
        charts_async = []
        displayCoutryStatsAsync(films)
        charts = [...displayDirectorStats(films), ...displayDecadeStats(films), ...scatterRuntime(films)]
        displayFilmStats (films)
    }
}()

function loadDataFromFile (evt) {
    const file = evt.target.files[0]   
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

function displayFilmStats (films) {
    for (let film of films) {
        film.rating_diff = film.your_rating - film.imdb_rating
    }

    films.sort((a, b) => b.rating_diff - a.rating_diff)

    console.log(films)
}



const createTopDirectorChart = function () {
    let chart = createBarChart($("#ctx1"))
    return function (directors = createDirectorList(), N = 10) {

        let order_primary = $('#select_sorting_ctx1').val()
        let order_secondary = order_primary === 'film_cnt' ? 'avg_rating' : 'film_cnt'
        let order = (a, b) => (b[order_primary] * 1000 + b[order_secondary]) - (a[order_primary] * 1000 + a[order_secondary])
        let top_10 = directors.sort(order).slice(0, N)

        let dataset1 = {
            backgroundColor : COLOR_CNT,
            label: '# of films',
            data: top_10.map(entry => entry.film_cnt)
        }
        let dataset2 = {
            backgroundColor : COLOR_AVG,
            label: 'average rating',
            data: top_10.map(entry => entry.avg_rating)
        }
        let dataset3 = {
            backgroundColor : COLOR_SCORE,
            label: 'score',
            data: top_10.map(entry => entry.score)
        }

        let labels = top_10.map(dirstat => dirstat.name)
        
        chart(labels, [dataset3, dataset1, dataset2])
    }
}()

function displayDirectorStats (films, N = 10) {
    let directors = createDirectorList(films)
    

    createTopDirectorChart(directors)

    //let top_10 = directors.sort((a, b) => 1000 * b.film_cnt + b.avg_rating - 1000 * a.film_cnt - a.avg_rating).slice(0, N)
    //let top_10 = directors.sort((a, b) => b.film_cnt * b.avg_rating - a.film_cnt * a.avg_rating).slice(0, N)
    function rank (director) {
        return (director.avg_rating  - 5) * director.film_cnt
    }
    let top_10 = directors.sort((a, b) => rank(b) - rank(a)).slice(0, N)



    let top_diff = directors.map(director => ({
        director : director, 
        diff : argmax (comparator('your_rating')) (director.films).your_rating - argmin (comparator('your_rating')) (director.films).your_rating
    })).sort((a,b) => b.diff - a.diff).slice(0,5).map(x => ({
        name: x.director.name,
        diff: x.diff,
        avg_rating : x.director.avg_rating,
        films: Object.entries(groupBy (getter('your_rating')) (x.director.films)).sort((a,b) => b[0] - a[0]).map(entry => ({
            your_rating : entry[0],
            title : entry[1].map(film => film.title).join(', '),
            film_cnt : entry[1].length
        }))
    }))

    
    let datasets = top_diff.map(elem => {
        let sizes = elem.films.map(film => 6.0 + film.film_cnt * 3.0)
        return {
            //label: elem.director.name,
            data: elem.films.map(film => ({x: film.your_rating, y: elem.name, title: film.title})),
            fill: false,
            borderColor: COLOR_RATING,
            backgroundColor: COLOR_RATING,
            pointStyle : 'rectRounded',
            pointRadius : sizes,
            pointHoverRadius : sizes,
            pointHitRadius : sizes
    }}).concat([{
        //label: elem.director.name,
        data: top_diff.map(elem =>({x: elem.avg_rating, y: elem.name, title: elem.name})),
        fill: false,
        showLine: false,
        borderColor: COLOR_AVG,
        backgroundColor: COLOR_AVG,
        pointStyle : 'star',
        pointRadius : 10.0,
        pointHoverRadius :10.0,
        pointHitRadius : 10.0
    }])

    console.log(datasets)

    let chart2 = new Chart($("#ctx1b"), {
        type: 'line',
        data: {
            yLabels : ["", ...top_diff.map(x => x.name), ""],
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

    let datasets_chrono = zip([top_10, STD_COLORS]).map(([director, color]) => ({
            label: director.name,
            data: director.films.sort((a, b) => b.year - a.year).map(film => ({x: film.year, y: film.your_rating, title: film.title})),
            fill: false,
            borderColor: color,
            backgroundColor: color,
            pointStyle : 'rectRounded',
            pointRadius : 10.0,
            pointHoverRadius : 10.0,
            pointHitRadius : 10.0
    }))

    let chart3 = new Chart($("#ctx1c"), {
        type: 'line',
        data: {
            datasets : datasets_chrono
        },
        options: {
            scales: {
                xAxes: [{
                    type: 'linear',
                    position: 'bottom'
                }],
                yAxes: [{
                    type: 'linear',
                    position: 'left'
                    }]
            },
            tooltips: {
                callbacks: {
                   label: (tooltipItem, data) => data.datasets[tooltipItem.datasetIndex].data[tooltipItem.index].title
                }
             }
        }
    })

    return [chart2, chart3]
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
        dataset2.data.push(+avg(decades[key], getter("your_rating")).toFixed(1))
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

    console.log(valList(decades).map(films => argmax ((a,b) => 1000 * a.your_rating + a.imdb_rating - 1000 * b.your_rating - b.imdb_rating ) (films)))

    return [chart1]
}

function scatterRuntime(films) {

    films = films.filter(film => film.runtime_mins && film.runtime_mins.match(/\d+/))

    let dataset = {
        backgroundColor : COLOR_RATING,
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

const displayCoutryStatsAsync = function () {
    const pie_chart = createChartHolder()
    const bar_chart_cnt = createBarChart($("#ctx4b"))
    const bar_chart_avg = createBarChart($("#ctx4c"))
    return function (films) {
        getCountryData(data =>  {
            let map = parseMapfromCsv(data)

            let countries = createCountryList(films, map)

            for (let country of countries) {
                if (!country.films) {
                    console.log("Country has no films: " + country.name)
                    continue
                }
                country.film_cnt = country.films_excl_coprod.length
                country.avg_rating = +avg(country.films, getter("your_rating")).toFixed(1)
            }

            countries.sort((a,b) => b.film_cnt - a.film_cnt)

            let N_1 = 12
            N_1 = countries.length > N_1 ? N_1 : countries.length
            for (let i = 0; i < N_1; i++) {
                if (countries[i].film_cnt === 1) {
                    N_1 = i
                    break
                }
            }

            let country_sample = [...countries.slice(0, N_1), {name: COUNTRY_OTHER, film_cnt: sum(countries.slice(N_1), getter("film_cnt"))}]
            let color_sample = emitter(STD_COLORS)

            let dataset_cnt = {
                backgroundColor : country_sample.map((country, i) => 
                    country.name === COUNTRY_COPRODUCTION ? COLOR_COPROD : country.name === COUNTRY_OTHER ? COLOR_OTHER : color_sample()),
                label: '# of Films',
                data: country_sample.map(getter("film_cnt"))
            }
        
            pie_chart(new Chart($("#ctx4"), {
                type: 'doughnut',
                data: {
                    labels : country_sample.map(getter('name')),
                    datasets : [dataset_cnt]
                },
                options: {
                    legend: {
                    position: "right"
                    }
                }
            }))

            const N_2 = 15

            let top_countries = countries.filter(country => country.name !== COUNTRY_COPRODUCTION).sort((a,b) => b.films.length - a.films.length).slice(0,N_2)

            let dataset_excl_coprod = {
                backgroundColor : "#000040",
                label: '# of domestic films',
                data: [...top_countries.map(entry => entry.film_cnt), sum(countries.slice(N_2), getter("film_cnt"))]
            }

            let dataset_coprod = {
                backgroundColor : "#0000ff",
                label: '# of coproductions',
                data: [...top_countries.map(entry => entry.films.length  - entry.film_cnt), sum(countries.slice(N_2), getter("film_cnt"))]
            }

            bar_chart_cnt(top_countries.map(entry => entry.name), [dataset_excl_coprod, dataset_coprod], false, true)

            const N_3 = 8
            let countries_by_avg_rating = countries.filter(country => country.films.length >= 3).sort((a,b) => b.avg_rating - a.avg_rating)
            if (countries_by_avg_rating.length > N_3*2+1)
                countries_by_avg_rating = [...countries_by_avg_rating.slice(0,N_3), {name: '...', avg_rating: 1}, ...countries_by_avg_rating.slice(-N_3)]
            let dataset_avg = {
                backgroundColor : COLOR_AVG,
                label: 'Average Rating',
                data: countries_by_avg_rating.map(entry => entry.avg_rating)
            }
            bar_chart_avg(countries_by_avg_rating.map(entry => entry.name), [dataset_avg], false)
        })
    }
}()

function createChartHolder() {
    let chart = null
    return function (data) {
        if (chart)
            chart.destroy()
        chart = data
    }
}

function createBarChart (ctx) {
    const chart = createChartHolder()
    return function (labels, datasets, beginAtZero = true, stacked) {
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

        chart(new Chart(ctx, {
            type: 'horizontalBar',
            data: {
                labels: labels,
                datasets: datasets
            },
            options: options
        }))
    }
}

function Director (name, films) {
    this.name = name
    this.films = films
    this.film_cnt = films.length
    let avg_rating = avg(films, getter("your_rating"))
    this.score = Math.max(round((avg_rating - 5.5) * this.film_cnt, 1), 1, 0)
    this.avg_rating = round(avg_rating, 1)
}


const createDirectorList = function () {
    let data = []
    return function (films) {
        if (!films)
            return data
        let directors = {}
        for (let film of films) {
            if (film.directors) {
                for (let director of film.directors.split(/,/)) {
                    director = director.trim()
                    if (directors[director]) {
                        directors[director].push(film)
                    } else {
                        directors[director] = [film]
                    }
                }
            }
        }
        return data = Object.entries(directors).map(entry => new Director(...entry)).filter(director => director.film_cnt >= 2)
    }
}()

function Country (name, films = [], films_excl_coprod = []) {
    this.name = name
    this.films = films
    this.films_excl_coprod = films_excl_coprod
}

function createCountryList(films, map) {
    let result = {}
    result[COUNTRY_COPRODUCTION] = new Country(COUNTRY_COPRODUCTION)
    for (let film of films) {
        let countries = map[film.title+";"+film.year]
        if (countries) {
            countries = countries.split(/,/)
            for (let country of countries) {
                country = country.trim()
                if (result[country]) {
                    result[country].films.push(film)
                } else {
                    result[country] = new Country(country, [film]) 
                }
            }
            (countries.length === 1 ? result[countries[0]] : result[COUNTRY_COPRODUCTION]).films_excl_coprod.push(film)
        }
    }
    return valList(result)
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

