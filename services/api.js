import axios from 'axios';

// Replace with your Django backend URL
const api = axios.create({
  baseURL: 'http://localhost:8000/api/', // Adjust this if your backend is hosted elsewhere
});

export default api;
