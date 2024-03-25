import { useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import useAxios from "@/hooks/useAxios.ts";
import useStateContext from "@/hooks/useStateContext.tsx";
import { useEffect } from "react";
import { ACTIONS } from "@/utils/constants.ts";

const UsersDetail = () => {
    const {idx} = useParams<{ idx: string }>();
    const axios = useAxios();
    const {dispatch} = useStateContext();

    const { data, isLoading, isError, error } = useQuery({
        queryKey: ['user', idx],
        queryFn: async () => {
            const res = await axios.get(`/cabinet/users/${ idx }`);
            return res.data;
        },
        select: (data) => data.data
    })

    useEffect(() => {
        dispatch({
            type: ACTIONS.SET_BREADCRUMBS,
            payload: [
                {label: 'Пользователи', path: '/admin/users'},
                {label: data?.user?.username}
            ]
        })
    }, [dispatch, data])



    return (
        <div>

        </div>
    )
}

export default UsersDetail;