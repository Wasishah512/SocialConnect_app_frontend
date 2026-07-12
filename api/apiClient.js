import axios from "axios";
import apiConstant from "./apiConstants";
import AsyncStorage from "@react-native-async-storage/async-storage";

class ApiClient {

    constructor() {

        this.endpoint = apiConstant;

        this.instance = axios.create({
            baseURL: this.endpoint.baseUrl,
            timeout: 30000,
            headers: {
                "Content-Type": "application/json"
            }
        });

        // Request interceptor
        this.instance.interceptors.request.use(
            async (config) => {

                const token = await AsyncStorage.getItem("token");

                config.headers = config.headers || {};

                if (token) {
                    config.headers.Authorization = `Bearer ${token}`;
                }

                return config;
            },
            error => Promise.reject(error)
        );

        // Response interceptor
        this.instance.interceptors.response.use(
            response => response,
            error => {
               const originalRequest = error.config;
        
        if (error.code === 'ECONNABORTED' && !originalRequest._retry) {
            originalRequest._retry = true;
            console.log('Retrying request...');
            return api(originalRequest);
        }
        
        return Promise.reject(error);

               
            }
        );
    }

    get(endpoint, config = {}) {
        return this.instance.get(endpoint, config);
    }

    post(endpoint, data = {}, config = {}) {
        return this.instance.post(endpoint, data, config);
    }

    put(endpoint, data = {}, config = {}) {
        return this.instance.put(endpoint, data, config);
    }

    delete(endpoint, config = {}) {
        return this.instance.delete(endpoint, config);
    }
}

const api = new ApiClient();
export default api;
