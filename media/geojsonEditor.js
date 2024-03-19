// @ts-check
import * as L from 'leaflet';

// Script run within the webview itself.
(function () {

    console.log("You made it to the webview!");

    // Script run within the webview itself.
    var map = L.map('map', {
        center: [40.737, -73.923],
        zoom: 3,
        scrollWheelZoom: false
    });
    
    L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 19,
        attribution: '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>'
    }).addTo(map);

    console.log("You made it to the webview!");

    // Handle the message inside the webview
    window.addEventListener('message', event => {

        const message = event.data; // The JSON data our extension sent

        // Let's test output but move logic to controller and pass w/ FeatureCollection "type" etc.
        console.log(message);
        // switch (message.command) {
        // 	case 'refactor':
        // 		count = Math.ceil(count * 0.5);
        // 		counter.textContent = count;
        // 		break;
        // }
    });    

});