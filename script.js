"use strict";

const form = document.querySelector(".form");
const containerWorkouts = document.querySelector(".workouts");
const inputType = document.querySelector(".form__input--type");
const inputDistance = document.querySelector(".form__input--distance");
const inputDuration = document.querySelector(".form__input--duration");
const inputCadence = document.querySelector(".form__input--cadence");
const inputElevation = document.querySelector(".form__input--elevation");

class App {
  #map;
  #mapEvent;
  #workouts;

  constructor() {
    this.#workouts = [];
    this._getPosition();
    form.addEventListener("submit", this._newWorkout.bind(this));
    inputType.addEventListener("change", this._toggleElevationField);
  }

  _getPosition() {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        this._loadMap.bind(this),
        function () {
          alert("couldn't get you position");
        }
      );
    }
  }

  _loadMap(position) {
    const { latitude } = position.coords;
    const { longitude } = position.coords;
    const coords = [latitude, longitude];

    this.#map = L.map("map").setView(coords, 13);

    L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    }).addTo(this.#map);

    this.#map.on("click", this._showForm.bind(this));
  }

  _showForm(event) {
    this.#mapEvent = event;
    form.classList.remove("hidden");
    inputDistance.focus();
  }

  _hideForm() {
    inputCadence.value =
      inputDistance.value =
      inputDuration.value =
      inputElevation.value =
        " ";
    form.style.display = "none";
    form.classList.add("hidden");
    setTimeout(() => (form.style.display = "grid"), 1000);
  }

  _toggleElevationField() {
    inputElevation.closest(".form__row").classList.toggle("form__row--hidden");
    inputCadence.closest(".form__row").classList.toggle("form__row--hidden");
  }

  _newWorkout(event) {
    event.preventDefault();
    const isInputsValid = (...inputs) =>
      inputs.every((input) => Number.isFinite(input));
    const isInputsPositive = (...inputs) => inputs.every((input) => input > 0);
    const type = inputType.value;
    const distance = Number(inputDistance.value);
    const duration = Number(inputDuration.value);
    const cadence = Number(inputCadence.value);
    const elevation = Number(inputElevation.value);
    const { lat, lng } = this.#mapEvent.latlng;
    let workout;

    if (type === "running") {
      if (
        !isInputsValid(distance, duration, cadence) ||
        !isInputsPositive(distance, duration, cadence)
      ) {
        return alert("please insert positive numbers only");
      }

      workout = new Running(distance, duration, [lat, lng], cadence);
    } else {
      if (
        !isInputsValid(distance, duration, elevation) ||
        !isInputsPositive(distance, duration)
      ) {
        return alert("please insert positive numbers only");
      }

      workout = new Cycling(distance, duration, [lat, lng], elevation);
    }

    this.#workouts.push(workout);
    this._renderWorkoutMarker(workout);
    this._renderWorkout(workout);
    this._hideForm();
  }

  _renderWorkout(workout) {
    let html = `
    <li class="workout workout--${workout.type}" data-id="${workout.id}">
          <h2 class="workout__title">${workout.description}</h2>
          <div class="workout__details">
            <span class="workout__icon">${
              workout.type === "running" ? "🏃‍♂️" : "🚴‍♀️"
            }</span>
            <span class="workout__value">${workout.distance}</span>
            <span class="workout__unit">km</span>
          </div>
          <div class="workout__details">
            <span class="workout__icon">⏱</span>
            <span class="workout__value">${workout.duration}</span>
            <span class="workout__unit">min</span>
          </div>`;

    if (workout.type === "running") {
      html += `
          <div class="workout__details">
            <span class="workout__icon">⚡️</span>
            <span class="workout__value">${workout.pace.toFixed(1)}</span>
            <span class="workout__unit">min/km</span>
          </div>
          <div class="workout__details">
            <span class="workout__icon">🦶🏼</span>
            <span class="workout__value">${workout.cadence}</span>
            <span class="workout__unit">spm</span>
          </div>`;
    } else {
      html += `
          <div class="workout__details">
            <span class="workout__icon">⚡️</span>
            <span class="workout__value">${workout.speed.toFixed(1)}</span>
            <span class="workout__unit">km/h</span>
          </div>
          <div class="workout__details">
            <span class="workout__icon">⛰</span>
            <span class="workout__value">${workout.elevationGain}</span>
            <span class="workout__unit">m</span>
          </div>
    </li>`;
    }
    form.insertAdjacentHTML("afterend", html);
  }

  _renderWorkoutMarker(workout) {
    L.marker(workout.coords)
      .addTo(this.#map)
      .bindPopup(
        L.popup({
          maxWidth: 250,
          minWidth: 100,
          autoClose: false,
          closeOnClick: false,
          className: `${workout.type}-popup`,
        })
      )
      .setPopupContent(
        `${workout.type === "running" ? "🏃‍♂️" : "🚴‍♀️"} ${workout.description}`
      )
      .openPopup();
  }
}

class Workout {
  date = new Date();
  id = (Date.now() + "").slice(-10);
  distance;
  duration;
  coords;
  type;
  description;

  constructor(type, distance, duration, coords) {
    this.type = type;
    this.distance = distance;
    this.duration = duration;
    this.coords = coords;
    this._setDescription();
  }

  _setDescription() {
    const months = [
      "January",
      "February",
      "March",
      "April",
      "May",
      "June",
      "July",
      "August",
      "September",
      "October",
      "November",
      "December",
    ];
    this.description = `${this.type[0].toUpperCase() + this.type.slice(1)} on ${
      months[this.date.getMonth()]
    } ${this.date.getDate()}`;
  }
}

class Running extends Workout {
  cadence;
  pace;

  constructor(distance, duration, coords, cadence) {
    super("running", distance, duration, coords);
    this.cadence = cadence;
    this._calcPace();
  }

  _calcPace() {
    this.pace = this.duration / this.distance;
    return this.pace;
  }
}

class Cycling extends Workout {
  elevationGain;
  speed;

  constructor(distance, duration, coords, elevationGain) {
    super("cycling", distance, duration, coords);
    this.elevationGain = elevationGain;
    this._calcSpeed();
  }

  _calcSpeed() {
    this.speed = this.distance / (this.duration / 60);
    return this.speed;
  }
}

const app = new App();
