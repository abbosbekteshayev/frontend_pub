import {useQuery} from '@tanstack/react-query';
import FullScreenLoader from '@/components/ui/FullScreenLoader';
import {FC, ReactNode, useEffect} from 'react';
import useStateContext from "@/hooks/useStateContext.tsx";
import {GenericResponse, IUserResponse} from "@/types";
import {AxiosError} from "axios";
import {toast} from "react-toastify";
import {useLocation, useNavigate} from "react-router-dom";
import {ACTIONS} from "@/utils/constants.ts";
import useAxios from "@/hooks/useAxios.ts";
import useRefreshToken from "@/hooks/useRefreshToken.ts";

type AuthMiddlewareProps = {
    children: ReactNode;
};

const AuthMiddleware: FC<AuthMiddlewareProps> = ({children}) => {
    const {state, dispatch} = useStateContext();
    const navigate = useNavigate();
    const location = useLocation();
    const axios = useAxios();
    const refresh = useRefreshToken();

    useEffect(() => {
        refresh()
            .then((data) => {
                if(!data) {
                    navigate(`/auth/login?next=${location.pathname !== '/access-denied' ? location.pathname : '/'}`);
                }
            })
            .catch(() => {
                navigate('/auth/login')
            })
    }, []);

    const {data, error, isError, isFetching} = useQuery({
        queryKey: ['me'],
        queryFn: async () => {
            const response = await axios.get<IUserResponse>('/cabinet/users/me');
            return response.data;
        },
        enabled: !!state.access_token,
        staleTime: 0,
        cacheTime: 0,
        select: (data) => data.data.user
    });

    useEffect(() => {
        if (data) {
            dispatch({type: ACTIONS.SET_USER, payload: data});
            if (!data.verified) {
                navigate('/auth/sign-up');
            }
        }
    }, [data, dispatch, navigate]);

    useEffect(() => {
        if (isError) {
            toast.error((error as AxiosError<GenericResponse>).response?.data.message || (error as AxiosError).message);
        }
    }, [dispatch, error, isError, location.pathname, navigate]);

    if (isFetching) {
        return <FullScreenLoader/>;
    }

    return children;
};

export default AuthMiddleware;
