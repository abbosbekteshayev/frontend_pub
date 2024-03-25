import {useCallback, useEffect, useState} from "react";
import {Container, Card, Button, Form, Table, Alert} from "react-bootstrap";
import FileUpload from "@/components/ui/FileUpload";
import {useMutation, useQuery} from "@tanstack/react-query";
import useAxios from "@/hooks/useAxios";
import useStateContext from "@/hooks/useStateContext";
import {toast} from "react-toastify";
import * as XLSX from "xlsx";
import {FaRegFileExcel} from "react-icons/fa";
import {ACTIONS} from "@/utils/constants";
import {Branch} from "@/types/entities";
import {AxiosError} from "axios";
import {GenericResponse} from "@/types";
import {ZodError} from "zod";

type ImportStudent = {
    identifier: string;
    full_name: string;
    course: string;
    faculty: string;
    group: string;
    language: "UZ" | "RU" | "EN";
    sex: "M" | "F";
    education_form: "FULL_TIME" | "EVENING_TIME" | "EXTRAMURAL";
    passport: string;
    errors?: any;
}

const StudentImportPage = () => {
    const {dispatch} = useStateContext();
    const axios = useAxios();

    const [hasError, setHasError] = useState(true);
    const [students, setStudents] = useState<ImportStudent[]>([]);
    const [counters, setCounters] = useState({
        created: 0,
        updated: 0,
        skipped: 0
    });

    const [errors, setErrors] = useState<ZodError[]>([]);
    const [branch, setBranch] = useState("");

    const {
        data: branches,
        isFetching: branchIsFetching,
        error: branchError,
        isError: branchIsError
    } = useQuery({
        queryKey: ["students-import-branch"],
        queryFn: async () => {
            const {data} = await axios.get("/core/branches/all");
            return data;
        },
        select: (data) => data.data.branches
    });

    const onDrop = useCallback((acceptedFiles: File[]) => {
        acceptedFiles.forEach((file) => {
            if (!['application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', 'application/vnd.ms-excel'].includes(file.type)) {
                toast.error('File must be an Excel file');
                return;
            }

            const reader = new FileReader();
            reader.onload = (e) => {
                const data = new Uint8Array(e.target!.result as ArrayBuffer);
                const workbook = XLSX.read(data, {type: 'array'});
                const sheetName = workbook.SheetNames[0];
                const worksheet = workbook.Sheets[sheetName];
                const json = XLSX.utils.sheet_to_json(worksheet, {header: 1});
                const headers = json[0] as string[];
                const dataRows = json.slice(1) as string[][];

                if (headers.length !== 9) {
                    toast.error("Неверный формат файла (количество столбцов)");
                    return;
                }

                const requiredHeaders = [
                    "identifier",
                    "full_name",
                    "course",
                    "faculty",
                    "group",
                    "language",
                    "sex",
                    "education_form",
                    "passport"
                ];

                const missingHeaders = requiredHeaders.filter(header => !headers.includes(header));

                if (missingHeaders.length > 0) {
                    toast.error(`Неверный формат файла (отсутствуют столбцы: ${missingHeaders.join(", ")})`);
                    return;
                }

                const identifierIndex = headers.indexOf("identifier"),
                    fullNameIndex = headers.indexOf("full_name"),
                    courseIndex = headers.indexOf("course"),
                    facultyIndex = headers.indexOf("faculty"),
                    groupIndex = headers.indexOf("group"),
                    languageIndex = headers.indexOf("language"),
                    sexIndex = headers.indexOf("sex"),
                    educationFormIndex = headers.indexOf("education_form"),
                    passportIndex = headers.indexOf("passport");

                const preparedStudents = dataRows.map((row: string[]) => ({
                    identifier: row[identifierIndex],
                    full_name: row[fullNameIndex],
                    course: row[courseIndex],
                    faculty: row[facultyIndex],
                    group: row[groupIndex],
                    language: row[languageIndex],
                    sex: row[sexIndex],
                    education_form: row[educationFormIndex],
                    passport: row[passportIndex],
                } as ImportStudent));

                setStudents(preparedStudents);
                setHasError(false);
            };
            reader.readAsArrayBuffer(file);
        });
    }, []);

    const {mutate, isLoading, isSuccess} = useMutation({
        mutationFn: async () => {
            const {data} = await axios.post("/core/students/bulk", {branch, students});
            return data;
        },
        onSuccess: (res) => {
            toast.success("Студенты успешно загружены");
            setStudents([]);
            setCounters(res.data.counters);
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
                {label: "Студенты", path: "/students/"},
                {label: "Импорт", path: "/students/import"}
            ]
        });
    }, [dispatch]);

    return (
        <Container fluid="lg">
            <Card className="animate__animated animate__faster animate__fadeIn shadow">
                <Card.Header>
                    <div className="d-flex justify-content-between align-items-center">
                        <h5>
                            Импорт студентов
                        </h5>
                        <div className="d-flex justify-content-end align-items-center gap-2">
                            <Button
                                variant="info"
                                className="center gap-2 py-2 px-4"
                                onClick={() => window.open('/samples/sample_import_students.xlsx', '_blank')}
                                disabled={isLoading}>
                                <FaRegFileExcel/>
                                Загрузить пример (.xlsx)
                            </Button>
                            <Button
                                variant="success"
                                className="center gap-2 py-2 px-4"
                                disabled={hasError || isLoading}
                                onClick={() => mutate()}>
                                Сохранить
                            </Button>
                        </div>
                    </div>
                </Card.Header>
                <Card.Body>
                    {isSuccess ? (
                        <Alert variant="success">
                            <p>Создано: {counters.created}</p>
                            <p>Обновлен: {counters.updated}</p>
                            <p>Пропушен: {counters.skipped}</p>
                        </Alert>
                    ) : (
                        <>
                            <Form.Group>
                                <Form.Label>
                                    Филиал
                                </Form.Label>
                                <Form.Control
                                    as="select"
                                    onChange={(e) => setBranch(e.target.value)}
                                    value={branch}
                                >
                                    <option value="">
                                        Выберите филиал
                                    </option>
                                    {branches?.map((branch: Branch) => (
                                        <option key={branch.id} value={branch.id}>{branch.name.ru}</option>
                                    ))}
                                </Form.Control>
                            </Form.Group>
                            {branchIsFetching ? <p>Загрузка...</p> :
                                branchIsError ? <Alert variant="danger" className="mt-3">
                                        <p>Error: {(branchError as AxiosError<GenericResponse>)?.response?.data.message || (branchError as AxiosError)?.message}</p>
                                    </Alert> :
                                    errors.length > 0 ? (
                                            <Alert variant="danger" className="mt-3">
                                                <ul>
                                                    {errors.map((error, index) => (
                                                        <li key={index}>{error.message}</li>
                                                    ))}
                                                </ul>
                                            </Alert>
                                        ) :
                                        students.length > 0 ? (
                                            <Table striped bordered hover responsive>
                                                <thead>
                                                <tr>
                                                    <th>ID</th>
                                                    <th>ФИО</th>
                                                    <th>Курс</th>
                                                    <th>Группа</th>
                                                    <th>Факультет</th>
                                                    <th>Язык</th>
                                                    <th>Пол</th>
                                                    <th>Форма обучения</th>
                                                    <th>Паспорт</th>
                                                </tr>
                                                </thead>
                                                <tbody>
                                                {students.map((student, index) => (
                                                    <tr key={index}>
                                                        <td className={student.errors?.identifier ? 'bg-danger' : 'bg-success'}>{student.identifier}</td>
                                                        <td className={student.errors?.full_name ? 'bg-danger' : 'bg-success'}>{student.full_name}</td>
                                                        <td className={student.errors?.course ? 'bg-danger' : 'bg-success'}>{student.course}</td>
                                                        <td className={student.errors?.group ? 'bg-danger' : 'bg-success'}>{student.group}</td>
                                                        <td className={student.errors?.faculty ? 'bg-danger' : 'bg-success'}>{student.faculty}</td>
                                                        <td className={student.errors?.language ? 'bg-danger' : 'bg-success'}>{student.language}</td>
                                                        <td className={student.errors?.sex ? 'bg-danger' : 'bg-success'}>{student.sex}</td>
                                                        <td className={student.errors?.education_form ? 'bg-danger' : 'bg-success'}>{student.education_form}</td>
                                                        <td className={student.errors?.passport ? 'bg-danger' : 'bg-success'}>{student.passport}</td>
                                                    </tr>
                                                ))}
                                                </tbody>
                                            </Table>
                                        ) : branch ? <FileUpload onDrop={onDrop}/> : null}
                        </>
                    )}
                </Card.Body>
            </Card>
        </Container>
    );
};

export default StudentImportPage;
