import axios from 'axios';
import { EFileError } from './errors';

export const apiClient = axios.create({
  baseURL: import.meta.env.VITE_EFILE_BASE_URL,
});

apiClient.interceptors.response.use(
  response => response,
  error => {
    if (error.response) {
      const msg = error.response.data?.message || 'Request failed';
      return Promise.reject(new EFileError(msg, error.response.status));
    }
    return Promise.reject(new EFileError('Network error'));
  },
);
