import { useEffect, useMemo } from "react";
import { ACTIONS } from "@/utils/constants.ts";
import useStateContext from "@/hooks/useStateContext.tsx";
import DataTable from "@/components/ui/DataTable.tsx";

const Fails = () => {
    const { dispatch } = useStateContext();

    useEffect(() => {
        dispatch({
            type: ACTIONS.SET_BREADCRUMBS,
            payload: [
                { label: 'Провалы', path: '/fails' }
            ]

        })
    }, [dispatch]);

    const data = [
        {
            year: '2021',
            semester: '1',
            subject: 'Математика',
            credits: 3,
            current_score: 80,
            final_score: 70,
            total_score: 150,
            penalty: 0,
            contract_number: '123456',
            contract_date: '01.01.2021',
            note: 'Примечание',
            invoice: 'Квитанция'
        }
    ]

    const tableHeaders = useMemo(() => {
        return [
            {
                key: 'year',
                label: 'Год'
            },
            {
                key: 'semester',
                label: 'Семестр'
            },
            {
                key: 'subject',
                label: 'Предмет'
            },
            {
                key: 'credits',
                label: 'Кредиты'
            },
            {
                key: 'current_score',
                label: 'Текущий балл'
            },
            {
                key: 'final_score',
                label: 'Итоговый балл'
            },
            {
                key: 'total_score',
                label: 'Общий балл'
            },
            {
                key: 'penalty',
                label: 'Штраф'
            },
            {
                key: 'contract_number',
                label: 'Номер контракта'
            },
            {
                key: 'contract_date',
                label: 'Дата контракта'
            },
            {
                key: 'note',
                label: 'Примечание'
            },
            {
                key: 'invoice',
                label: 'Квитанция'
            }
        ]
    }, []);

    return (
        <DataTable
            headers={ tableHeaders }
            data={ data }
            isFetching={ false }
            isError={ false }
        />
    )
}

export default Fails;