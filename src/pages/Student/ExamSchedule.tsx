import DataTable from "@/components/ui/DataTable.tsx";
import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import axios from "@/utils/axios.ts";
import { AxiosError } from "axios";
import { GenericResponse } from "@/types";

type ExamScheduleType = {
    "id": string
    "form": "writing" | "test" | "oral" | "project" | "practical",
    "date": string
    "time": string
    "room": string
    "is_online": boolean,
    "is_retake": boolean,
    "subject": {
        "id": string
        "name": string
    }
}

const ExamSchedule = () => {

    const { data: examSchedule, isFetching, isError, error} = useQuery({
        queryKey: ['examSchedule'],
        queryFn: async () => {
            const { data } = await axios('/cabinet/students/exam-schedule');
            return data.data;
        },
        select: data => data.exam_schedule
    })

    const tableHeaders = useMemo(() => {
        return [
            {
                key: 'subject',
                label: 'Предмет',
                render: (row: ExamScheduleType) => (
                    <div>
                        <span>
                            {row.is_retake && <span className="badge bg-danger me-1">Retake</span>}
                            {row.is_online && <span className="badge bg-success">Online</span>}
                        </span>
                        <p className="m-0">
                            { row.subject.name }
                        </p>
                    </div>
                )
            },
            {
                key: 'form',
                label: 'Форма'
            },
            {
                key: 'date',
                label: 'Дата'
            },
            {
                key: 'time',
                label: 'Время'
            },
            {
                key: 'room',
                label: 'Аудитория'
            }
        ]
    }, []);

    return (
        <DataTable<ExamScheduleType>
            headers={ tableHeaders }
            data={ examSchedule }
            isFetching={ isFetching }
            isError={ isError }
            error={ error as AxiosError<GenericResponse> }
        />
    )
};

export default ExamSchedule;