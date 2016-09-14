/* Custom topojson class courtesy of Ryan Clark */
L.TopoJSON = L.GeoJSON.extend({
    addData: function(jsonData) {
        if (jsonData.type === "Topology") {
            for (var key in jsonData.objects) {
                geojson = topojson.feature(jsonData, jsonData.objects[key]);
                L.GeoJSON.prototype.addData.call(this, geojson);
            }
        } else {
            L.GeoJSON.prototype.addData.call(this, jsonData);
        }
    }
});

function initMap() {
    map.setView([51.5, -0.5], 8);
    mapLink = '<a href="http://openstreetmap.org">OpenStreetMap</a>';
    // load a tile layer
    L.tileLayer('https://cartodb-basemaps-{s}.global.ssl.fastly.net/light_all/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="http://cartodb.com/attributions">CartoDB</a>, CartoDB <a href ="http://cartodb.com/attributions">attributions</a>',
        maxZoom: 20,
        minZoom: 0
    }).addTo(map);
    $.getJSON('./data/topo_lad.json')
        .done(addTopoData);
}

function recenter() {
    map.fitBounds(topoLayer.getBounds());
}

function loadData() {
    $.ajax({
        url: "./data/lad_complexity.json",
        dataType: 'json'
    }).done(function(data) {
        complexityData = data;
        initMap();
    });
}

function addTopoData(data) {
    topoLayer.addData(data);
    topoLayer.addTo(map);
    topoLayer.eachLayer(handleLayer);
}

function handleLayer(layer) {
    var complexity = complexityData[layer.feature.id].value;
    layer.feature.properties.complexity = complexity;
    layer.setStyle({
        fillColor: colorScale(complexity).hex(),
        fillOpacity: 0.6,
        weight: 0.5,
        opacity: 1,
        color: 'white',
        dashArray: '1',
        smoothFactor: 0.5
    });

    layer.on({
        mouseover: enterLayer,
        mouseout: leaveLayer,

    });
}

function enterLayer() {
    this.bringToFront();
    this.setStyle({
        weight: 3,
        opacity: 1,
        fillOpacity: 1,
        color: '#666666'
    });
    info.update(this.feature.properties);
}

function leaveLayer() {
    this.bringToBack();
    this.setStyle({
        weight: 1,
        opacity: 0.5,
        fillOpacity: 0.7,
        color: 'white'
    });
}

// Initialise global map and layer variables
var map = new L.map('map');
var topoLayer = new L.TopoJSON();
var colorScale = chroma
    .scale(chroma.brewer.YlOrRd)
    .domain([-2.1227372118474177, 2.397453389303414]);

// Information control
var info = L.control();

info.onAdd = function (map) {
    this._div = L.DomUtil.create('div', 'info'); // create a div with a class "info"
    this.update();
    return this._div;
};

// method that we will use to update the control based on feature properties passed
info.update = function (props) {
    this._div.innerHTML = '<h4>Local Authority Complexity</h4>' +  (props ?
        '<b>' + props.LAD13NM + '</b><br />' + props.complexity
        : 'Hover over a Local Authority Area');
};

info.addTo(map);

/* Dynamic resizing */
$(window).on("resize", function() {
    var h = $(window).height();
    $("#map").height(h - (h * 0.2));
    map.invalidateSize();
}).trigger("resize");

loadData();

/*--------------------------------------------------------------*/
/* Charts */

var chart;

function currentSelectedIndustry() {
    return $("#indList").val();
}

function parseData(n_businesses_data, prob, prod_complexity, growth_data) {
    var marker_data = [];
    var x = [];
    var y = [];
    var color = [];
    var text = [];
    var size = [];
    for (var key in n_businesses_data.S12000033) {
        if (key !== "growth" && key !== "LAD14NM") {
            var n_businesses = n_businesses_data.S12000033[key];
            var probability = prob.S12000033[key];
            var complexity_value = prod_complexity[key].score;
            var growth_value = growth_data.S12000033[key];
            x.push(growth_value);
            y.push(probability);
            color.push(complexity_value);
            text.push('Industry:&nbsp;' + '<b>' + key + '</b><br>' +
                'Number of businesses:&nbsp;' + n_businesses + '<br>' +
                'Probability of growth in industry in area:&nbsp;' +
                probability + '<br>' + 'Product Complexity:&nbsp;' + complexity_value + '<br>' +
                'Business growth 2010 - 2015:&nbsp;' + growth_value);
            size.push(n_businesses);
        }
    }

    marker_data = [{
        x: x,
        y: y,
        mode: 'markers',
        marker: {
            sizemode: 'area',
            size: size,
            sizeref: '2em',
            colorscale: 'YlOrRd',
            cmin: -2.5,
            cmax: 2.5,
            color: color,
            colorbar: {
                titleside: 'right',
                outlinecolor: 'rgba(68,68,68,0)',
                ticks: 'none',
                ticklen: 0,
                tickfont: 'Arial',
                fontsize: 4
            }
        },
        text: text,
        hoverinfo: 'text'
    }];
    return marker_data;
}

function analyze(error, num_businesses, prod_complexity, prob, growth) {
    if (error) {
        console.log(error);
    }

    var data = parseData(num_businesses, prob, prod_complexity, growth);

    var layout = {
        showlegend: false,
        xaxis: {
            title: 'Sector Growth 2011 - 2015',
            autorange: true,
            zeroline: false,
            dtick: 0.5,
        },
        yaxis: {
            title: 'Probability of Growth in Sector in Area in 2016',
            zeroline: false,
            dtick: 0.1
        },
        margin: {
            t: 10
        },
        hovermode: 'closest',
    };
    Plotly.newPlot('chart', data, layout, {
        showLink: false
    });
}

queue()
    .defer(d3.json, "/data/business_data.json")
    .defer(d3.json, "/data/product_complexity_2015.json")
    .defer(d3.json, "/data/probabilities.json")
    .defer(d3.json, "/data/business_growth_2010_2015.json")
    .await(analyze);
