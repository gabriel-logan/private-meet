import { VITE_HTTP_API_URL } from "@env";
import axios from "axios";

const apiInstance = axios.create({
  baseURL: VITE_HTTP_API_URL,
});

export default apiInstance;
