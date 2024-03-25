import { useEffect, useMemo } from "react";
import { ACTIONS } from "@/utils/constants.ts";
import useStateContext from "@/hooks/useStateContext.tsx";
import DataTable from "@/components/ui/DataTable.tsx";
import { useQuery } from "@tanstack/react-query";
import axios from "@/utils/axios.ts";
import { AxiosError } from "axios";
import { GenericResponse } from "@/types";

type ResultType = {
    "id": string
    "score": number
    "credits": number
    "semester": number
    "year_from": number
    "year_to": number
    "is_transfer": boolean
    "grade": string
    "subject": {
        "id": string
        "name": string
    }
}

const Results = () => {
    const { dispatch } = useStateContext();

    useEffect(() => {
        dispatch({
            type: ACTIONS.SET_BREADCRUMBS,
            payload: [
                { label: 'Результаты', path: '/results' }
            ]
        })
    }, [dispatch]);

    const { data: results, error, isError, isFetching } = useQuery({
        queryKey: ['results'],
        queryFn: async () => {
            const {data} = await axios.get('/cabinet/students/results');
            return data.data;
        },
        select: data => data.results
    })

    const tableHeaders = useMemo(() => {
        return [
            {
                key: 'year_from',
                label: 'Год',
                render: (row: ResultType) => row.is_transfer ? "Transfer" : (
                    <span className="text-nowrap">
                        { row.year_from } - { row.year_to }
                    </span>
                )
            },
            {
                key: 'semester',
                label: 'Семестр'
            },
            {
                key: 'subject',
                label: 'Предмет',
                render: (row) => row.subject.name
            },
            {
                key: 'credits',
                label: 'Кредиты'
            },
            {
                key: 'score',
                label: 'Балл',
                render: (row) => row.is_transfer ? "Transfer" : row.score
            },
            {
                key: 'grade',
                label: 'Оценка'
            }
        ]
    }, []);

    return (
        <div>
            <DataTable<ResultType>
                headers={ tableHeaders }
                data={ results }
                isFetching={ isFetching }
                isError={ isError }
                error={ error as AxiosError<GenericResponse> }
            />
        </div>
    )
}

export default Results;