let forecastData = [];
let currentPage = 1;
const itemsPerPage = 10;
let lastSearchedCity = '';
const OPENWEATHER_API_KEY = '54c0740d45b53fde994c8e4831d2f998';
const hamburgerMenu = document.querySelector('.hamburger-menu');
const navMenu = document.querySelector('.nav-menu');

//Hamburger toggle button
hamburgerMenu.addEventListener('click', () => {
    hamburgerMenu.classList.toggle('show');
    navMenu.classList.toggle('show');
  });


// Error handling utility function
function showNotification(message, type = "error") {
    const notificationDiv = document.createElement('div');
    notificationDiv.className = 'notification-message';
    notificationDiv.textContent = message;
    
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
    
    // Add animation styles
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
    setTimeout(() => notificationDiv.remove(), 3000);
}

// Loading state handlers
function showLoadingSpinner() {
    const tbody = document.querySelector("#weatherTable tbody");
    if (tbody) {
        tbody.innerHTML = `
            <tr>
                <td colspan="4" class="text-center">
                    <div class="loading-spinner"></div>
                    <p>Loading weather data...</p>
                </td>
            </tr>
        `;
    }
}

function hideLoadingSpinner() {
    const tbody = document.querySelector("#weatherTable tbody");
    if (tbody) {
        tbody.innerHTML = "";
    }
}

// Enhanced geolocation handling
if (navigator.geolocation) {
    navigator.geolocation.getCurrentPosition(
        async (position) => {
            try {
                const { latitude, longitude } = position.coords;
                showLoadingSpinner();
                await getWeatherDataByLocation(latitude, longitude);
                showNotification('Weather data loaded for your location', 'success');
            } catch (error) {
                showNotification('Error loading weather data for your location', 'error');
                console.error('Geolocation error:', error);
            }
        },
        (error) => {
            let errorMessage = 'Unable to fetch location. Please search by city name.';
            switch(error.code) {
                case error.PERMISSION_DENIED:
                    errorMessage = 'Location access denied. Please enable location services.';
                    break;
                case error.POSITION_UNAVAILABLE:
                    errorMessage = 'Location information unavailable.';
                    break;
                case error.TIMEOUT:
                    errorMessage = 'Location request timed out.';
                    break;
            }
            showNotification(errorMessage, 'error');
            console.error('Geolocation error:', error);
        },
        { timeout: 10000 }
    );
} else {
    showNotification('Geolocation is not supported by this browser.', 'error');
}
// Reset table state
function resetTableState() {
  forecastData = [];
  currentPage = 1;
  lastSearchedCity = '';
  hideLoadingSpinner();
  showNoDataMessage('No weather data available');
}

// Enhanced weather data fetching by location
async function getWeatherDataByLocation(latitude, longitude) {
    try {
        showLoadingSpinner();
        const apiUrl = `https://api.openweathermap.org/data/2.5/forecast?lat=${latitude}&lon=${longitude}&appid=${OPENWEATHER_API_KEY}&units=metric`;
        const response = await fetch(apiUrl);
        
        if (!response.ok) {
          if (response.status === 404) {
              resetTableState();
              showNotification('City not found', 'error');
          } else if (response.status === 429) {
              resetTableState();
              showNotification('API limit reached', 'error');
          } else {
              resetTableState();
              showNotification('Failed to fetch weather data', 'error');
          }
          return; // Exit early on error
      }
        
        const data = await response.json();
        forecastData = data.list;
        currentPage = 1;
        hideLoadingSpinner();
        updateTable(forecastData);
  
    } catch (error) {
        hideLoadingSpinner();
        showNotification(`Error: ${error.message}`, 'error');
        console.error('Weather API Error:', error);
    }
}

// Event Listeners with error handling
document.addEventListener('DOMContentLoaded', function() {
    try {
        const searchButton = document.getElementById("searchButton");
        const prevPageButton = document.getElementById("prevPageButton");
        const nextPageButton = document.getElementById("nextPageButton");
        
        if (!searchButton || !prevPageButton || !nextPageButton) {
            throw new Error('Required DOM elements not found');
        }
        
        searchButton.addEventListener("click", handleSearch);
        prevPageButton.addEventListener("click", () => changePage(-1));
        nextPageButton.addEventListener("click", () => changePage(1));
        
        setupFilters();
    } catch (error) {
        showNotification('Error initializing weather table', 'error');
        console.error('Initialization error:', error);
    }
});

// Enhanced search handling
function handleSearch() {
    try {
        const searchInput = document.getElementById("searchCity");
        if (!searchInput) {
            throw new Error('Search input not found');
        }

        const city = searchInput.value.trim();
        
        if (!city) {
            showNotification('Please enter a city name', 'info');
            return;
        }
        
        if (city.toLowerCase() === lastSearchedCity.toLowerCase()) {
            showNotification(`Already showing weather for ${city}`, 'info');
            return;
        }
        
        getWeatherData(city);
        lastSearchedCity = city;
    } catch (error) {
        showNotification(`Search error: ${error.message}`, 'error');
        console.error('Search error:', error);
    }
}

// Enhanced weather data fetching
async function getWeatherData(city) {
    try {
        showLoadingSpinner();
        const apiUrl = `https://api.openweathermap.org/data/2.5/forecast?q=${city}&appid=${OPENWEATHER_API_KEY}&units=metric`;
        const response = await fetch(apiUrl);
        
        if (!response.ok) {
          if (response.status === 404) {
              resetTableState();
              showNotification('City not found', 'error');
          } else if (response.status === 429) {
              resetTableState();
              showNotification('API limit reached', 'error');
          } else {
              resetTableState();
              showNotification('Failed to fetch weather data', 'error');
          }
          return; // Exit early on error
      }
        
        const data = await response.json();
        forecastData = data.list;
        currentPage = 1;
        hideLoadingSpinner();
        updateTable(forecastData);
        showNotification(`Weather data loaded for ${city}`, 'success');
    } catch (error) {
        showNotification(`Error: ${error.message}`, 'error');
        console.error('Weather API Error:', error);
    }
}

// Enhanced filter setup
function setupFilters() {
    try {
        const filterContainer = document.querySelector('.table-dropdown');
        if (!filterContainer) {
            throw new Error('Filter container not found');
        }

        const dropdown = document.createElement('div');
        dropdown.className = 'dropdown';

        const dropdownButton = document.createElement('button');
        dropdownButton.className = 'dropdown-toggle';
        dropdownButton.textContent = 'Filter Data';
        dropdownButton.onclick = toggleDropdown;

        const dropdownMenu = document.createElement('div');
        dropdownMenu.className = 'dropdown-menu';

        const filters = [
            { id: 'tempAsc', text: 'Temperature (Low to High)' },
            { id: 'tempDesc', text: 'Temperature (High to Low)' },
            { id: 'rainyDays', text: 'Rainy Days Only' },
            { id: 'highestTemp', text: 'Highest Temperature' }
        ];

        filters.forEach(filter => {
            const button = document.createElement('button');
            button.textContent = filter.text;
            button.onclick = () => {
                applyFilter(filter.id);
                toggleDropdown();
            };
            dropdownMenu.appendChild(button);
        });

        dropdown.appendChild(dropdownButton);
        dropdown.appendChild(dropdownMenu);
        filterContainer.appendChild(dropdown);
    } catch (error) {
        showNotification('Error setting up filters', 'error');
        console.error('Filter setup error:', error);
    }
}

// Toggle dropdown
function toggleDropdown() {
    const dropdownMenu = document.querySelector('.dropdown-menu');
    dropdownMenu.classList.toggle('show');
}

// Close dropdown when clicking outside
window.onclick = function(event) {
    if (!event.target.matches('.dropdown-toggle')) {
        const dropdowns = document.getElementsByClassName('dropdown-menu');
        Array.from(dropdowns).forEach(dropdown => {
            if (dropdown.classList.contains('show')) {
                dropdown.classList.remove('show');
            }
        });
    }
}

// Filter application
function applyFilter(filterId) {
    try {
        let filteredData = [...forecastData];

        switch (filterId) {
            case 'tempAsc':
                filteredData.sort((a, b) => a.main.temp - b.main.temp);
                break;

            case 'tempDesc':
                filteredData.sort((a, b) => b.main.temp - a.main.temp);
                break;

            case 'rainyDays':
                filteredData = filteredData.filter(item => 
                    item.weather[0].main.toLowerCase().includes('rain'));
                if (filteredData.length === 0) {
                    showNoDataMessage('No rainy days in the forecast');
                    return; // Exit early if no rainy days
                }
                break;

            case 'highestTemp':
                const highestTemp = filteredData.reduce((max, item) => 
                    item.main.temp > max.main.temp ? item : max);
                filteredData = [highestTemp];
                break;
        }

        currentPage = 1;
        updateTable(filteredData);
    } catch (error) {
        showNotification('Error applying filter', 'error');
        console.error('Filter error:', error);
    }
}

// New function to show no data message
function showNoDataMessage(message) {
    const tbody = document.querySelector("#weatherTable tbody");
    if (!tbody) return;
    
    tbody.innerHTML = `
        <tr>
            <td colspan="4" class="text-center p-4">
                <div class="flex flex-col items-center justify-center">
                    <p class="text-gray-500">${message}</p>
                </div>
            </td>
        </tr>
    `;

    // Update pagination to show no pages
    updatePagination(0);

    // Disable pagination buttons
    const prevButton = document.getElementById("prevPageButton");
    const nextButton = document.getElementById("nextPageButton");
    if (prevButton) prevButton.disabled = true;
    if (nextButton) nextButton.disabled = true;
}

function updateTable(data) {
  const tbody = document.querySelector("#weatherTable tbody");
  if (!tbody) return;
  
  // Clear existing content
  tbody.innerHTML = "";

  // Handle empty data case
  if (!data || data.length === 0) {
      showNoDataMessage('No data available');
      return;
  }

  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = Math.min(startIndex + itemsPerPage, data.length);
  const pageData = data.slice(startIndex, endIndex);

  // Additional validation for page data
  if (!pageData || pageData.length === 0) {
      showNoDataMessage('No data available for this page');
      return;
  }

  pageData.forEach(item => {
      try {
          const row = tbody.insertRow();
          row.insertCell(0).textContent = new Date(item.dt * 1000).toLocaleString();
          row.insertCell(1).textContent = `${item.main.temp.toFixed(1)}°C`;
          row.insertCell(2).textContent = `${item.main.humidity}%`;
          row.insertCell(3).textContent = item.weather[0].description;
      } catch (error) {
          console.error('Error creating table row:', error);
      }
  });

  updatePagination(data.length);
}

// Enhanced pagination update
function updatePagination(totalItems) {
  const pagination = document.querySelector('.pagination');
  if (!pagination) return;

  const prevButton = document.getElementById("prevPageButton");
  const nextButton = document.getElementById("nextPageButton");
  const pageInfo = document.getElementById("pageInfo");
  
  if (totalItems === 0) {
      if (prevButton) prevButton.disabled = true;
      if (nextButton) nextButton.disabled = true;
      if (pageInfo) pageInfo.textContent = 'No data available';
      return;
  }
  
  const maxPage = Math.ceil(totalItems / itemsPerPage);
  
  // Ensure current page is valid
  if (currentPage > maxPage) {
      currentPage = maxPage;
  }
  
  if (prevButton) prevButton.disabled = currentPage === 1;
  if (nextButton) nextButton.disabled = currentPage === maxPage;
  
  if (pageInfo) {
      pageInfo.textContent = `Page ${currentPage} of ${maxPage}`;
  }
}

// Enhanced page change function
function changePage(delta) {
  // If no data, prevent page changes
  if (!forecastData || forecastData.length === 0) {
      return;
  }

  const maxPage = Math.ceil(forecastData.length / itemsPerPage);
  const newPage = currentPage + delta;
  
  if (newPage >= 1 && newPage <= maxPage) {
      currentPage = newPage;
      updateTable(forecastData);
  }
}
// Configure API keys
const GEMINI_API_KEY = 'AIzaSyCIgNNIcKic4HKKl1vseBNpjKTO5dLM6Lw';
import { GoogleGenerativeAI } from 'https://esm.run/@google/generative-ai';


// DOM Elements
const chatInput = document.getElementById('chatInput');
const chatButton = document.getElementById('chatButton');
const chatResponse = document.getElementById('chatResponse');

// Debug flag
const DEBUG = true;

// Initialize Gemini
let genAI;
try {
    genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
    if (DEBUG) console.log('Gemini initialized successfully');
} catch (error) {
    logError(error, 'Gemini initialization');
}

// Error logging function
function logError(error, context) {
    if (DEBUG) {
        console.error(`Error in ${context}:`, error);
    }
}

// Main chat handler
async function handleChat() {
    const userInput = chatInput.value.trim();
    
    if (!userInput) return;

    appendMessage('You: ' + userInput, 'user-message');
    
    try {
        const intent = await analyzeIntent(userInput);
        
        if (DEBUG) console.log('Intent analysis:', intent);
        
        let response;
        if (intent.isWeatherQuery && intent.confidence > 0.7) {
            const city = intent.city || 'Islamabad';  // Use default city if no city found
            try {
                response = await fetchWeather(city);
            } catch (error) {
                response = "Sorry, I couldn't fetch the weather data. Please try again.";
            }
        } else {
            response = "I can only answer weather-related questions. Please ask me about the weather!";
        }
        
        appendMessage('Bot: ' + response, 'bot-message');
    } catch (error) {
        logError(error, 'Chat handling');
        appendMessage('Bot: Sorry, I encountered an error. Please try again.', 'bot-message');
    }
    
    chatInput.value = '';
}

// Analyze intent using Gemini
async function analyzeIntent(userInput) {
    try {
        const model = genAI.getGenerativeModel({ model: "gemini-pro" });
        
        const prompt = `
        Analyze if this is a weather-related query and extract any city mentioned.
        Return JSON only in this format:
        {
            "isWeatherQuery": boolean,
            "city": string or null,
            "confidence": number between 0 and 1
        }
        
        User query: "${userInput}"`;

        const result = await model.generateContent(prompt);
        const response = await result.response;
        const parsedResponse = JSON.parse(response.text());

        if (DEBUG) console.log('Gemini response:', parsedResponse);
        return parsedResponse;
    } catch (error) {
        logError(error, 'Gemini analysis');
        return {
            isWeatherQuery: userInput.toLowerCase().includes('weather'),
            city: extractCity(userInput),
            confidence: 1.0
        };
    }
}

// Basic city extraction function
function extractCity(userInput) {
    const commonWords = new Set(['weather', 'in', 'the', 'what', 'is', 'tell', 'me', 'about', 'how', 'today', '?', 'today?']);
    const words = userInput.split(' ');
    
    for (let word of words) {
        if (!commonWords.has(word.toLowerCase()) && word.length > 2) {
            return word.charAt(0).toUpperCase() + word.slice(1);
        }
    }
    return null;
}

// Fetch weather data from OpenWeather API
async function fetchWeather(city) {
  // Remove unwanted characters (e.g., "?" or others) from the city name
  city = city.replace(/[?]+$/, ''); // Remove trailing question marks
  const encodedCity = encodeURIComponent(city); // Encode the city name
  const apiUrl = `https://api.openweathermap.org/data/2.5/weather?q=${encodedCity}&appid=${OPENWEATHER_API_KEY}&units=metric`;
  const response = await fetch(apiUrl);
  const data = await response.json();

  if (data.cod !== 200) {
      return `Error: ${data.message}`; // Handle error response from the API
  }

  return `The weather in ${city} is ${data.weather[0].description} with ${data.main.temp}°C.`;
}

// Append message to chat
function appendMessage(message, className) {
    const messageElement = document.createElement('p');
    messageElement.textContent = message;
    messageElement.className = className;
    chatResponse.appendChild(messageElement);
    chatResponse.scrollTop = chatResponse.scrollHeight;
}

// Add event listeners
chatButton.addEventListener('click', handleChat);
chatInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') handleChat();
});

// Initial greeting
window.addEventListener('DOMContentLoaded', () => {
    appendMessage('Bot: Hello! Ask me about the weather in any city.', 'bot-message');
});