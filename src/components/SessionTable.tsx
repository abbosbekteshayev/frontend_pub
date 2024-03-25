import { Alert, Table } from "react-bootstrap";
import { GenericResponse, ISessionExaminee } from "@/types";
import { ITestBankSubjectsResponse } from "@/api/TestBank.api.ts";
import { AxiosError } from "axios";
import { ScaleLoader } from "react-spinners";
import { validateDate, validateTime } from "@/utils/commonValidator.ts";
import { FaExclamationTriangle } from "react-icons/fa";
import { useQuery } from "@tanstack/react-query";
import useAxios from "@/hooks/useAxios.ts";

type SessionTableProps = {
    data: ISessionExaminee[]
    setHasError: (hasError: boolean) => void
}

const SessionTable = ({ data }: SessionTableProps) => {
    const axios = useAxios();

    const { data: subjects, isLoading, isError, error } = useQuery({
        queryKey: ['test-bank', 'subjects'],
        queryFn: async () => {
            const res = await axios.get<ITestBankSubjectsResponse>('/test/test-bank/subjects');
            return res.data;
        },
        select: (data) => data.data
    })

    if (isLoading) return (
        <div className="d-flex justify-content-center">
            <ScaleLoader
                color="#0096DB"
                height={ 15 }
            />
        </div>
    );

    if (isError) return (
        <Alert variant="danger">
            <p className="mb-0">
                <b>Ошибка: </b>
                { (error as AxiosError<GenericResponse>).response?.data.message || (error as AxiosError).message }
            </p>
        </Alert>
    );

    const checkUnique = (row: { identifier: string, subject: string }) => {
        const count = data.filter(item => item.identifier === row.identifier && item.subject === row.subject).length
        return count > 1
    }

    return (
        <Table
            striped
            bordered
            hover
            responsive
        >
            <thead>
            <tr>
                <th>#</th>
                <th>ID</th>
                <th>ФИО</th>
                <th>Шифр</th>
                <th>Предмет</th>
                <th>Уровень сложности</th>
                <th>Дата</th>
                <th>Время</th>
            </tr>
            </thead>
            <tbody>
            { subjects && data.map((row, index) => (
                <tr key={ index }>
                    <td>{ index + 1 }</td>
                    { checkUnique(row) ? (
                        <td className="bg-danger">
                            <FaExclamationTriangle title="dublicate"/> { row.identifier }
                        </td>
                    ) : (
                        <td>{ row.identifier }</td>
                    ) }
                    <td>{ row.full_name }</td>
                    <td className={ Array.isArray(subjects.codes) && subjects.codes.includes(parseInt(row.subject)) ? "bg-success" : "bg-danger" }>{ row.subject }</td>
                    <td className={ subjects.subjects[parseInt(row.subject)] ? "bg-success" : "bg-danger" }>{ subjects.subjects[parseInt(row.subject)] || "-" }</td>
                    <td className="bg-success">{ row.difficulty_level }</td>
                    <td className={ validateDate(row.date) ? "bg-success" : "bg-danger" }>{ row.date }</td>
                    <td className={ validateTime(row.time) ? "bg-success" : "bg-danger" }>{ row.time }</td>
                </tr>
            )) }
            </tbody>
        </Table>
    );
};

export default SessionTable;