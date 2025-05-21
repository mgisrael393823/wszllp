import axios from 'axios';

export const apiClient = axios.create({
  baseURL: import.meta.env.VITE_EFILE_BASE_URL,
});
