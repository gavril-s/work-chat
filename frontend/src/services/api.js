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
    ...options,
  });
  
  if (!response.ok) {
    throw new Error(`API error: ${response.status}`);
  }
  
  return response;
};

/**
 * Make a POST request to the API
 * @param {string} endpoint - The API endpoint
 * @param {FormData|Object} data - The data to send
 * @param {Object} options - Additional fetch options
 * @returns {Promise<any>} - The response data
 */
export const post = async (endpoint, data, options = {}) => {
  // If data is not FormData, convert it to FormData
  let formData = data;
  if (!(data instanceof FormData)) {
    formData = new FormData();
    Object.entries(data).forEach(([key, value]) => {
      formData.append(key, value);
    });
  }
  
  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    method: 'POST',
    body: formData,
    credentials: 'include',
    ...options,
  });
  
  return response;
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
