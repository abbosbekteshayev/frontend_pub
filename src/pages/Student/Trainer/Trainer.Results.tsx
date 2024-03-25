import useInfinityRequest from "@/hooks/useInfinityRequest.ts";
import DataTable from "@/components/ui/DataTable.tsx";
import { useEffect, useMemo } from "react";
import { DotLoader } from "react-spinners";
import InfiniteScroll from "react-infinite-scroll-component";
import { ACTIONS } from "@/utils/constants.ts";
import useStateContext from "@/hooks/useStateContext.tsx";

const Results = () => {
    const {dispatch } = useStateContext();

    useEffect(() => {
        dispatch({
            type: ACTIONS.SET_BREADCRUMBS,
            payload: [
                {label: 'Результаты', path: '/results'}
            ]
        })
    }, [dispatch]);

    const { objects, isFetching, isError, error, fetchNextPage, hasNextPage } = useInfinityRequest({
        url: '/cabinet/students/trials/history',
        key: 'trials',
        queryKey: ['results'],
    })

    const tableHeaders = useMemo(() => {
        return [
            {
                key: 'subject',
                label: 'Предмет'
            },
            {
                key: 'correct_answers',
                label: 'Результат',
                render: (row) => `${row.correct_answers} из ${row.totalQuestions}`
            },
            {
                key: 'started_at',
                label: 'Дата прохождения',
                render: (row) => `${new Date(row.started_at).toLocaleDateString()} ${new Date(row.started_at).toLocaleTimeString()}`
            }
        ]
    }, []);

    return (
        <InfiniteScroll
            dataLength={ objects.length }
            next={ fetchNextPage }
            hasMore={ hasNextPage || false }
            loader={
                <div className="d-flex align-items-center justify-content-center my-3">
                    <DotLoader
                        color="#0096db"
                        size={ 40 }
                    />
                </div>
            }
        >
            <DataTable
                headers={ tableHeaders }
                data={ objects }
                isFetching={ isFetching }
                isError={ isError }
                error={ error }
            />
        </InfiniteScroll>
    )
}

export default Results;