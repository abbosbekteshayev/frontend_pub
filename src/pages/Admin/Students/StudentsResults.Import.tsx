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

type ImportResults = {
    identifier: string;
    subject: string;
    semester: number;
    credits: number;
    score: number;
    grade: string;
    year_from: number;
    year_to: number;
    is_transfer: 'true' | 'false';
    errors?: any;
}

const StudentImportPage = () => {
    const { dispatch } = useStateContext();
    const axios = useAxios();

    const [hasError, setHasError] = useState(true);
    const [students, setStudents] = useState<ImportResults[]>([]);

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
                const workbook = XLSX.read(data, { type: 'array' });
                const sheetName = workbook.SheetNames[0];
                const worksheet = workbook.Sheets[sheetName];
                const json = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
                const headers = json[0] as string[];
                const dataRows = json.slice(1) as string[][];

                if (headers.length !== 9) {
                    toast.error("Неверный формат файла (количество столбцов)");
                    return;
                }

                const requiredHeaders = [
                    "identifier",
                    "subject",
                    "semester",
                    "credits",
                    "score",
                    "grade",
                    "year_from",
                    "year_to",
                    "is_transfer"
                ];

                const missingHeaders = requiredHeaders.filter(header => !headers.includes(header));

                if (missingHeaders.length > 0) {
                    toast.error(`Неверный формат файла (отсутствуют столбцы: ${ missingHeaders.join(", ") })`);
                    return;
                }

                const identifierIndex = headers.indexOf("identifier"),
                    subjectIndex = headers.indexOf("subject"),
                    semesterIndex = headers.indexOf("semester"),
                    creditsIndex = headers.indexOf("credits"),
                    scoreIndex = headers.indexOf("score"),
                    gradeIndex = headers.indexOf("grade"),
                    yearFromIndex = headers.indexOf("year_from"),
                    yearToIndex = headers.indexOf("year_to"),
                    isTransferIndex = headers.indexOf("is_transfer");

                const preparedStudents = dataRows.map((row: string[] | number[]) => ({
                    identifier: row[identifierIndex],
                    subject: row[subjectIndex],
                    semester: row[semesterIndex],
                    credits: row[creditsIndex],
                    score: row[scoreIndex],
                    grade: row[gradeIndex],
                    year_from: row[yearFromIndex],
                    year_to: row[yearToIndex],
                    is_transfer: row[isTransferIndex],
                } as ImportResults));

                setStudents(preparedStudents);
                setHasError(false);
            };
            reader.readAsArrayBuffer(file);
        });
    }, []);

    const { mutate, isLoading, isSuccess } = useMutation({
        mutationFn: async () => {
            const { data } = await axios.post("/core/results/bulk",  students);
            return data;
        },
        onSuccess: () => {
            toast.success("Результаты успешно загружены");
            setStudents([]);
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
                { label: "Студенты", path: "/students/" },
                { label: "Импорт результатов", path: "/students/import-results" }
            ]
        });
    }, [dispatch]);

    return (
        <Container fluid="lg">
            <Card className="animate__animated animate__faster animate__fadeIn shadow">
                <Card.Header>
                    <div className="d-flex justify-content-between align-items-center">
                        <h5>
                            Импорт результатов
                        </h5>
                        <div className="d-flex justify-content-end align-items-center gap-2">
                            <Button
                                variant="info"
                                className="center gap-2 py-2 px-4"
                                onClick={ () => window.open('/samples/sample_import_results.xlsx', '_blank') }
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
                            <p className="mb-0">Результаты успешно добавлены</p>
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
                                students.length > 0 ? (
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
                                            <th>Семестр</th>
                                            <th>Кредиты</th>
                                            <th>Балл</th>
                                            <th>Оценка</th>
                                            <th>Год</th>
                                        </tr>
                                        </thead>
                                        <tbody>
                                        { students.map((student, index) => (
                                            <tr key={ index }>
                                                <td className={ student.errors?.identifier ? 'bg-danger' : 'bg-success' }>{ student.identifier }</td>
                                                <td className={ student.errors?.subject ? 'bg-danger' : 'bg-success' }>{ student.subject }</td>
                                                <td className={ student.errors?.semester ? 'bg-danger' : 'bg-success' }>{ student.semester }</td>
                                                <td className={ student.errors?.credits ? 'bg-danger' : 'bg-success' }>{ student.credits }</td>
                                                <td className={ student.errors?.score ? 'bg-danger' : 'bg-success' }>{ student.score }</td>
                                                <td className={ student.errors?.grade ? 'bg-danger' : 'bg-success' }>{ student.grade }</td>
                                                <td className={ (student.errors?.year_from || student.errors?.year_to) ? 'bg-danger' : 'bg-success' }>
                                                    {
                                                        student.is_transfer === 'true' ? "Transfer" :
                                                            `${ student.year_from } - ${ student.year_to }`
                                                    }
                                                </td>
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

export default StudentImportPage;
