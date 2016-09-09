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

function parseData(data, prob) {
    r = [];
    for (i = 0; i < data.length; i++) {
        r.push({
            mode: 'markers',
            x: [data[i].construction],
            y: [data[i].growth],
            marker: {
                sizemode: 'area',
                size: [prob[data[i].LAD14CD].construction*1000],
                sizeref: '2'
            }
        });
    }
    return r;
}


function analyze(error, business_data, complexity, prod_complexity, prob) {
    if (error) {
        console.log(error);
    }

    complexity.forEach(function(d) {
        d.value = +d.value;
    });

    business_data.forEach(function(d) {
        d.growth = +d.growth;
        d.construction = +d.construction;
        d.manufacture_advanced = +d.manufacture_advanced;
        d.manufacture_agrochemical = +d.manufacture_agrochemical;
        d.manufacture_automotive = +d.manufacture_automotive;
        d.manufacture_chemical_pharma = +d.manufacture_chemical_pharma;
        d.manufacture_construction = +d.manufacture_construction;
        d.manufacture_electrical = +d.manufacture_electrical;
        d.manufacture_food = +d.manufacture_food;
        d.manufacture_food_2 = +d.manufacture_food_2;
        d.manufacture_footwear_leather = +d.manufacture_footwear_leather;
        d.manufacture_furniture = +d.manufacture_furniture;
        d.manufacture_light_misc = +d.manufacture_light_misc;
        d.manufacture_machinery = +d.manufacture_machinery;
        d.manufacture_metallurgy = +d.manufacture_metallurgy;
        d.manufacture_metallurgy_misc = +d.manufacture_metallurgy;
        d.manufacture_metallurgy_tools = +d.manufacture_metallurgy_tools;
        d.manufacture_optics = +d.manufacture_optics;
        d.manufacture_paper = +d.manufacture_paper;
        d.manufacture_plastic = +d.manufacture_plastic;
        d.manufacture_rubber = +d.manufacture_rubber;
        d.manufacture_shipbuilding = +d.manufacture_shipbuilding;
        d.manufacture_textiles = +d.manufacture_textiles;
        d.manufacturing_aerospace = +d.manufacturing_aerospace;
        d.manufacturing_misc = +d.manufacturing_misc;
        d.mining_mining = +d.mining_mining;
        d.mining_oil_gas = +d.mining_oil_gas;
        d.primary_farming = +d.primary_farming;
        d.primary_fishing = +d.primary_fishing;
        d.primary_forestry = +d.primary_forestry;
        d.primary_livestock = +d.primary_livestock;
        d.services_agriculture_rural = +d.services_agriculture_rural;
        d.services_automotive = +d.services_automotive;
        d.services_business_support = +d.services_business_support;
        d.services_cleaning_facilities = +d.services_cleaning_facilities;
        d.services_computing = +d.services_computing;
        d.services_consumer_retail = +d.services_consumer_retail;
        d.services_creative = +d.services_creative;
        d.services_creative_content = +d.services_creative_content;
        d.services_cultural = +d.services_cultural;
        d.services_education = +d.services_education;
        d.services_energy = +d.services_energy;
        d.services_finance_insurance = +d.services_finance_insurance;
        d.services_finance_real_state = +d.services_finance_real_state;
        d.services_freight_transport = +d.services_freight_transport;
        d.services_head_offices = +d.services_head_offices;
        d.services_health = +d.services_health;
        d.services_human_resources = +d.services_human_resources;
        d.services_kibs = +d.services_kibs;
        d.services_leisure = +d.services_leisure;
        d.services_professional_public = +d.services_professional_public;
        d.services_publishing = +d.services_publishing;
        d.services_r_and_d = +d.services_r_and_d;
        d.services_real_estate = +d.services_real_estate;
        d.services_repair_transport = +d.services_repair_transport;
        d.services_residential_social_work = +d.services_residential_social_work;
        d.services_retail_misc = +d.services_retail_misc;
        d.services_technical_engineering = +d.services_technical_engineering;
        d.services_telecommunications = +d.services_telecommunications;
        d.services_transport_storage = +d.services_transport_storage;
        d.services_travelling_tourism = +d.services_travelling_tourism;
        d.services_urban_transport = +d.services_urban_transport;
        d.services_waste_recycling = +d.services_waste_recycling;
        d.wholesale_repair_machinery = +d.wholesale_repair_machinery;
        d.wholesale_retail_misc = +d.wholesale_retail_misc;
    });

        var data = parseData(business_data, prob)

        var layout = {
            showlegend: false,
            xaxis: {
                title: 'Business Growth 2011 - 2015',
                style: 'log'
            },
            yaxis: {
                title: 'Predicted Business Growth',
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
    .defer(d3.csv, "/data/business_data.csv")
    .defer(d3.csv, "/data/lad_complexity.csv")
    .defer(d3.json, "/data/product_complexity_2015.json")
    .defer(d3.json, "/data/probabilities.json")
    .await();
