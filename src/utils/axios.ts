import axios from "axios";
import {API_CONFIG} from '@/utils/config';

const baseURL = API_CONFIG[(process.env.NODE_ENV || 'development') as keyof typeof API_CONFIG];

const authAxios = axios.create({
    baseURL,
    withCredentials: true,
    headers: {
        'Content-Type': 'application/json'
    }
});

export default authAxios;
