/**
 * API service for making requests to the backend
 */

// Base URL for API requests
const API_BASE_URL = '/api';
const WS_BASE_URL = '/ws';

/**
 * Make a GET request to the API
 * @param {string} endpoint - The API endpoint
 * @param {Object} options - Additional fetch options
 * @returns {Promise<any>} - The response data
 */
export const get = async (endpoint, options = {}) => {
  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    method: 'GET',
    credentials: 'include',
    headers: {
      'Accept': 'application/json',
      ...options.headers,
    },
    ...options,
  });
  
  if (!response.ok) {
    throw new Error(`API error: ${response.status}`);
  }
  
  return response.json();
};

/**
 * Make a POST request to the API
 * @param {string} endpoint - The API endpoint
 * @param {FormData|Object} data - The data to send
 * @param {Object} options - Additional fetch options
 * @returns {Promise<any>} - The response data
 */
export const post = async (endpoint, data, options = {}) => {
  let requestOptions = {
    method: 'POST',
    credentials: 'include',
    ...options,
  };
  
  // If data is FormData, use it directly
  if (data instanceof FormData) {
    requestOptions.body = data;
  } else {
    // Otherwise, send as JSON
    console.log(`POST ${endpoint} request data:`, data);
    requestOptions.body = JSON.stringify(data);
    requestOptions.headers = {
      'Content-Type': 'application/json',
      ...options.headers,
    };
    console.log(`POST ${endpoint} request headers:`, requestOptions.headers);
  }
  
  try {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, requestOptions);
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error(`API error (${response.status}):`, errorText);
      throw new Error(`API error: ${response.status}`);
    }
    
    return response.json();
  } catch (error) {
    console.error(`Error in POST ${endpoint}:`, error);
    throw error;
  }
};

/**
 * Create a WebSocket connection
 * @param {string} chatId - The chat ID
 * @returns {WebSocket} - The WebSocket connection
 */
export const createWebSocketConnection = (chatId) => {
  const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
  const wsUrl = `${protocol}//${window.location.host}${WS_BASE_URL}/chat/${chatId}`;
  return new WebSocket(wsUrl);
};

export default {
  get,
  post,
  createWebSocketConnection,
};
