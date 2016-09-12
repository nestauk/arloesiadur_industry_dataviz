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
    var fillColor = colorScale(complexityData[layer.feature.id].value).hex();
    layer.setStyle({
        fillColor: fillColor,
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

function parseData(data, prob, prod_complexity) {
    var marker_data = [];
    var x = [];
    var y = [];
    var color = [];
    var text = [];
    for (var key in data.S12000033) {
        if (key !== "growth" && key !== "LAD14NM") {
            var number = data.S12000033[key];
            var probability = prob.S12000033[key];
            var color_value = prod_complexity[key].score;
            x.push(number);
            y.push(probability);
            color.push(color_value);
            text.push('Industry:&nbsp;' + '<b>' + key + '</b><br>' +
                      'Number of businesses:&nbsp;' + number + '<br>' +
                      'Probability of growth in industry in area:&nbsp;' +
                      probability + '<br>' + 'Product Complexity:&nbsp;' + color_value);
        }
    }
    marker_data = [{
        x: x,
        y: y,
        mode: 'markers',
        marker: {
            sizemode: 'area',
            size: 20,
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

function analyze(error, business_data, prod_complexity, prob) {
    if (error) {
        console.log(error);
    }

    var data = parseData(business_data, prob, prod_complexity);

    var layout = {
        showlegend: false,
        xaxis: {
            title: 'Number of Businesses - 2015',
            type: 'log',
            autorange: true
        },
        yaxis: {
            title: 'Probability of Growth in Sector in Area',
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
    .await(analyze);
