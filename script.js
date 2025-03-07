import L from "leaflet";
import {
  delayTimer,
  filterObjectsByRadius,
  randomThreeFromArray,
} from "./helpers";
import DUMMY_ATTRACTIONS from "./assets/data/testing2.json";
import DUMMY_ACTIVITIES from "./assets/data/testing.json";
import {
  activityMarkerIcon,
  attractionMarkerIcon,
  cityMarkerIcon,
  cultureMarkerIcon,
  foodMarkerIcon,
  luxuryMarkerIcon,
  parkMarkerIcon,
  sportsMarkerIcon,
} from "./mapscript";
import { createActivityHTML } from "./html-renders";

// const fetchCountryBtn = document.getElementById("fetch-country-btn");
const geolocationBtn = document.getElementById("geolocation-btn");
const nearbyLocationsBtn = document.getElementById("locations-btn");
const favouritesBtn = document.getElementById("favourites");
const actvityWrapper = document.getElementById("activities");
const filterSelector = document.getElementById("filter");
const distanceSelector = document.getElementById("distance");
const settingsModalBtn = document.getElementById("settings");
const closeSettingsModalBtn = document.getElementById("close-modal");
const settingsModal = document.getElementById("modal");
const background = document.getElementById("background");

// initialise leaflet map, desired location and zoom level
const map = L.map("map").setView([53.34, -6.26], 8);

// add OpenStreetMap tile layer
L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
  maxZoom: 19,
  attribution:
    '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>',
}).addTo(map);

// Async function that fetching country information from rest-countries API
async function fetchCountryData() {
  const url = `https://restcountries.com/v3.1/name/ireland`;
  try {
    // const { data } = await axios(url);
    const response = await fetch(url);
    const data = await response.json();

    const { capitalInfo } = data[1]; // This is due to two results from Ireland , GB and Ire
    const { latlng } = capitalInfo;
    map.flyTo([latlng[0], latlng[1]], 13);
    displayCountryFlag(data[1].name.common, data[1].flags.svg);
  } catch (error) {
    console.log(error);
  }
}

// Using web geolocation to find current users location and display on map
async function getCurrentLocationLatLng() {
  try {
    const position = await new Promise((resolve, reject) => {
      navigator.geolocation.getCurrentPosition(resolve, reject);
    });

    const lat = position.coords.latitude;
    const lng = position.coords.longitude;
    return { lat, lng };
  } catch (error) {
    console.log(error);
  }
}

async function flyToCurrentLocation() {
  geolocationBtn.innerHTML = "";
  const loader = document.createElement("div");
  loader.id = "loader";
  geolocationBtn.appendChild(loader);

  const { lat, lng } = await getCurrentLocationLatLng();
  geolocationBtn.innerHTML = '<i class="fa-solid fa-location-crosshairs"></i>';
  map.flyTo([lat, lng], 14);
  placeMarker([lat, lng]);
}

async function getLocationsNearMe() {
  removeAllMarkers(map);
  const { lat, lng } = await getCurrentLocationLatLng();
  const coords = { lat, lng };
  const filteredAttractions = filterObjectsByRadius(
    coords,
    DUMMY_ATTRACTIONS,
    distanceSelector.value
  );

  filteredAttractions.forEach((attraction) => {
    const icon = selectMarkerIconFromValue(attraction.category);

    const { lat, lng } = attraction;
    if (distanceSelector.value > 50) {
      placeInteractiveMarker({ lat, lng }, icon, attraction);
    } else placeToolTipMarker(attraction, icon);
    // displayActivites(attraction);
  });

  fitMarkersInView();
  closeModal();
}

// Place a marker on the map
function placeMarker(location, icon) {
  let marker;
  icon
    ? (marker = L.marker(location, { icon: icon }).addTo(map))
    : (marker = L.marker(location).addTo(map));
  return marker;
}

function placeInteractiveMarker(location, icon, activity) {
  const { lat, lng } = location;
  const marker = placeMarker([lat, lng], icon);
  // marker.bindTooltip(location.name).openTooltip();

  marker.addEventListener("click", () => console.log(activity));

  return marker;
}

// Places a marker with a tooltip on the map
function placeToolTipMarker(location, icon) {
  const { lat, lng } = location;
  const marker = placeMarker([lat, lng], icon);
  marker.bindTooltip(location.name).openTooltip();

  return marker;
}

// Removes all markers from the map
function removeAllMarkers(map) {
  map.eachLayer((layer) => {
    if (layer instanceof L.Marker) {
      map.removeLayer(layer);
    }
  });
}

// Find all Markers currently on the map
function getAllMarkers() {
  const allMarkers = [];

  map.eachLayer(function (layer) {
    if (layer instanceof L.Marker) {
      allMarkers.push(layer);
    }
  });

  return allMarkers;
}

// Fit all the markers available within the view of the map
function fitMarkersInView() {
  const markerBounds = L.latLngBounds();

  const markers = getAllMarkers();

  if (markers.length === 0) return;
  // Iterate over each marker and extend the bounds
  markers.forEach((marker) => {
    markerBounds.extend(marker.getLatLng());
  });

  // Fit the marker bounds within the map's view
  map.fitBounds(markerBounds);
}

// Function to dynamically render a countries flag to the DOM
function displayCountryFlag(country, flagUrl) {
  const flag = document.getElementById("flag");
  flag.src = flagUrl;
  flag.alt = `${country}'s flag`;
}

// Async function to fetch activity data from Failte Irelands API
async function getFailteIrelandsAttractionsAPI() {
  try {
    actvityWrapper.innerHTML = "";
    const loader = document.createElement("div");
    actvityWrapper.appendChild(loader);
    loader.id = "loader";

    const results = [];

    // const { data } = await axios.get(
    //   "https://failteireland.azure-api.net/opendata-api/v1/attractions"
    // );

    const response = await fetch(
      "https://failteireland.azure-api.net/opendata-api/v1/attractions"
    );
    const data = await response.json();

    results.push(data);

    // await fetchAlFailteIrelandActivities(data, results);

    actvityWrapper.innerHTML = "";
    const randomThreeActivites = randomThreeFromArray(data.results);

    randomThreeActivites.forEach((activity) => displayActivites(activity));
  } catch (error) {
    console.log(error);
  }
}

// Gets FailteIrelands Attraction data from parsed CSV into JSON object array

async function getFailteIrelandsAttractionsData() {
  try {
    actvityWrapper.innerHTML = "";
    const loader = document.createElement("div");
    actvityWrapper.appendChild(loader);
    loader.id = "loader";

    await delayTimer(100); // Simulating fetch request delay

    actvityWrapper.innerHTML = "";
    const randomThreeActivites = randomThreeFromArray(DUMMY_ATTRACTIONS);

    removeAllMarkers(map);

    randomThreeActivites.forEach((attraction) =>
      placeToolTipMarker(attraction, attractionMarkerIcon)
    );

    randomThreeActivites.forEach((activity) => displayActivites(activity));
  } catch (error) {
    console.log(error);
  }
}

async function getFailteIrelandsActivitiesData() {
  try {
    actvityWrapper.innerHTML = "";
    const loader = document.createElement("div");
    actvityWrapper.appendChild(loader);
    loader.id = "loader";

    await delayTimer(100); // Simulating fetch request delay

    actvityWrapper.innerHTML = "";
    const randomThreeActivites = randomThreeFromArray(DUMMY_ACTIVITIES);

    removeAllMarkers(map);

    DUMMY_ACTIVITIES.forEach((attraction) =>
      placeToolTipMarker(attraction, activityMarkerIcon)
    );

    randomThreeActivites.forEach((activity) => displayActivites(activity));
  } catch (error) {
    console.log(error);
  }
}

function toggleFavourites(activity) {
  const currentStoredFavourites = localStorage.getItem("favourites");
  activity.favourited = !activity.favourited;

  // If not storage
  if (!currentStoredFavourites) {
    localStorage.setItem("favourites", JSON.stringify([activity]));
    return;
  }
  const currentFavourites = JSON.parse(currentStoredFavourites);
  // filter to see if activity exists
  const existingActivity = currentFavourites.find(
    (fav) => fav.name === activity.name
  );

  // if activity exists
  if (existingActivity) {
    const newFavourites = currentFavourites.filter(
      (fav) => fav.name !== activity.name
    );
    localStorage.setItem("favourites", JSON.stringify(newFavourites));
    return;
  }

  // if activity doesnt exist
  localStorage.setItem(
    "favourites",
    JSON.stringify([...currentFavourites, activity])
  );
}

function loadAllFavourites() {
  const currentStoredFavourites = localStorage.getItem("favourites");
  const currentFavourites = JSON.parse(currentStoredFavourites);

  currentFavourites.forEach((activity) => displayActivites(activity));
}

// Renders actvities to the DOM
function displayActivites(activity) {
  if (!activity) return;
  const activitiesElement = createActivityHTML(activity);

  const flyBtn = activitiesElement.querySelector(".fly-btn");
  const favouriteBtn = activitiesElement.querySelector(".favourite-btn");

  const { lat, lng } = activity;

  flyBtn.addEventListener("click", () => flyToLocation([lat, lng]));
  favouriteBtn.addEventListener("click", () => toggleFavourites(activity));
  actvityWrapper.appendChild(activitiesElement);
}

function flyToLocation(coords) {
  map.flyTo(coords, 14);
}

function filterActivityData() {
  const value = filterSelector.value;
  const allIrishAttractions = [...DUMMY_ACTIVITIES, ...DUMMY_ATTRACTIONS];
  const filteredActivities = allIrishAttractions.filter(
    (activity) => activity.category === value
  );

  displayFilteredActivtiesOnMap(
    value === "all" ? allIrishAttractions : filteredActivities
  );
}

function displayFilteredActivtiesOnMap(filteredActivities) {
  removeAllMarkers(map);
  filteredActivities.forEach((activity) => {
    const icon = selectMarkerIconFromValue(activity.category);
    const { lat, lng } = activity;
    placeInteractiveMarker({ lat, lng }, icon, activity);
  });
  fitMarkersInView();
  closeModal();
}

function selectMarkerIconFromValue(value) {
  let icon;

  switch (value) {
    case "food":
      icon = foodMarkerIcon;
      break;
    case "sport":
      icon = sportsMarkerIcon;
      break;
    case "scenic":
      icon = parkMarkerIcon;
      break;
    case "luxury":
      icon = luxuryMarkerIcon;
      break;
    case "culture":
      icon = cultureMarkerIcon;
      break;
    case "city":
      icon = cityMarkerIcon;
      break;
    default:
      icon = activityMarkerIcon;
      break;
  }

  return icon;
}

function openModal() {
  settingsModal.style.display = "flex";
  background.style.display = "flex";
}

function closeModalOnClick(e) {
  if (e.target === background || e.target === closeSettingsModalBtn) {
    background.style.display = "none";
    settingsModal.style.display = "none";
  }
}

function closeModal() {
  background.style.display = "none";
  settingsModal.style.display = "none";
}

geolocationBtn.addEventListener("click", flyToCurrentLocation);
favouritesBtn.addEventListener("click", loadAllFavourites);
nearbyLocationsBtn.addEventListener("click", getLocationsNearMe);
filterSelector.addEventListener("change", filterActivityData);
distanceSelector.addEventListener("change", getLocationsNearMe);
settingsModalBtn.addEventListener("click", openModal);
closeSettingsModalBtn.addEventListener("click", closeModalOnClick);
background.addEventListener("click", closeModalOnClick);
