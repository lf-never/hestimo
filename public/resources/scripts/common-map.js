import * as IndexUtil from '../js/index.js'
var map;
const __TempStorage = {}
var markersLayer = []
var osm;
var satellite;

export function initMapServerHandler() {
    // let osmUrl = 'http://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png';
    // let osmUrl = 'https://gac-geo.googlecnapps.cn/maps/vt?lyrs=m&x={x}&y={y}&z={z}';
    let osmUrl = '../tiles/{z}/{x}/{y}.png';
    // let corner1 = L.latLng(1.50152, 103.45), // left top corner
    //     corner2 = L.latLng(1.12603, 104.1495668), // right bottom corner
    //     bounds = L.latLngBounds(corner1, corner2);
    osm = new L.TileLayer(osmUrl, { minZoom: 6, maxZoom: 24 });

    let satelliteUrl = '../map/{z}/{x}/{y}.png';
    satellite = new L.TileLayer(satelliteUrl, { minZoom: 6, maxZoom: 24 });

    map = new L.map('map', {
        attributionControl: false,
        zoomControl: false,
        contextmenu: true,
        contextmenuWidth: 140,
    }).setView([1.31, 103.799], 12)
        .addLayer(osm);

    map.addControl(L.control.zoom({
        position: 'bottomright'
    }))
    map.on("zoomend", (e) => {
        let zoom = e.target.getZoom()
        let radius = Math.pow(12 / zoom, 1) * 12
        for (let marker of markersLayer) {
            marker.setRadius(radius)
        }
        IndexUtil.unlockMarkerUtil()
    })
}

/**
 * @param title string => use for diff map object, like groupA, groupB or marker, polygon and so on
 * @param object {id, mapObject} => different mapObject has different data
 */
export function addMapObject(title, object) {
    if (!__TempStorage[title]) {
        __TempStorage[title] = [];
    }
    __TempStorage[title].push(object);
}

export function clearMapObject(title) {
    if (__TempStorage[title]) {
        for (let object of __TempStorage[title]) {
            map.removeLayer(object.mapObject);
        }
        delete __TempStorage[title];
    }
}

export function deleteMapObject(title, object) {
    if (__TempStorage[title]) {
        let __findIndex = -1;
        __TempStorage[title].some((__object, index) => {
            if (__object.id === object.id) {
                map.removeLayer(__object.mapObject);
                __findIndex = index;
                return true;
            }
        });
        // find, then delete it
        if (__findIndex > -1) {
            __TempStorage[title].splice(__findIndex, 1);
        }
    }
}

export function updateMapObject(title, object, option, tooltipObj) {
    const durationsTime = 1000;
    if (__TempStorage[title]) {
        let existMapObject = __TempStorage[title].some((__object, index) => {
            if (__object.id === object.id) {
                let fromLatLng = __object.mapObject.getLatLng();
                let toLatLng = object.mapObject.getLatLng();
                // No latlng change, return;
                if (fromLatLng.lat === toLatLng.lat && fromLatLng.lng === toLatLng.lng) return true;
                // 1、remove from map first
                map.removeLayer(__object.mapObject);

                let markerIcon = L.icon({
                    iconUrl: option.iconUrl,
                    iconSize: option.iconSize,
                    iconAnchor: [(option.iconSize[0] / 2).toFixed(), option.iconSize[1]]
                });

                // 2、Show marker moving
                let movingMarker = L.Marker.movingMarker(
                    [[fromLatLng.lat, fromLatLng.lng], [toLatLng.lat, toLatLng.lng]],
                    [durationsTime],
                    { icon: markerIcon })
                if (tooltipObj) {
                    movingMarker.bindTooltip(tooltipObj.content, { direction: 'top', offset: tooltipObj.offset, permanent: true }).openTooltip()
                }
                movingMarker.addTo(map).start();

                // 3、update marker latlng and popup
                if (tooltipObj) {
                    __object.mapObject.setLatLng(toLatLng).bindTooltip(tooltipObj.content, { direction: 'top', offset: tooltipObj.offset, permanent: true })
                } else {
                    __object.mapObject.setLatLng(toLatLng)
                }
                // 4、re-add to map, clean moving marker
                setTimeout(() => {
                    __object.mapObject.addTo(map);
                    if (movingMarker.isEnded()) map.removeLayer(movingMarker);
                }, durationsTime);
                return true;
            }
        });
        if (!existMapObject) {
            console.log('(updateMapObject): new mapObject!')
            addMapObject(title, object);
            object.mapObject.addTo(map);
        }
    } else {
        console.log('(updateMapObject): new title!')
        addMapObject(title, object);
        object.mapObject.addTo(map);
    }
}

export function initMapClickEvent(callBack) {
    map.on('click', (event) => {
        let point = event.latlng;
        console.log(`(Map Click Event): point => ${JSON.stringify(point)}`)
        map.off('click', null);
        callBack(point);
    });
}

export function cancelMapClickEvent() {
    console.log(`(Map Click Event): Cancel... `)
    map.off('click');
}

export function drawCircle(point, color, fillColor) {
    let zoom = map.getZoom()
    let radius = Math.pow(12 / zoom, 1) * 12

    let marker = L.circleMarker([point.lat, point.lng], {
        color: color,
        fillColor: fillColor,
        fillOpacity: 1,
        radius: radius
    });
    return marker;
}



/**
 * @param point { lat: ..., lng: ... }
 * @param option { iconUrl: '', iconSize: [], draggable, drawAble }
 * @returns mapObject
 */
export function drawMarker(point, option) {
    let markerIcon = L.icon({
        iconUrl: option.iconUrl,
        iconSize: option.iconSize,
        iconAnchor: [(option.iconSize[0]) / 2, (option.iconSize[1]) / 2]
    });
    let marker = L.marker([point.lat, point.lng], { ...option, icon: markerIcon });
    // map.fitBounds(marker.getBounds());
    return marker;
}

export function drawMarkerHtml(point, option) {
    let markerIcon = L.divIcon({
        html: option.iconUrl,
        iconSize: option.iconSize,
        iconAnchor: [(option.iconSize[0]) / 2, (option.iconSize[1]) / 2]
    });
    let marker = L.marker([point.lat, point.lng], { ...option, icon: markerIcon });
    // map.fitBounds(marker.getBounds());
    return marker;
}

export function drawMarkerTop(point, option) {
    let markerIcon = L.icon({
        iconUrl: option.iconUrl,
        iconSize: option.iconSize,
        iconAnchor: [(option.iconSize[0]) / 2, option.iconSize[1]]
    });
    let marker = L.marker([point.lat, point.lng], { ...option, icon: markerIcon });
    // map.fitBounds(marker.getBounds());
    return marker;
}

/**
 * @param pointList [{ lat: ..., lng: ... }, ...]
 * @param options { className, color, weight, ... }
 * @returns mapObject
 */
export function drawPolyLine(points, option) {
    let __points = [];
    for (let point of points) {
        __points.push([point.lat, point.lng])
    }
    let polyline = L.polyline(__points, option).addTo(map);
    // map.fitBounds(polyline.getBounds());
    return polyline;
}

/**
 * @param pointList [{lat: ..., lng: ...}, ...]
 * @param options {className, color, weight, ...}
 * @returns mapObject
 */
export function drawPolygon(pointList, options) {
    let __points = [];
    for (let point of pointList) {
        __points.push([point.lat, point.lng])
    }
    let polygon = L.polygon(__points, options).addTo(map);
    // map.fitBounds(polygon.getBounds());
    return polygon;
}

export function bindPopup(mapObject, popupHtml) {
    let popup = L.popup().setContent(popupHtml);
    mapObject.bindPopup(popup).openPopup();;
}

export function bindTooltip(mapObject, tooltipContent, offset) {
    mapObject.bindTooltip(tooltipContent, { direction: 'top', offset, permanent: true }).openTooltip();
}

export function bindLineClickEvent(callBack) {
    polyLine.on('click', function () {
        return callBack();
    });
}

export function resize() {
    map.invalidateSize(true);
}

export function clearClusterTopic(clusterTopic) {
    map.removeLayer(clusterTopic);
    clusterTopic = null;
}

export function createClusterTopic(markerTopic, option) {
    let clusterTopic = L.markerClusterGroup({
        iconCreateFunction: function (cluster) {
            let html = `
                <div style="z-index: 999;padding: 2px 8px; background-color: white; width: ${option ? option.width : '96px'}; border: solid 3px ${option ? option.color : '#40507f'}; border-radius: 20px;">
                    <span style="font-weight: bolder;">${markerTopic}:</span> ${cluster.getChildCount()}
                </div>
            `
            return L.divIcon({ html, className: 'cluster-' + markerTopic, iconSize: L.point(30, 30) });
        },
        disableClusteringAtZoom: 17
    });
    return clusterTopic;
}

export function insertClusterTopic(markerList, clusterTopic) {
    for (let marker of markerList) {
        map.removeLayer(marker);
    }
    for (let marker of markerList) {
        clusterTopic.addLayer(marker);
    }
    clusterTopic.addTo(map);
}

export function removeFromClusterTopic(markerList, clusterTopic) {
    for (let marker of markerList) {
        clusterTopic.removeLayer(marker);
    }
}

export function addLayerGroup(markers) {
    // console.log(markers)
    // map.eachLayer(function (layer) {
    //     let id = layer.id
    //     if (id) {
    //         let marker = markers.find(a => a.id == id)
    //         if (marker && marker.status == layer.status) {
    //             layer.setLatLng([marker.lat, marker.lng])
    //             _.remove(markers, function (n) {
    //                 return n.id == id
    //             });
    //         } else {
    //             map.removeLayer(layer)
    //         }
    //     }
    // })
    markersLayer = markers
    map.eachLayer(function (layer) {
        if (layer.id) {
            map.removeLayer(layer)
        }
    })
    for (let marker of markers) {
        map.addLayer(marker)
    }
}

export function panTo(lat, lng, zoomSize) {
    if (lat && lng) {
        // if (zoomSize) {
        //     map.setZoom(zoomSize)
        // }
        map.panTo({ lat: lat, lng: lng })
    }
}

export function updateDrawCircle(focusMarker) {
    if (!focusMarker) {
        return
    }
    map.eachLayer(function (layer) {
        let id = layer.id
        if (id == focusMarker.id) {
            map.removeLayer(layer)
            map.addLayer(focusMarker)

            markersLayer[markersLayer.findIndex(o => o.id == id)] = focusMarker
        }
    })
}

export function switchMap(type) {
    if (type) {
        map.removeLayer(osm)
        map.addLayer(satellite)
    } else {
        map.removeLayer(satellite)
        map.addLayer(osm)
    }
}