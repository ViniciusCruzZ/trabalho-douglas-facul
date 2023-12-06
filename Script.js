"use strict";

let map;
let directionsService;
let directionsRenderer;
let autocompleteInputOrigin;
let autocompleteInputDestination;
let placesService;
let infoWindow;

function initMap() {
    const initialPosition = { lat: -8.16199413135777, lng: -34.91618765850937 };
    map = new google.maps.Map(document.getElementById("gmp-map"), {
        zoom: 17,
        center: initialPosition,
    });

    directionsService = new google.maps.DirectionsService();
    directionsRenderer = new google.maps.DirectionsRenderer();
    directionsRenderer.setMap(map);

    infoWindow = new google.maps.InfoWindow();

    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
            function (position) {
                const userLocation = {
                    lat: position.coords.latitude,
                    lng: position.coords.longitude,
                };
                console.log("User Location:", userLocation);
                map.setCenter(userLocation);
                geocodeLatLng(userLocation);
            },
            function (error) {
                console.error("Geolocation error:", error);
                handleLocationError(true, null, map.getCenter());
            }
        );
    } else {
        console.error("Geolocation not supported");
        handleLocationError(false, null, map.getCenter());
    }

    autocompleteInputOrigin = new google.maps.places.Autocomplete(
        document.getElementById("location-input")
    );
    autocompleteInputOrigin.bindTo("bounds", map);

    autocompleteInputDestination = new google.maps.places.Autocomplete(
        document.getElementById("destination-input")
    );
    autocompleteInputDestination.bindTo("bounds", map);

    placesService = new google.maps.places.PlacesService(map);

    // Chama a função para encontrar os pontos de carga automaticamente
    findChargingStations();

    // Adiciona pontos de carregamento aleatórios
    // addRandomChargingStations(initialPosition, 100, 300);
}

function geocodeLatLng(latlng) {
    const geocoder = new google.maps.Geocoder();
    geocoder.geocode({ location: latlng }, function (results, status) {
        if (status === "OK") {
            if (results[0]) {
                console.log("Geocoded Address:", results[0].formatted_address);
                document.getElementById("location-input").value =
                    results[0].formatted_address;
            }
        } else {
            console.error(
                "Geocode was not successful for the following reason: " + status
            );
        }
    });
}

function handleLocationError(browserSupportsGeolocation, infoWindow, pos) {
    // Handle error for geolocation - you may add your custom logic here
    // This might include displaying an error message to the user
}

function calculateRoute() {
    const origin = document.getElementById("location-input").value;
    const destination = document.getElementById("destination-input").value;
    const buttoncta = document.querySelector(".button-cta");

    const request = {
        origin: origin,
        destination: destination,
        travelMode: google.maps.TravelMode.DRIVING,
    };

    directionsService.route(request, function (result, status) {
        if (status === google.maps.DirectionsStatus.OK) {
            directionsRenderer.setDirections(result);
            const route = result.routes[0];
            const distance = route.legs[0].distance.text;
            const time = result.routes[0].legs[0].duration.text;
            displayDistance(distance, time);
        } else {
            window.alert("Por favor, coloque um endereço válido: " + status);
        }
    });
    buttoncta.innerHTML = "";
    buttoncta.innerHTML = "🚗  ";
}

function calculateRouteByPoint(destination) {
    const origin = document.getElementById("location-input").value;
    const buttoncta = document.querySelector(".button-cta");

    const request = {
        origin: origin,
        destination: destination,
        travelMode: google.maps.TravelMode.DRIVING,
    };

    directionsService.route(request, function (result, status) {
        if (status === google.maps.DirectionsStatus.OK) {
            directionsRenderer.setDirections(result);
            const route = result.routes[0];
            const distance = route.legs[0].distance.text;
            const time = result.routes[0].legs[0].duration.text;
            displayDistance(distance, time);
        } else {
            window.alert("Por favor, coloque um endereço válido: " + status);
        }
    });
    buttoncta.innerHTML = "";
    buttoncta.innerHTML = "🚗  ";
}

function displayDistance(distance, time) {
    const distanceElement = document.getElementById("distance");
    distanceElement.innerHTML = `Distância: ${distance} | Tempo: ${time}`;
}

function findChargingStations() {
    const center = map.getCenter();
    const request = {
        location: center,
        radius: 500000, // raio de busca em metros
        types: ["charging_station"], // tipo de lugar para estações de carregamento
    };

    placesService.nearbySearch(request, function (results, status) {
        if (status === google.maps.places.PlacesServiceStatus.OK) {
            // Lógica para lidar com os resultados, por exemplo, marcá-los no mapa
            for (let i = 0; i < results.length; i++) {
                const place = results[i];
                // Adicione sua lógica para exibir ou processar os resultados
                createMarker(place);
            }
        } else {
            window.alert(
                "Erro ao encontrar estações de carregamento: " + status
            );
        }
    });
}

function createMarker(place) {
    const greenIcon = {
        url: "http://maps.google.com/mapfiles/ms/icons/green-dot.png", // URL do ícone verde
        scaledSize: new google.maps.Size(32, 32), // Tamanho do ícone
    };

    // Modificando o nome para "PONTO DE CARREGAMENTO"
    place.name = "PONTO DE CARREGAMENTO";

    // Adicionando a voltagem padrão dos carros
    const voltage = "220V"; // Você pode ajustar conforme necessário

    // Modificando o conteúdo do infowindow
    const contentString = `
        <div>
            <h3>${place.name}</h3>
            <p>Endereço: ${place.vicinity}</p>
            <p>Avaliação: ${place.rating || "N/A"}</p>
            <p>Voltagem Padrão: ${voltage}</p>
            <p>Tipo: ${place.types.join(", ")}</p>
            <button onclick="calculateRouteByPoint('${place.vicinity}')">Traçar rota</button>
        </div>
    `;

    const marker = new google.maps.Marker({
        map: map,
        position: place.geometry.location,
        title: place.name,
        icon: greenIcon, // Definindo o ícone verde
    });

    // Adicionando um listener de clique para mostrar o infowindow
    marker.addListener("click", function () {
        infoWindow.setContent(contentString);
        infoWindow.open(map, marker);
    });

    return marker;
}

function openMoreInfo(placeId) {
    // Lógica para exibir mais informações com base no place_id
    // Por exemplo, você pode fazer uma solicitação à API Places para obter detalhes adicionais
    console.log("Abrir mais informações para o place_id:", placeId);
}

function addRandomChargingStations(center, count, radius) {
    for (let i = 0; i < count; i++) {
        const randomLatLng = getRandomLatLng(center, radius);
        const place = {
            geometry: {
                location: randomLatLng,
            },
            vicinity: "Local Aleatório",
            rating: Math.floor(Math.random() * (5 - 1 + 1)) + 1, // Classificação aleatória entre 1 e 5
            types: ["charging_station"],
        };
        createMarker(place);
    }
}

function getRandomLatLng(center, radius) {
    const r = radius / 111300; // 1 grau de latitude = 111.3 km
    const theta = Math.random() * 2 * Math.PI;
    const x = r * Math.cos(theta);
    const y = r * Math.sin(theta);
    const lat = center.lat + y;
    const lng = center.lng + x;
    return { lat, lng };
}
