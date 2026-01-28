import axios from "axios";

const baseURL = import.meta.env.VITE_HTTP_API_URL as string;

const apiInstance = axios.create({
  baseURL,
});

export default apiInstance;
