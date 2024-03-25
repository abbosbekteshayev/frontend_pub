import {GenericResponse, ILoginResponse} from "@/types";
import authAxios from "@/utils/axios.ts";
import {useMutation} from "@tanstack/react-query";
import {AxiosError} from "axios";
import {LoginInput} from "@/schemas/Auth.schema.ts";

const loginUserFn = async (user: LoginInput) => {
    const response = await authAxios.post<ILoginResponse>('cabinet/auth/login', user);
    return response.data;
};

type LoginMutationType = {
    onSuccess: (data: ILoginResponse) => void;
    onError: (error: AxiosError<GenericResponse>) => void;
}

export const useLoginMutation = ({onSuccess, onError}: LoginMutationType) => {
    return useMutation({
        mutationFn: loginUserFn,
        onSuccess,
        onError
    });
}

export const logoutUserFn = async () => {
    const response = await authAxios.get<GenericResponse>('cabinet/auth/logout');
    return response.data;
};