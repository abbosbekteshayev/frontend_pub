import useStateContext from "@/hooks/useStateContext.tsx";
import {useEffect} from "react";
import {Container} from "react-bootstrap";
import {ACTIONS} from "@/utils/constants.ts";

const AccessDenied = () => {
    const {dispatch} = useStateContext()
    useEffect(() => {
        dispatch({
            type: ACTIONS.SET_BREADCRUMBS,
            payload: [{label: 'Ошибка!', path: '/access-denied'}]
        })
    }, [dispatch]);
    return (
        <Container fluid="lg">
            <div>403 Access Denied</div>
            <div>К сожаления у вас нет доступа к этой странице, все доступные вам страницы указаны в меню</div>
        </Container>
    )
};

export default AccessDenied;