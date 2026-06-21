import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || '/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor — attach JWT token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('devmate_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor — handle 401 errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    const requestUrl = error.config?.url || '';
    const isAuthRequest = requestUrl.includes('/auth/login') || requestUrl.includes('/auth/register');

    // Only redirect to login when a protected (non-auth) request gets a 401.
    // If the login/register call itself returns 401 (wrong credentials), let the
    // component's catch block handle it and show the error message.
    if (error.response?.status === 401 && !isAuthRequest) {
      localStorage.removeItem('devmate_token');
      localStorage.removeItem('devmate_user');
      window.location.href = '/login';
    }

    return Promise.reject(error);
  }
);


export default api;
