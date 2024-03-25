import useStateContext from "@/hooks/useStateContext";
import authAxios from "@/utils/axios.ts";
import {ACTIONS} from "@/utils/constants.ts";


const useRefreshToken = () => {
    const {dispatch} = useStateContext();

    return async () => {
        const response = await authAxios.get('/cabinet/auth/refresh');
        dispatch({
            type: ACTIONS.SET_ACCESS_TOKEN,
            payload: response.data.access_token
        })
        return response.data.access_token
    };
};

export default useRefreshToken;
