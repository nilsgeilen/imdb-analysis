const getCountryCode = function () {
    const codes = { 'UK': 'GBR' }
    for (const country of Datamap.prototype.worldTopo.objects.world.geometries) {
        codes[country.properties.name] = country.id;
        codes[country.id] = country.id
    }
    return country => codes[country]
}()

function createMap(countries) {

    const highlight = str => '<b>' + str + '</b>'
    const colorize = color => str => '<font color="' + color + '">' + str + '</font>'

    const series_cnt = [], series_avg = [];


    for (const country of countries) {
        let tooltip = highlight("# of domestic films: " + colorize(COLOR_CNT)(country.film_cnt)
            + "<br># of coproductions: " + colorize(COLOR_CNT)(country.films.length - country.film_cnt)
            + "<br>⌀ rating: " + colorize(COLOR_AVG)(country.avg_rating))
        const top = argmax(comparator("your_rating"))(country.films)
        if (top.length && top[0].your_rating > 5.5)
            tooltip += highlight("<br>top: ") + top.map(getter('title')).join(', ')
        const flop = argmin(comparator("your_rating"))(country.films)
        if (flop.length && flop[0].your_rating < 5.5)
            tooltip += highlight("<br>flop: ") + flop.map(getter('title')).join(', ')
        series_cnt.push(createCountryData(getCountryCode(country.name), Math.log10(country.films.length + 1), tooltip))
        series_avg.push(createCountryData(getCountryCode(country.name), country.avg_rating, tooltip))
    }

    paintWorldMap($('#map_cnt'), series_cnt, COLOR_CNT)

    paintWorldMap($('#map_avg'), series_avg, COLOR_AVG)
}

function createCountryData(name, val, tooltip) {
    return Object.seal({ name, val, tooltip })
}

function paintWorldMap(ctx, series, color) {
    ctx.empty()

    const dataset = {}

    const vals = series.map(getter('val'))

    const paletteScale = d3.scale.linear()
        .domain([Math.min(...vals), Math.max(...vals)])
        .range(["#EFEFFF", color])

    for (const item of series) {
        dataset[item.name] = { tooltip: item.tooltip, fillColor: paletteScale(item.val) }
    }

    new Datamap({
        element: ctx[0],
        projection: 'mercator',
        geographyConfig: {
            borderColor: '#DEDEDE',
            highlightBorderWidth: 2,
            highlightFillColor: function (geo) {
                return geo['fillColor'] || '#F5F5F5';
            },
            highlightBorderColor: '#B7B7B7',
            popupTemplate: (geo, data) => data 
                ? '<div class="hoverinfo">' + '<strong>' + geo.properties.name + '</strong>' + '<br>' + data.tooltip + '</div>'
                : null

        },
        fills: { defaultFill: '#F5F5F5' },
        data: dataset
    })
}
