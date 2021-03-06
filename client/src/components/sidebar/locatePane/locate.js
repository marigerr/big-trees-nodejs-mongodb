//import $ from 'jquery';
import makeAjaxCall from 'Data/makeAjaxCall.js';
import lanstyrDefault from 'Data/lanstyrDefault.js';
import { map, sidebar } from 'Map/map.js';
import { getPoints, getPointsSuccess } from 'Data/getPoints.js';
import { buildTable, addRowClickHandler } from 'Sidebar/createTable.js';
import { isMobile } from 'App/app.js';

var locationMarker;

function findLocationWithNavigator() {
    console.log("findLocationWithNavigator");

    var options = {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0
    };
    if (navigator.geolocation) {
        removeLocationMarker();
        navigator.geolocation.getCurrentPosition(function (pos) { navLocatesuccess(pos); }, function (err) { navLocateerror(err); }, options);
    } else {
        findLocationWithGoogleGeolocation();
    }
}

function navLocatesuccess(pos) {
    var crd = pos.coords;
    var mapViewPoint = L.latLng(crd.latitude, crd.longitude);
    if (isMobile) {
        sidebar.close();
        console.log(isMobile);
    }
    var searchEnvelope = getSearchArea(crd.latitude, crd.longitude);
    findNearTrees(searchEnvelope, mapViewPoint);
    createLocationMarker(crd.latitude, crd.longitude, crd.accuracy);
}

function navLocateerror(err) {
    console.warn(`navigator.geolocation error(${err.code}): ${err.message}`);
    findLocationWithGoogleGeolocation();
}

function findLocationWithGoogleGeolocation() {
    removeLocationMarker();
    console.log("google geolocation called");
    var url = "https://www.googleapis.com/geolocation/v1/geolocate?key=AIzaSyALDj8UcNZ1fQlXcoMlJ84lSavkcyODExI";
    var type = "POST";
    var data;
    var datatype = "json";
    var async = true;
    var success = function (response) {
        //console.log(response);
        var lat = response.location.lat;
        var lng = response.location.lng;
        createLocationMarker(lat, lng, response.accuracy);
        //console.log("Accuracy: " + response.accuracy + " meters");
        var mapViewPoint = L.latLng(lat, lng);

        var searchEnvelope = getSearchArea(lat, lng);
        findNearTrees(searchEnvelope, mapViewPoint);
        if (isMobile) {
            sidebar.close();
            console.log(isMobile);
            
        }
    };
    var error = function (xhr) {
        console.log(xhr.statusText);
    };

    makeAjaxCall(url, data, type, datatype, async, success, error);
}

function getSearchArea(lat, lng) {
    // use leaflet toBounds  toBounds(<Number> sizeInMeters)	LatLngBounds	
    //Returns a new LatLngBounds object in which each boundary is sizeInMeters/2 meters apart from the LatLng.
    return L.latLng(lat, lng).toBounds(4000).toBBoxString(); // search area 4000 meters
}

function findNearTrees(searchEnvelope, mapViewPoint, keepZoomLevel) {
    var defaults = lanstyrDefault();
    var success;
    if (mapViewPoint) {
        success = function (response) {
            getPointsSuccess(response, mapViewPoint, 16);
            buildTable(".tree-table", response, true);
            addRowClickHandler();
        };
    } else {
        success = function (response) {
            getPointsSuccess(response, null, null, keepZoomLevel);
            buildTable(".tree-table", response, true);
            addRowClickHandler();
        };
    }
    var data = defaults.data;
    data.where = '';
    data.geometry = JSON.stringify(searchEnvelope);
    data.outSR = 4326;
    data.inSR = 4326;
    data.spatialRel = 'esriSpatialRelContains';
    makeAjaxCall(defaults.url, data, defaults.type, defaults.datatyp, defaults.async, success, defaults.error);
}

function removeLocationMarker() {
    if (locationMarker) {
        locationMarker.remove();
    }
}

function createLocationMarker(lat, lng, accuracy) {
    locationMarker = L.marker([lat, lng]).addTo(map);
    var popupContent = "";
    popupContent += "Your location" + "</br>";
    popupContent += "Accuracy: " + Math.round(accuracy) + " meters</br>";
    locationMarker.bindPopup(popupContent, { autoPanPaddingTopLeft: [65, 5], autoPanPaddingBottomRight: [45, 5] }); //.openPopup();
}

function searchVisibleMap() {
    $("table").empty();
    $(".tableBtns").hide();
    var bounds = map.getBounds().toBBoxString();
    findNearTrees(bounds, null, true);
}

export { removeLocationMarker, findLocationWithGoogleGeolocation, findLocationWithNavigator, searchVisibleMap };