
const COLOR_CNT = "blue"
const COLOR_AVG = "red"
const COLOR_RATING = "orange"
const COLOR_SCORE = "#60e020"
const COLOR_POS = "green"
const COLOR_NEG = "red"
const COLOR_COPROD = "gray"
const COLOR_OTHER = "gray"

const STD_COLORS = ["#ff8000", "#0080ff", "#ff0080", "#80ff00", "#8000ff", "#00ff80",
    "#d04080", "#40d080", "#d08040", "#80d040", "#4080d0", "#8040d0",'#808080','#404040','#d0d0d0','black']

const COUNTRY_COPRODUCTION = "coproduction"
const COUNTRY_OTHER = "other"

Chart.defaults.global.defaultFontSize = 16
Chart.defaults.global.defaultFontColor = 'black'

function loadData(url) {
    let data = null
    return function (callback) {
        if (data) {
            callback(data)
        } else {
            $.ajax({
                url: url,
                dataType: 'text',
                type: "GET",
                success: callback,
                error: (e1, e2, e3) => { alert(e1); alert(e2); alert(e3) }
            })
        }
    }
}

const loadCountryData = loadData('data/production_countries.csv')
const loadISOCountryCodes = loadData('data/iso_country_codes.csv')

function visualizeData(films) {

    for (let film of films) {
        // if(film.genres)
        //     film.genres = film.genres.split(/,\s*/);
        //     else console.log(film)
    }
    displayCoutryStatsAsync(films)
    createStats(films)
    displayDecadeStats(films)
    displayRatingYearStats(films)
    displayDirectorStats(films)
    scatterRuntime(films)
    displayGenreStats(films)
}


function loadSampleData() {
    $.ajax({
        url: 'data/examples/example.csv',
        dataType: 'text',
        type: "GET",
        success: data => {
            visualizeData(parseCsvWithHeader(data))
            $('#reportArea').show()
        },
        error: (e1, e2, e3) => { alert(e1); alert(e2); alert(e3) }
    })
}

function loadDataFromFile(file) {
    if (file) {
        let fr = new FileReader()
        fr.onload = e => {
            visualizeData(parseCsvWithHeader(e.target.result))
        }
        fr.readAsText(file)
        $('#reportArea').show()
    } else {
        alert("Failed to load file");
    }

}
document.getElementById('fileinput').addEventListener('change', evt => loadDataFromFile(evt.target.files[0]), false)

const createStats = function() {
    const chart = createChartHolder()
    return function(films) {
        let types = {'sum': films}
        for (let film of films) {
            if (film.title_type in types) {
                types[film.title_type].push(film)
            } else {
                types[film.title_type] = [film]
            }
        }

        let data = []
        for (let type in types) {
            data.push({
                name:type,
                film_cnt: types[type].length,
                your_avg_rating : round(avg(types[type], getter('your_rating')), 1),
                imdb_avg_rating: round(avg(types[type], getter('imdb_rating')), 1)
            })
        }
        $('#formula_yar').text(round(avg(films, getter('your_rating')), 1))
    

        data.sort((a, b) => b.film_cnt - a.film_cnt)

        let dataset1 = {
            backgroundColor: COLOR_CNT,
            label: '# of films',
            data: data.map(entry => entry.film_cnt),
            xAxisID: 'A'
        }
        let dataset2 = {
            backgroundColor: COLOR_AVG,
            label: 'your average rating',
            data: data.map(entry => entry.your_avg_rating),
            xAxisID: 'B'
        }
        let dataset3 = {
            backgroundColor: COLOR_RATING,
            label: 'imdb avgerage rating',
            data: data.map(entry => entry.imdb_avg_rating),
            xAxisID: 'B'
        }

        let labels = data.map(elem => elem.name)

        chart(new Chart($("#ctx_title_types"), {
            type: 'horizontalBar',
            data: {

                labels: labels,
                datasets: [dataset1, dataset2, dataset3]
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
        }))
    }
}()

const createTopDirectorChart = function () {
    const chart = createBarChart($("#ctx1"))
    return function (directors = createDirectorList(), N = 10) {

        let order_primary = $('#select_sorting_ctx1').val()
        let order_secondary = order_primary === 'film_cnt' ? 'avg_rating' : 'film_cnt'
        let order = (a, b) => (b[order_primary] * 1000 + b[order_secondary]) - (a[order_primary] * 1000 + a[order_secondary])
        let top_10 = directors.sort(order).slice(0, N)

        let dataset1 = {
            backgroundColor: COLOR_CNT,
            label: '# of films',
            data: top_10.map(entry => entry.film_cnt)
        }
        let dataset2 = {
            backgroundColor: COLOR_AVG,
            label: 'average rating',
            data: top_10.map(entry => entry.avg_rating)
        }
        let dataset3 = {
            backgroundColor: COLOR_SCORE,
            label: 'score',
            data: top_10.map(entry => entry.score)
        }

        let labels = top_10.map(dirstat => dirstat.name)

        chart(labels, [dataset3, dataset1, dataset2])
    }
}()

const createDirectorRatingDiffChart = function () {
    const rating_diff_chart = createChartHolder()
    let enlarged = true
    return function (large = !enlarged, directors = createDirectorList()) {
        enlarged = large

        const N_delta = large ? 10 : 5

        $('#button-ambiguous').text(large ? "less ..." : "more ...")
        $('#chart-ambiguous').height(large ? 550 : 300).html(large
            ? '<canvas id="ctx1b" width="800" height="550"></canvas>'
            : '<canvas id="ctx1b" width="800" height="300"></canvas>'
        )

        let top_diff = directors.sort((a, b) => b.variance - a.variance).slice(0, N_delta).map(x => ({
            name: x.name,
            delta: x.diff,
            mu: x.avg_rating,
            sigma_square: x.variance,
            films: Object.entries(groupBy(getter('your_rating'))(x.films)).sort((a, b) => b[0] - a[0]).map(entry => ({
                your_rating: entry[0],
                title: entry[1].map(film => film.title).join(', '),
                film_cnt: entry[1].length
            }))
        }))

        let datasets = top_diff.map(elem => {
            let sizes = elem.films.map(film => 6.0 + film.film_cnt * 3.0)
            return {
                //label: elem.director.name,
                data: elem.films.map(film => ({ x: film.your_rating, y: elem.name, title: film.title })),
                fill: false,
                borderColor: COLOR_RATING,
                backgroundColor: COLOR_RATING,
                pointStyle: 'rectRounded',
                pointRadius: sizes,
                pointHoverRadius: sizes,
                pointHitRadius: sizes
            }
        }).concat([{
            //label: elem.director.name,
            data: top_diff.map(elem => ({ x: elem.mu, y: elem.name, title: elem.name + ' (μ = ' + elem.mu + ', δ = ' + elem.delta + ', σ^2 = ' + elem.sigma_square + ')' })),
            fill: false,
            showLine: false,
            borderColor: COLOR_AVG,
            backgroundColor: COLOR_AVG,
            pointStyle: 'star',
            pointRadius: 10.0,
            pointHoverRadius: 10.0,
            pointHitRadius: 10.0
        }])

        // console.log(datasets)

        rating_diff_chart(new Chart($("#ctx1b"), {
            type: 'line',
            data: {
                yLabels: ["", ...top_diff.map(x => x.name), ""],
                datasets: datasets
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
        }))
    }
}()

const displayDirectorStats = function () {
    const time_chart = createChartHolder()
    const avg_rating_diff_chart = createBarChart($("#ctx1d"))
    return function (films, N = 10) {
        let directors = createDirectorList(films)


        createTopDirectorChart(directors)

        createDirectorRatingDiffChart(false, directors)

        let l = directors.sort((a, b) => b.film_cnt * 1000 - a.film_cnt * 1000 + b.avg_rating - a.avg_rating).slice(0, 16)


        let datasets_chrono = zip([[...l.keys()], l, STD_COLORS]).map(([rank, director, color]) => {
            let films_by_year = groupBy (getter('year')) (director.films)
            let data = []
            let sizes = []
            for (let year of Object.keys(films_by_year)) {
                let films = films_by_year[year].sort((a,b) => a.your_rating - b.your_rating)
                data.push({x:year, y: avg(films, getter('your_rating')), title: films.map(f => f.title + ' ('+ f.your_rating+')').join(', ')})
                sizes.push(6.0 + 3.0 * films.length)
            }
            return {
                label: director.name,
                hidden: rank > 3,
                data: data,
                fill: false,
                borderColor: color,
                backgroundColor: color,
                pointStyle: 'rectRounded',
                pointRadius: sizes,
                pointHoverRadius: sizes,
                pointHitRadius: sizes
            }
        })

        time_chart(new Chart($("#ctx1c"), {
            type: 'line',
            data: {
                datasets: datasets_chrono
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
        }))

        directors.sort(comparator('avg_rating_diff')).reverse()

        const N_sigma = 6

        let directors_sorted_by_avg_rating_diff = directors.length > N_sigma * 2
            ? [...directors.slice(0, N_sigma), { name: '...', avg_rating_diff: 0 }, ...directors.slice(-N_sigma)]
            : directors

        let dataset = {
            backgroundColor: directors_sorted_by_avg_rating_diff.map(getter('avg_rating_diff')).map(val => val > 0 ? COLOR_POS : COLOR_NEG),
            label: 'δ',
            data: directors_sorted_by_avg_rating_diff.map(getter('avg_rating_diff'))
        }

        let labels = directors_sorted_by_avg_rating_diff.map(getter('name'))

        avg_rating_diff_chart(labels, [dataset])
    }
}()

const displayRatingYearStats = function()  {
    const chart = createVerticalBarChart($("#ctxy"), true)

    return function(films) {
        let years = {}
        for (let film of films) {
            year = film['date_rated'].substring(0,4)
            if(years[year]) {
                years[year].push(film)
            } else {
                years[year] = [film]
            }
        }

        labels = Object.keys(years).sort()
        let dataset1 = {
            backgroundColor: COLOR_CNT,
            label: '# of films',
            data: labels.map(label => years[label].length)
        }
        let dataset2 = {
            backgroundColor: COLOR_AVG,
            label: 'average rating',
            data: labels.map(label => round(avg(years[label], getter('your_rating')), 1))
        }

        chart(labels, [dataset1, dataset2])
    }
}()

const displayDecadeStats = function () {
    const bar_chart = createChartHolder()
    const bar_chart_diff = createChartHolder()
    return function (films) {
        let decades = createDecadeList(films)

        const factory = createStatObjFactory()
        let _decades = Object.keys(decades).sort().map(decade => factory(decade, decades[decade]))

      //  console.log(_decades)

        let dataset1 = {
            backgroundColor: "blue",
            label: '# of films',
            yAxisID: 'A',
            data: [],
        }

        let dataset2 = {
            backgroundColor: "red",
            label: 'average Rating',
            yAxisID: 'B',
            data: [],
        }

        for (let key of Object.keys(decades).sort()) {
            dataset1.data.push(decades[key].length)
            dataset2.data.push(+avg(decades[key], getter("your_rating")).toFixed(1))
        }

        bar_chart(new Chart($("#ctx2"), {
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
        }))

        let diffs = _decades.map(getter('avg_rating_diff'))

        bar_chart_diff(new Chart($("#ctx2b"), {
            type: 'bar',
            data: {
                labels: Object.keys(decades).sort(),
                datasets: [{
                    backgroundColor: diffs.map(val => val > 0 ? COLOR_POS : COLOR_NEG),
                    label: 'diff',
                    data: diffs,
                }]
            },
            options: {
                legend: {
                    display: false
                }
            }
        }))
    }
}()

const scatterRuntime = function () {
    const chart = createChartHolder()
    return films => {

        films = films.filter(film => film.runtime_mins && film.runtime_mins.match(/\d+/))

        let films_by_title_type = groupBy(getter('title_type'))(films)

        let datasets = Object.entries(films_by_title_type).map(([title_type, films]) => ({
            hidden: false,
            label: title_type,
            data: films.map(film => ({ x: film.runtime_mins, y: film.your_rating })),
            pointStyle: 'rectRounded',
            pointRadius: 7.0,
            pointHoverRadius: 7.0,
            pointHitRadius: 7.0
        }))

        datasets.sort((a, b) => b.data.length - a.data.length)

        for (let i in datasets) {
            datasets[i].backgroundColor = STD_COLORS[i]
        }

        let labels = datasets.map(dataset => films_by_title_type[dataset.label]).map(films=> films.map(getter('title')))

  


        let avg_len = Object.entries(groupBy(getter('your_rating'))(films)).map(([rating, films]) => ({
            y: rating,
            x: avg(films, getter('runtime_mins'))
        }))

        datasets.push({
            backgroundColor: COLOR_AVG,
            borderColor: COLOR_AVG,
            label: 'avg',
            pointStyle: 'star',
            pointRadius: 10.0,
            pointHoverRadius: 10.0,
            pointHitRadius: 10.0,
            data: avg_len
        })


        chart(new Chart($("#ctx3"), {
            type: 'scatter',
            data: {
                datasets: datasets
            },
            options: {
                scales: {
                    xAxes: [{
                        type: 'linear',
                        position: 'bottom',
                        scaleLabel: {
                            display: true,
                            labelString: 't [min]'
                        }
                    }],
                    yAxes: [{
                        type: 'linear',
                        position: 'left',
                        scaleLabel: {
                            display: true,
                            labelString: 'rating'
                        }
                    }]
                },
                tooltips: {
                    callbacks: {
                        label: function (tooltipItem, data) {
                            if (tooltipItem.datasetIndex == data.datasets.length - 1)
                                return "average runtime for rating " + tooltipItem.yLabel + ": " + round(tooltipItem.xLabel) + 'mins'
                            var label = labels[tooltipItem.datasetIndex][tooltipItem.index];
                            return label + ' (' + tooltipItem.xLabel + 'mins, rating:' + tooltipItem.yLabel + ')';
                        }
                    }
                }
            }
        }))
    }
}()

function displayGenreTopList(genres = createGenreList(), N = 10) {
    const select = $("#select_sorting_genre_top_list")
    let genre = select.val()
    for (let elem of genres) {
        if (elem.name === genre) {
            genre = elem
            break
        }
    }

    if (!genre.films)
        return

    const genre_top_list = $("#genre_top_list")
    genre_top_list.empty()

    let films = genre.films.sort(comparator("your_rating", "desc")).slice(0, N)

    for (let film of films) {
        genre_top_list.append("<tr>" +
            "<td style='color:#"+ (10-film.your_rating) + "0" + (film.your_rating - 1) + "000'><b>" + film.your_rating + "</b></td>" + 
            "<td>" + film.title + "</td>" +
            "<td>" + film.directors + "</td>" +
            "<td>" + film.year + "</td>" +
            "</tr>")
    }
}

function displayGenreStats(films) {
    const genres = createGenreList(films)

    const select = $("#select_sorting_genre_top_list")
    for (let genre of genres.map(getter("name")).sort()) {
        select.append('<option value="' + genre + '">' + genre + '</option>')
    }

    displayGenreTopList(genres)
}

const displayCoutryStatsAsync = function () {
    const pie_chart = createChartHolder()
    const bar_chart_cnt = createBarChart($("#ctx4b"))
    const bar_chart_avg = createBarChart($("#ctx4c"))
    return function (films) {
        loadCountryData(data => {
                loadISOCountryCodes(iso_codes => {
                let map = parseMapfromCsv(data)

                let country_iso3_codes = {}
                let country_names = {}

                for (let row of iso_codes.split (/\r?\n/)) {
                    let [iso2, iso3, name] = row.split(';')
                    country_iso3_codes[iso2] = iso3
                    country_names[iso2] = name
                }

                console.log(country_names)

                let countries = createCountryList(films, map, country_iso3_codes, country_names)

                console.log(countries)

            //    let factory = createStatObjFactory();

                for (let country of countries) {
                    if (!country.films) {
                        console.log("Country has no films: " + country.name)
                        continue
                    }
                    country.film_cnt = country.films_excl_coprod.length
                    country.avg_rating = +avg(country.films, getter("your_rating")).toFixed(1)
                }

                countries.sort((a, b) => b.film_cnt - a.film_cnt)

                let N_1 = 12
                N_1 = countries.length > N_1 ? N_1 : countries.length
                for (let i = 0; i < N_1; i++) {
                    if (countries[i].film_cnt <= 1) {
                        N_1 = i
                        break
                    }
                }

                let country_sample = [...countries.slice(0, N_1), { name: COUNTRY_OTHER, film_cnt: sum(countries.slice(N_1), getter("film_cnt")) }]
                let color_sample = emitter(STD_COLORS)

                let dataset_cnt = {
                    backgroundColor: country_sample.map((country, i) =>
                        country.name === COUNTRY_COPRODUCTION ? COLOR_COPROD : country.name === COUNTRY_OTHER ? COLOR_OTHER : color_sample()),
                    label: '# of Films',
                    data: country_sample.map(getter("film_cnt"))
                }

                pie_chart(new Chart($("#ctx4"), {
                    type: 'doughnut',
                    data: {
                        labels: country_sample.map(getter('name')),
                        datasets: [dataset_cnt]
                    },
                    options: {
                        legend: {
                            position: "right"
                        }
                    }
                }))

                const N_2 = 15

                let top_countries = countries.filter(country => country.name !== COUNTRY_COPRODUCTION).sort((a, b) => b.films.length - a.films.length).slice(0, N_2)

                let dataset_excl_coprod = {
                    backgroundColor: "#000030",
                    label: '# of domestic films',
                    data: [...top_countries.map(entry => entry.film_cnt), sum(countries.slice(N_2), getter("film_cnt"))]
                }

                let dataset_coprod_main = {
                    backgroundColor: "#4444ff",
                    label: '# of coproductions (main)',
                    data: [...top_countries.map(entry => entry.films_main.length - entry.film_cnt), sum(countries.slice(N_2), getter("film_cnt"))]
                }

                let dataset_coprod = {
                    backgroundColor: "#aaaaff",
                    label: '# of coproductions (minor)',
                    data: [...top_countries.map(entry => entry.films.length - entry.films_main.length), sum(countries.slice(N_2), getter("film_cnt"))]
                }

                bar_chart_cnt(top_countries.map(entry => entry.name), [dataset_excl_coprod, dataset_coprod_main, dataset_coprod], false, true)

                const N_3 = 8
                let countries_by_avg_rating = countries.filter(country => country.films.length >= 3).sort((a, b) => b.avg_rating - a.avg_rating)
                if (countries_by_avg_rating.length > N_3 * 2 + 1)
                    countries_by_avg_rating = [...countries_by_avg_rating.slice(0, N_3), { name: '...', avg_rating: 1 }, ...countries_by_avg_rating.slice(-N_3)]

                let dataset_avg = {
                    backgroundColor: COLOR_AVG,
                    label: 'average rating',
                    data: countries_by_avg_rating.map(entry => entry.avg_rating)
                }
                bar_chart_avg(countries_by_avg_rating.map(entry => entry.name), [dataset_avg], 1)

                createMap(countries)
            })
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

function createBarChart(ctx) {
    const chart = createChartHolder()
    return function (labels, datasets, beginAt = 0, stacked) {
        let options = {
            legend: {
                display: datasets.length > 1
            }
        }
        let ticks = beginAt === false ? {} : { suggestedMin: beginAt }
        if (!stacked && datasets.length === 2) {
            datasets[0].xAxisID = 'A'
            datasets[1].xAxisID = 'B'
            options.scales = {
                xAxes: [{
                    id: 'A',
                    type: 'linear',
                    position: 'top',
                    ticks: ticks
                }, {
                    id: 'B',
                    type: 'linear',
                    position: 'bottom',
                    ticks: ticks
                }]
            }
        } else {
            options.scales = {
                xAxes: [{
                    stacked: stacked,
                    type: 'linear',
                    ticks: ticks
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

function createVerticalBarChart(ctx) {
    const chart = createChartHolder()
    return function (labels, datasets, beginAt = 0, stacked) {
        let options = {
            legend: {
                display: datasets.length > 1
            }
        }
        let ticks = beginAt === false ? {} : { suggestedMin: beginAt }
        if (!stacked && datasets.length === 2) {
            datasets[0].yAxisID = 'A'
            datasets[1].yAxisID = 'B'
            options.scales = {
                yAxes: [{
                    id: 'A',
                    type: 'linear',
                    position: 'left',
                    ticks: ticks
                }, {
                    id: 'B',
                    type: 'linear',
                    position: 'right',
                    ticks: ticks
                }]
            }
        } else {
            options.scales = {
                yAxes: [{
                    stacked: stacked,
                    type: 'linear',
                    ticks: ticks
                }],
                xAxes: [{
                    stacked: stacked
                }]
            }
        }

        chart(new Chart(ctx, {
            type: 'bar',
            data: {
                labels: labels,
                datasets: datasets
            },
            options: options
        }))
    }
}

function createStatObjFactory(AVG_RATING = 5.5) {
    return function (name, films) {
        return Object.freeze(new function () {
            this.name = name
            this.films = films
            this.film_cnt = films.length
            let avg_rating = avg(films, getter("your_rating"))
            this.score = Math.max(round((avg_rating - AVG_RATING) * this.film_cnt, 1), 0)
            this.avg_rating = round(avg_rating, 1)
            this.avg_rating_diff = round(avg_rating - avg(films, getter('imdb_rating')), 1)
            this.variance = round(sum(films, film => Math.pow(film.your_rating - avg_rating, 2)) / films.length, 1)
            this.diff = round(argmax(comparator('your_rating'))(films)[0].your_rating - argmin(comparator('your_rating'))(films)[0].your_rating, 1)
        })
    }
}

const createGenreList = function() {
    let data = []
    return function(films) {
        if (!films)
            return data
        let genres = {}
        for (let film of films) {
            if (film.genres) {
                for (let genre of film.genres.split(/\s*,\s*/)) {
                    (genres[genre] || (genres[genre] = [])).push(film)
                }
            }
        }
        const factory = createStatObjFactory()
        return data = Object.entries(genres).map(entry => factory(...entry))
    }
}() 

const createDirectorList = function () {
    let data = []
    return function (films) {
        if (!films)
            return data
        let directors = {}
        for (let film of films) {
            if (film.directors) {
                let ds = film.directors.split(/\s*,\s*/)
                if (ds.length === 2 && ds.includes('Joel Coen') && ds.includes('Ethan Coen')) {
                    ds = ['Joel + Ethan Coen']
                }
                for (let director of ds) {
                    (directors[director] || (directors[director] = [])).push(film)
                }
            }
        }
        const factory = createStatObjFactory(avg(films, getter('your_rating')))
        return data = Object.entries(directors).filter(([_, films]) => films.length >= 2).map(entry => factory(...entry))
    }
}()

function Country(name, iso2, iso3, films = [], films_excl_coprod = []) {
    this.name = name
    this.iso2 = iso2
    this.iso3 = iso3
    this.films = films
    this.films_excl_coprod = films_excl_coprod
    this.films_main = []
}

function createCountryList(films, map, country_iso3_codes, country_names) {
    let result = {}
    result[COUNTRY_COPRODUCTION] = new Country(COUNTRY_COPRODUCTION)
    for (let film of films) {
        let countries = map[film.const]
        if (countries) {
            countries = countries.split(/,/)
            let first = true
            for (let country of countries) {
                country = country.trim()
                if (result[country]) {
                    result[country].films.push(film)
                } else {
                    result[country] = new Country(country_names[country], country, country_iso3_codes[country], [film])
                }
                if (first) {
                    first = false
                    result[country].films_main.push(film)
                }
            }
            (countries.length === 1 ? result[countries[0]] : result[COUNTRY_COPRODUCTION]).films_excl_coprod.push(film)
        }
    }
    return valList(result)
}



function decade(year) {
    let dec = year.match(/(\d\d\d)\d/)
    if (dec)
        return dec[1] + "0s"
    else throw "Not a valid year: " + year
}

function createDecadeList(data) {
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
            console.log(e + " " + film.title)
        }
    }
    return decades
}

