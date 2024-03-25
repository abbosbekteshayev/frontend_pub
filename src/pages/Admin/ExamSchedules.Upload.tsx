import { useCallback, useEffect, useState } from "react";
import { Alert, Button, Card, Container, Table } from "react-bootstrap";
import FileUpload from "@/components/ui/FileUpload";
import { useMutation } from "@tanstack/react-query";
import useAxios from "@/hooks/useAxios";
import useStateContext from "@/hooks/useStateContext";
import { toast } from "react-toastify";
import * as XLSX from "xlsx";
import { FaRegFileExcel } from "react-icons/fa";
import { ACTIONS } from "@/utils/constants";
import { AxiosError } from "axios";
import { GenericResponse } from "@/types";
import { ZodError } from "zod";

type ImportExamScheduleType = {
    identifier: string;
    subject: string;
    form: 'test' | 'oral' | 'practical' | 'project';
    date: string;
    time: string;
    room: string;
    is_online: "true" | "false";
    is_retake: "true" | "false";
    errors?: any;
}

const ExamSchedulesUpload = () => {
    const { dispatch } = useStateContext();
    const axios = useAxios();

    const [hasError, setHasError] = useState(true);
    const [examSchedules, setExamSchedules] = useState<ImportExamScheduleType[]>([]);

    const [errors, setErrors] = useState<ZodError[]>([]);

    const onDrop = useCallback((acceptedFiles: File[]) => {
        acceptedFiles.forEach((file) => {
            if (!['application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', 'application/vnd.ms-excel'].includes(file.type)) {
                toast.error('File must be an Excel file');
                return;
            }

            const reader = new FileReader();
            reader.onload = (e) => {
                const data = new Uint8Array(e.target!.result as ArrayBuffer);
                const workbook = XLSX.read(data, { type: 'array', cellDates: true });
                const sheetName = workbook.SheetNames[0];
                const worksheet = workbook.Sheets[sheetName];
                const json = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
                const headers = json[0] as string[];
                const dataRows = json.slice(1) as string[][];

                if (headers.length !== 8) {
                    toast.error("Неверный формат файла (количество столбцов)");
                    return;
                }

                const requiredHeaders = [
                    "identifier",
                    "subject",
                    "form",
                    "date",
                    "time",
                    "room",
                    "is_online",
                    "is_retake",
                ];

                const missingHeaders = requiredHeaders.filter(header => !headers.includes(header));

                if (missingHeaders.length > 0) {
                    toast.error(`Неверный формат файла (отсутствуют столбцы: ${ missingHeaders.join(", ") })`);
                    return;
                }

                const identifierIndex = headers.indexOf("identifier"),
                    subjectIndex = headers.indexOf("subject"),
                    formIndex = headers.indexOf("form"),
                    dateIndex = headers.indexOf("date"),
                    timeIndex = headers.indexOf("time"),
                    roomIndex = headers.indexOf("room"),
                    isOnlineIndex = headers.indexOf("is_online"),
                    isRetakeIndex = headers.indexOf("is_retake");

                const preparedExamSchedules = dataRows.map((row: string[] | number[]) => {
                    const time = new Date(row[timeIndex]);
                    const hour = time.getHours();
                    const minute = time.getMinutes();
                    const modifiedMinute = minute === 0 ? "00" : minute < 10 ? `0${minute}` : minute;

                    return {
                        identifier: row[identifierIndex],
                        subject: row[subjectIndex],
                        form: row[formIndex],
                        date: row[dateIndex],
                        time: `${hour}:${modifiedMinute}`,
                        room: row[roomIndex],
                        is_online: typeof row[isOnlineIndex] === 'string' ? row[isOnlineIndex] === "true" : row[isOnlineIndex],
                        is_retake: typeof row[isRetakeIndex] === 'string' ? row[isRetakeIndex] === "true" : row[isRetakeIndex],
                    } as ImportExamScheduleType
                });

                setExamSchedules(preparedExamSchedules);
                setHasError(false);
            };
            reader.readAsArrayBuffer(file);
        });
    }, []);

    const { mutate, isLoading, isSuccess } = useMutation({
        mutationFn: async () => {
            const { data } = await axios.post("/core/exam-schedule/bulk",  examSchedules);
            return data;
        },
        onSuccess: () => {
            toast.success("Результаты успешно загружены");
            setExamSchedules([]);
        },
        onError: (e: AxiosError<GenericResponse>) => {
            if (e.response?.data.message && e.response?.data.message.startsWith("[")) {
                setErrors(JSON.parse(e.response?.data.message));
            } else
                toast.error(e.response?.data.message || e.message);
        }
    });

    useEffect(() => {
        dispatch({
            type: ACTIONS.SET_BREADCRUMBS,
            payload: [
                { label: "Расписание экзаменов", path: "/exam-schedule" },
                { label: "Импорт", path: "/exam-schedule" }
            ]
        });
    }, [dispatch]);

    return (
        <Container fluid="lg">
            <Card className="animate__animated animate__faster animate__fadeIn shadow">
                <Card.Header>
                    <div className="d-flex justify-content-between align-items-center">
                        <h5>
                            Импорт расписание экзаменов
                        </h5>
                        <div className="d-flex justify-content-end align-items-center gap-2">
                            <Button
                                variant="info"
                                className="center gap-2 py-2 px-4"
                                onClick={ () => window.open('/samples/sample_import_examSchedule.xlsx', '_blank') }
                                disabled={ isLoading }
                            >
                                <FaRegFileExcel/>
                                Загрузить пример (.xlsx)
                            </Button>
                            <Button
                                variant="success"
                                className="center gap-2 py-2 px-4"
                                disabled={ hasError || isLoading }
                                onClick={ () => mutate() }
                            >
                                Сохранить
                            </Button>
                        </div>
                    </div>
                </Card.Header>
                <Card.Body>
                    { isSuccess ? (
                        <Alert variant="success">
                            <p className="mb-0">Расписание экзаменов успешно добавлены</p>
                        </Alert>
                    ) : (
                        <>
                            { errors.length > 0 ? (
                                    <Alert
                                        variant="danger"
                                        className="mt-3"
                                    >
                                        <ul className="mb-0">
                                            { errors.map((error, index) => (
                                                <li key={ index }>{ error.message }</li>
                                            )) }
                                        </ul>
                                    </Alert>
                                ) :
                                examSchedules.length > 0 ? (
                                    <Table
                                        striped
                                        bordered
                                        hover
                                        responsive
                                    >
                                        <thead>
                                        <tr>
                                            <th>ID</th>
                                            <th>Предмет</th>
                                            <th>Форма</th>
                                            <th>Дата</th>
                                            <th>Время</th>
                                            <th>Аудитория</th>
                                        </tr>
                                        </thead>
                                        <tbody>
                                        { examSchedules.map((student, index) => (
                                            <tr key={ index }>
                                                <td className={ student.errors?.identifier ? 'bg-danger' : 'bg-success' }>{ student.identifier }</td>
                                                <td className={ student.errors?.subject ? 'bg-danger' : 'bg-success' }>
                                                    { student.is_online && "ONLINE - " }
                                                    { student.is_retake && "RETAKE - " }
                                                    { student.subject }
                                                </td>
                                                <td className={ student.errors?.form ? 'bg-danger' : 'bg-success' }>{ student.form }</td>
                                                <td className={ student.errors?.date ? 'bg-danger' : 'bg-success' }>{ student.date }</td>
                                                <td className={ student.errors?.time ? 'bg-danger' : 'bg-success' }>{ student.time }</td>
                                                <td className={ student.errors?.room ? 'bg-danger' : 'bg-success' }>{ student.room }</td>
                                            </tr>
                                        )) }
                                        </tbody>
                                    </Table>
                                ) : <FileUpload onDrop={ onDrop }/> }
                        </>
                    ) }
                </Card.Body>
            </Card>
        </Container>
    );
};

export default ExamSchedulesUpload;
