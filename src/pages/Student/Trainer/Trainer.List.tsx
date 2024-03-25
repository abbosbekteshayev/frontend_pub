import {useQuery, useMutation} from "@tanstack/react-query";
import useAxios from "@/hooks/useAxios.ts";
import DataTable from "@/components/ui/DataTable.tsx";
import {useEffect, useMemo, useState} from "react";
import {Form, InputGroup} from "react-bootstrap";
import useStateContext from "@/hooks/useStateContext.tsx";
import {useDebounce} from "@/hooks/useDebounce.ts";
import {ACTIONS} from "@/utils/constants.ts";
import {AxiosError} from "axios";
import {GenericResponse} from "@/types";
import {API_CONFIG} from "@/utils/config.ts";

const trialURL = API_CONFIG[(`trial_${process.env.NODE_ENV}`) as keyof typeof API_CONFIG];

const Trainer = () => {
    const axios = useAxios();
    const {dispatch} = useStateContext();
    const [search, setSearch] = useState('');
    const debouncedSearch = useDebounce(search, 500);

    useEffect(() => {
        dispatch({
            type: ACTIONS.SET_BREADCRUMBS,
            payload: [
                {label: 'Тренажёр', path: '/trainer'}
            ]
        })
    }, [dispatch]);


    const {mutate: startTraining, isLoading} = useMutation({
        mutationFn: async (id: number) => {
            const {data} = await axios.post(`/cabinet/students/trials/`, {
                test_bank_id: id
            });
            return data;
        },
        onSuccess: (res) => {
            const {token} = res.data;
            window.location.assign(`${trialURL}?token=${token}`)
        }
    });

    const {data, isFetching, isError, error} = useQuery({
        enabled: !!debouncedSearch,
        queryKey: ['trainers', debouncedSearch],
        keepPreviousData: true,
        queryFn: async () => {
            if (!search || search.length < 3) {
                return Promise.resolve({data: {trials: []}});
            }

            const response = await axios.get('/cabinet/students/trials', {
                params: {search}
            });
            return response.data;
        },
        select: (data) => data.data.trials
    });

    const tableHeaders = useMemo(() => {
        return [
            {
                key: 'subject',
                label: 'Предмет',
                searchable: () => (
                    <InputGroup>
                        <Form.Control
                            type="text"
                            placeholder="Поиск по предмету"
                            value={search}
                            onChange={e => setSearch(e.target.value)}
                        />
                    </InputGroup>
                )
            },
            {
                key: 'language',
                label: 'Язык'
            },
            {
                key: 'actions',
                label: 'Действия',
                render: (row: { id: number }) => (
                    <div>
                        <button
                            className="btn btn-primary btn-sm"
                            disabled={isLoading}
                            onClick={() => startTraining(row.id)}
                        >
                            Начать
                        </button>
                    </div>
                )
            }
        ]
    }, [isLoading, search, startTraining]);

    return (
        <div>
            <DataTable
                headers={tableHeaders}
                data={data}
                isFetching={isFetching}
                isError={isError}
                error={error as AxiosError<GenericResponse>}
                notFoundText="Введите название предмета для поиска"
            />
        </div>
    )
}

export default Trainer;