var areas = [];
var selectedArea;

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
}

function selectLayer(layer) {
    layer.bringToFront();
    layer.setStyle({
        weight: 5,
        opacity: 1,
        color: 'grey'
    });
    info.update(layer.feature.properties);
}

function deselectLayer(layer) {
    layer.bringToBack();
    layer.setStyle({
        weight: 1,
        opacity: 0.5,
        fillOpacity: 0.7,
        color: 'white'
    });
}

//function called when the selected area is changed
function areaChanged() {
    if (selectedArea === undefined) {
        //get the selected area name
        selectedArea = $("#areas").val();
    } else {
        var deselectId = reverseLookup[selectedArea].LAD14CD;
        topoLayer.eachLayer(function(layer) {
            if (layer.feature.id == deselectId) {
                deselectLayer(layer);
            }
        });
    }
    selectedArea = $("#areas").val();
    var id = reverseLookup[selectedArea].LAD14CD;
    topoLayer.eachLayer(function(layer) {
        if (layer.feature.id == id) {
            selectLayer(layer);
            map.fitBounds(layer.getBounds());
        }
    });
}

function parseData(n_businesses_data, prob, prod_complexity, growth_data) {
    var marker_data = [];
    var x = [];
    var y = [];
    var color = [];
    var text = [];
    var size = [];
    var id = $("areas").val() ? $("areas").val() === undefined : "E09000001";
    console.log(id);
    for (var key in n_businesses_data[id]) {
        if (key !== "growth" && key !== "LAD14NM") {
            var n_businesses = n_businesses_data[id][key];
            var probability = prob[id][key];
            var complexity_value = prod_complexity[key].score;
            var growth_value = growth_data[id][key];
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

function analyze() {
    var data = parseData(
        business_data,
        probabilities,
        product_complexity,
        business_growth
    );

    var layout = {
        showlegend: false,
        autosize: true,
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

// Initialise global map and layer variables
var map = new L.map('map');
var topoLayer = new L.TopoJSON();
var colorScale = chroma
    .scale(chroma.brewer.YlOrRd)
    .domain([-2.1227372118474177, 2.397453389303414]);

// Information control
var info = L.control();

info.onAdd = function(map) {
    this._div = L.DomUtil.create('div', 'info'); // create a div with a class "info"
    this.update();
    return this._div;
};

// method that we will use to update the control based on feature properties passed
info.update = function(props) {
    this._div.innerHTML = '<h4>Local Authority Complexity</h4>' + (props ?
        '<b>' + props.LAD13NM + '</b><br />' + props.complexity : 'Hover over a Local Authority Area');
};

info.addTo(map);

// Area Selection Control
//extend the L.Control class to create a custom drop down box
// initially with simple placeholder text
var AreaControl = L.Control.extend({
    initialize: function(name, options) {
        L.Util.setOptions(this, options);
    },
    //function to be called when the control is added to the map
    onAdd: function(map) {
        //create the control container with a css class name
        var container = L.DomUtil.create('div', 'dropdown');
        //jquery method to retrieve JSON object
        $.getJSON("data/LAD_2014_UK_NC.json",
            function(data) {
                //create the htmlString that will form the
                //innerHTML of the forces dropdown
                var htmlString = '<select id=areas ' +
                    'onchange="areaChanged()">';
                //create individual area <option> tags within the
                //<select> tag
                $.each(data, function(i, item) {
                    areas[i] = item;
                    htmlString = htmlString + '<option>' +
                        areas[i].LAD14NM + '</option>';
                });

                //close the select tag
                htmlString += '</select>';

                //update the dropdown list innerHTML
                //with the list of forces
                container.innerHTML = htmlString;

                //allow a user to select a single option
                container.firstChild.onmousedown =
                    container.firstChild.ondblclick =
                        L.DomEvent.stopPropagation;

            });
        analyze();
        return container;
    }
});

map.addControl(new AreaControl('areas', {
    position: 'topright'
}));


/* Dynamic resizing */
$(window).on("resize", function() {
    var h = $(window).height();
    $("#map").height(h - (h * 0.2));
    map.invalidateSize();
}).trigger("resize");

loadData();
