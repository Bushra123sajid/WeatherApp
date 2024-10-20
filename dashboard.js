const apiKey = '54c0740d45b53fde994c8e4831d2f998';
let lastSearchedCity = '';
let isCelsius = true;
let originalTempCelsius = null;
const hamburgerMenu = document.querySelector('.hamburger-menu');
const navMenu = document.querySelector('.nav-menu');

document.getElementById("toggleUnit").style.display = "none"; // Hide toggle button

hamburgerMenu.addEventListener('click', () => {
  hamburgerMenu.classList.toggle('show');
  navMenu.classList.toggle('show');
});

function setupTemperatureToggle() {       //for changing the temperature from celcius to fahrenheit and from fahrenheit to celcius
    const toggleButton = document.getElementById("toggleUnit");
    const tempElement = document.getElementById("temp");
    const tempIcon = '<img src="temperature.png" alt="Temperature" class="weather-icon">';
    
    toggleButton.onclick = function() {    //function for when the user clicks on the button for temperature change
        if (!originalTempCelsius) return;
        
        if (isCelsius) {
            const tempF = (originalTempCelsius * 9/5) + 32;   //to change into fahrenheit
            tempElement.innerHTML = `${tempIcon}Temperature: ${tempF.toFixed(1)}°F`;
            toggleButton.textContent = "°C";
        } else {
            tempElement.innerHTML = `${tempIcon}Temperature: ${originalTempCelsius.toFixed(1)}°C`;  //to change into celsius again
            toggleButton.textContent = "°F";
        }
        isCelsius = !isCelsius;   //bool
    };
}

document.addEventListener('DOMContentLoaded', setupTemperatureToggle);

document.getElementById("searchButton").addEventListener("click", function() {
    const city = document.getElementById("searchCity").value.trim();
    
    // Check for empty input
    if (!city) {
        showError("Please enter a city name");
        return;
    }
    
    // Check if it's the same city as last search
    if (city.toLowerCase() === lastSearchedCity.toLowerCase()) {
        // Show message but still display cached data if available
        showNotification("Already showing weather for " + city, "info");
       
        return;
    }
    
  
    
    getWeatherData(city);
    lastSearchedCity = city;
});

function showError(message) {       //for error
    showNotification(message, "error");
}

function showNotification(message, type = "error") {    //for notifications in different colors
    const notificationDiv = document.createElement('div');
    notificationDiv.className = 'notification-message';
    notificationDiv.textContent = message;
    
    // Set styles based on notification type
    const backgroundColor = type === "error" ? "#ff4444" : 
                          type === "info" ? "#3498db" : 
                          "#2ecc71"; // success
    
    notificationDiv.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background-color: ${backgroundColor};
        color: white;
        padding: 10px 20px;
        border-radius: 5px;
        z-index: 1000;
        box-shadow: 0 2px 5px rgba(0,0,0,0.2);
        animation: fadeIn 0.3s, fadeOut 0.3s 2.7s;
    `;
    
    // Add animation styles if not already in your CSS
    if (!document.getElementById('notificationStyles')) {
        const styleSheet = document.createElement('style');
        styleSheet.id = 'notificationStyles';
        styleSheet.textContent = `
            @keyframes fadeIn {
                from { opacity: 0; transform: translateY(-20px); }
                to { opacity: 1; transform: translateY(0); }
            }
            @keyframes fadeOut {
                from { opacity: 1; transform: translateY(0); }
                to { opacity: 0; transform: translateY(-20px); }
            }
        `;
        document.head.appendChild(styleSheet);
    }

    document.body.appendChild(notificationDiv);
    setTimeout(() => notificationDiv.remove(), 3000);   //timer 
}

async function getWeatherData(city) {
    clearWeatherContent();
    showLoadingSpinner();
    
    try {
        const [weatherResponse, forecastResponse] = await Promise.all([
            fetch(`https://api.openweathermap.org/data/2.5/weather?q=${city}&appid=${apiKey}&units=metric`),
            fetch(`https://api.openweathermap.org/data/2.5/forecast?q=${city}&appid=${apiKey}&units=metric`)
        ]);

        if (!weatherResponse.ok) {
          document.getElementById("toggleUnit").style.display = "none"; // Hide toggle button
            throw new Error(weatherResponse.status === 404 ? 'City not found' : 
                          weatherResponse.status === 429 ? 'API limit reached' :
                          'Failed to fetch weather data');
                          
        }

        if (!forecastResponse.ok) {
            throw new Error('Failed to fetch forecast data');
        }

        const weatherData = await weatherResponse.json();
        const forecastData = await forecastResponse.json();

      

        hideLoadingSpinner();
        document.getElementById("toggleUnit").style.display = "block"; // Show toggle button
        updateWeatherWidget(weatherData);
        updateCharts(forecastData);
        showNotification(`Weather updated for ${city}`, "success");
    } catch (error) {
        hideLoadingSpinner();
        showError(error.message);
        console.error('Weather API Error:', error);
    }
}

function showLoadingSpinner() {
    clearWeatherContent();
    document.getElementById("loadingSpinner").style.display = "block";
    document.getElementById("toggleUnit").style.display = "none"; // Hide toggle button
}

function hideLoadingSpinner() {
    document.getElementById("loadingSpinner").style.display = "none";
}

// Modified geolocation handling with error handling
if (navigator.geolocation) {
    navigator.geolocation.getCurrentPosition(
        position => {
            const lat = position.coords.latitude;
            const lon = position.coords.longitude;
            getWeatherDataByCoords(lat, lon);
        },
        error => {
            console.error('Geolocation error:', error);
            showError('Unable to get your location. Please search for a city instead.');
        },
        { timeout: 10000 }
    );
} else {
    showError("Geolocation is not supported by your browser.");
}

async function getWeatherDataByCoords(lat, lon) {
    showLoadingSpinner();
    
    try {
        const [weatherResponse, forecastResponse] = await Promise.all([
            fetch(`https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=${apiKey}&units=metric`),
            fetch(`https://api.openweathermap.org/data/2.5/forecast?lat=${lat}&lon=${lon}&appid=${apiKey}&units=metric`)
        ]);

        if (!weatherResponse.ok || !forecastResponse.ok) {
            throw new Error('Failed to fetch weather data for your location');
        }

        const weatherData = await weatherResponse.json();
        const forecastData = await forecastResponse.json();

        hideLoadingSpinner();
        document.getElementById("toggleUnit").style.display = "block"; // Show toggle butto
        updateWeatherWidget(weatherData);
        updateCharts(forecastData);
        lastSearchedCity = weatherData.name; // Update last searched city
        showNotification(`Weather updated for your location: ${weatherData.name}`, "success");
    } catch (error) {
        hideLoadingSpinner();
        showError(error.message);
        console.error('Weather API Error:', error);
    }
}

async function updateWeatherWidget(weather) {
  const weatherWidget = document.getElementById("weatherWidget");
  const cityName = weather.name;
  const description = weather.weather[0].description.toLowerCase();
  originalTempCelsius = weather.main.temp; // Store the original Celsius temperature
  const humidity = weather.main.humidity;
  const windSpeed = weather.wind.speed;
  const icon = weather.weather[0].icon;

  document.getElementById("cityName").textContent = cityName;
    document.getElementById("weatherDesc").innerHTML = `
        <img src="weather.png" alt="Weather" class="weather-icon">
        ${description}
    `;
    document.getElementById("temp").innerHTML = `
        <img src="temperature.png" alt="Temperature" class="weather-icon">
        Temperature: ${originalTempCelsius.toFixed(1)}°C
    `;
    document.getElementById("humidity").innerHTML = `
        <img src="humidity.png" alt="Humidity" class="weatherr-icon">
        Humidity: ${humidity}%
    `;
    document.getElementById("windSpeed").innerHTML = `
        <img src="wind.png" alt="Wind" class="weatherr-icon">
        Wind Speed: ${windSpeed} m/s
    `;
    document.getElementById("weatherIcon").src = `http://openweathermap.org/img/wn/${icon}@2x.png`;
    
    // Reset temperature display to Celsius
    isCelsius = true;
    document.getElementById("toggleUnit").textContent = "°F";

  // Update video background
  const weatherVideo = document.getElementById("weatherVideo");
  if (description.includes("cloud")) {
      weatherVideo.src = "cloudy.mp4";
  } else if (description.includes("rain")) {
      weatherVideo.src = "rainy.mp4";
  } else if (description.includes("sunny")) {
      weatherVideo.src = "sunny.mp4";
  } else if(description.includes("thunder")) {
      weatherVideo.src = "thunder.mp4";
  } else if(description.includes("drizzle")) {
      weatherVideo.src = "drizzle.mp4";
  } else if(description.includes("fog") || description.includes("mist") || 
            description.includes("haze") || description.includes("dust") || 
            description.includes("sand") || description.includes("smoke")) {
      weatherVideo.src = "fogmisthaze.mp4";
  } else if(description.includes("snow") || description.includes("sleet")) {
      weatherVideo.src = "snowsleet.mp4";
  } else if(description.includes("clear")) {
      weatherVideo.src = "clearysky.mp4";
  } else if(description.includes("tornado")) {
      weatherVideo.src = "tornado.mp4";
  }
  weatherVideo.play();
}

function updateCharts(forecast) {
  const temperatures = [];
  const labels = [];
  const weatherConditions = {};

  for (let i = 0; i < forecast.list.length; i += 8) {
    const day = forecast.list[i];
    labels.push(new Date(day.dt_txt).toLocaleDateString());
    temperatures.push(day.main.temp);

    const condition = day.weather[0].main;
    weatherConditions[condition] = (weatherConditions[condition] || 0) + 1;
  }
  updateBarChart(labels, temperatures);
  updateDoughnutChart(weatherConditions);
  updateLineChart(labels, temperatures);
}

let barChart; // Store the instance of the bar chart
let doughnutChart; // Store the instance of the doughnut chart
let lineChart; // Store the instance of the line chart

function updateBarChart(labels, temperatures) {
  const ctx = document.getElementById("tempBarChart").getContext("2d");

  // Destroy existing chart if it exists
  if (barChart) {
    barChart.destroy();
  }

  // Create a new chart
  barChart = new Chart(ctx, {
    type: "bar",
    data: {
      labels: labels,
      datasets: [{
        label: "Temperature (°C)",
        data: temperatures,
        backgroundColor: "rgba(75, 192, 192, 0.2)",
        borderColor: "rgba(75, 192, 192, 1)",
        borderWidth: 1
      }]
    },
    options: {
      responsive: true,
      animation: {
        delay: 500
      },
      scales: {
        y: {
          beginAtZero: false
        }
      }
    }
  });
}

function updateDoughnutChart(weatherConditions) {
  const ctx = document.getElementById("conditionDoughnutChart").getContext("2d");

  // Destroy existing chart if it exists
  if (doughnutChart) {
    doughnutChart.destroy();
  }

  // Create a new chart
  doughnutChart = new Chart(ctx, {
    type: "doughnut",
    data: {
      labels: Object.keys(weatherConditions),
      datasets: [{
        data: Object.values(weatherConditions),
        backgroundColor: [
          "#FFCE56", "#36A2EB", "#FF6384", "#4BC0C0", "#9966FF"
        ]
      }]
    },
    options: {
      responsive: true,
      animation: {
        delay: 500
      }
    }
  });
}

function updateLineChart(labels, temperatures) {
  const ctx = document.getElementById("tempLineChart").getContext("2d");

  // Destroy existing chart if it exists
  if (lineChart) {
    lineChart.destroy();
  }

  // Create a new chart
  lineChart = new Chart(ctx, {
    type: "line",
    data: {
      labels: labels,
      datasets: [{
        label: "Temperature (°C)",
        data: temperatures,
        backgroundColor: "rgba(153, 102, 255, 0.2)",
        borderColor: "rgba(153, 102, 255, 1)",
        borderWidth: 1,
        fill: true
      }]
    },
    options: {
      responsive: true,
      animation: {
        duration: 1000,
        easing: 'easeOutBounce'
      },
      scales: {
        y: {
          beginAtZero: false
        }
      }
    }
  });
}


function clearWeatherContent() {
  document.getElementById("cityName").textContent = "";
  document.getElementById("weatherDesc").textContent = "";
  document.getElementById("temp").textContent = "";
  document.getElementById("humidity").textContent = "";
  document.getElementById("windSpeed").textContent = "";
  document.getElementById("weatherIcon").src = "removebackground.png";
  const weatherVideo = document.getElementById("weatherVideo");
  weatherVideo.src = ""; // Reset video when clearing content
}

