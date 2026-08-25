import axios from "axios";

const api = axios.create({
    baseURL: "https://ecommerce-platform-52ek.onrender.com/api",
    headers: {
        "Content-Type": "application/json",
    },
});

// Automatically attach JWT token
api.interceptors.request.use((config) => {
    const token = localStorage.getItem("token");

    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
});

export default api;