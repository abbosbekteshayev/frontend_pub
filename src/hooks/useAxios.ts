import {useCallback, useEffect} from "react";
import {AxiosError, AxiosRequestConfig, InternalAxiosRequestConfig} from "axios";
import useRefreshToken from "./useRefreshToken";
import useStateContext from "./useStateContext.tsx";
import authAxios from "@/utils/axios.ts";
import {ACTIONS, MESSAGES} from "@/utils/constants.ts";
import {useNavigate, useLocation} from "react-router-dom";
import {GenericResponse} from "@/types";

interface CustomAxiosRequestConfig extends AxiosRequestConfig {
    _retry?: boolean;
}

const useAxios = () => {
    const {state, dispatch} = useStateContext();
    const navigate = useNavigate();
    const location = useLocation();
    const refresh = useRefreshToken();

    const addAuthToken = useCallback(({headers, ...config}: AxiosRequestConfig): InternalAxiosRequestConfig<unknown> => {
        return {
            ...config,
            headers: {
                ...headers,
                Authorization: headers?.Authorization ?? `Bearer ${state.access_token}`,
            },
        };
    }, [state.access_token]);

    const redirectToLogin = useCallback(() => {
        const nextPath = location.pathname.includes('/auth/login') ? '/' : location.pathname;
        navigate(`/auth/login?next=${nextPath}`);
    }, [navigate, location.pathname]);

    const onAuthError = useCallback(async (error: AxiosError<GenericResponse>): Promise<unknown> => {
        if (!error.response) return Promise.reject(error);
        const originalRequest = {...error.config, _retry: true} as CustomAxiosRequestConfig;
        const {message} = error.response.data;

        switch (message) {
            case MESSAGES.INVALID_TOKEN:
            case MESSAGES.UNAUTHORIZED:
                dispatch({type: ACTIONS.LOGOUT});
                redirectToLogin();
                return Promise.reject(error);
            case MESSAGES.EXPIRED_TOKEN:
                if (!originalRequest._retry) {
                    try {
                        const newAccessToken = await refresh();
                        originalRequest.headers = {
                            ...originalRequest.headers,
                            Authorization: `Bearer ${newAccessToken}`,
                        };
                        return authAxios(originalRequest);
                    } catch (refreshError) {
                        dispatch({type: ACTIONS.LOGOUT});
                        redirectToLogin();
                        return Promise.reject(refreshError);
                    }
                }
                break;
            case MESSAGES.PERMISSION_DENIED:
                navigate('/access-denied');
                return Promise.reject(error);
            default:
                return Promise.reject(error);
        }
    }, [dispatch, redirectToLogin, refresh]);

    useEffect(() => {
        const requestIntercept = authAxios.interceptors.request.use(addAuthToken, (error) => Promise.reject(error));
        const responseIntercept = authAxios.interceptors.response.use((response) => response, onAuthError);

        return () => {
            authAxios.interceptors.request.eject(requestIntercept);
            authAxios.interceptors.response.eject(responseIntercept);
        };
    }, [addAuthToken, onAuthError, state.access_token]);

    return authAxios;
};

export default useAxios;
