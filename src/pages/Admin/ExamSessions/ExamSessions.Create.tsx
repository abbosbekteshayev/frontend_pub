import React, {useCallback, useEffect, useMemo, useState} from 'react';
import useStateContext from "@/hooks/useStateContext.tsx";
import {Accordion, Button, Card, Col, Container, Form, Row} from "react-bootstrap";
import {createExamSessionFn} from "@/api/ExamSession.api.ts";
import {useMutation, useQuery, useQueryClient} from "@tanstack/react-query";
import {toast} from "react-toastify";
import {useNavigate} from "react-router-dom";
import {useForm} from "react-hook-form";
import FloatingInput from "@/components/ui/FloatingInput.tsx";
import FloatingSelect from "@/components/ui/FloatingSelect.tsx";
import {FaPlus, FaRegFileExcel} from "react-icons/fa6";
import UploadFileField from "@/components/ui/UploadFileField.tsx";
import * as XLSX from 'xlsx';
import ExamSessionTable from "@/components/SessionTable.tsx";
import {zodResolver} from "@hookform/resolvers/zod";
import {ExamType} from "@/types/ExamType.ts";
import {ExamSessionCreateInput, examSessionCreateSchema} from "@/schemas/ExamSession.schema.ts";
import {ACTIONS} from "@/utils/constants.ts";
import useAxios from "@/hooks/useAxios.ts";

const today = new Date();
const yesterday = new Date(today);

yesterday.setDate(today.getDate() - 1);

type Examine = {
    identifier: string;
    full_name: string;
    subject: string;
    difficulty_level: number;
    date: string;
    time: string;
}

const ExamSessionCreate = () => {
        const {state: {authUser}, dispatch} = useStateContext();
        const navigate = useNavigate();
        const queryClient = useQueryClient();
        const axios = useAxios();

        const [data, setData] = useState([]);
        const [dataErrors, setDataErrors] = useState<string[]>([]);
        const [hasError, setHasError] = useState<boolean>(false);

        useEffect(() => {
            dispatch({
                type: ACTIONS.SET_BREADCRUMBS,
                payload: [
                    {label: 'Экзаменационные сессии', path: '/exam-sessions'},
                    {label: 'Создать экзамен', path: '/exam-sessions/create'}
                ]
            })
        }, [dispatch]);

        const {data: branches} = useQuery({
            queryKey: ['exam-sessions-branch'],
            queryFn: async () => {
                const {data} = await axios.get('/core/branches/all')
                return data
            },
            select: (data) => data.data.branches
        })

        const filteredBranches = useMemo(() => {
            return branches?.filter((branch) => authUser.staff?.branch_ids.includes(branch.id) || authUser.roles.includes("admin"))
        }, [branches, authUser])

        const {mutate: createExamSession, isLoading} = useMutation({
            mutationKey: ['createExamSession'],
            enabled: !!data && dataErrors.length > 0,
            mutationFn: (formData) => {
                const obj = {...formData, examinees: data}
                if (branch) obj.branch = branch
                return createExamSessionFn(obj)
            },
            onSuccess: () => {
                toast.success('Экзамен успешно создан')
                navigate("/exam-sessions")
            },
            onError: error => {
                if (error?.response && error.response.data.message) {
                    toast.error(error.response.data.message)
                } else if (error?.response && error.response.data.errors) {
                    setDataErrors(error.response.data.errors.map((e: unknown) => e.message))
                    error.response.data.errors.forEach((e: unknown) => {
                        setError(e.field, {
                            type: "manual",
                            message: e.message,
                        });
                    });
                } else {
                    toast.error(error.message)
                }
            }
        })

        const {
            register,
            handleSubmit,
            watch,
            setValue,
            setError,
            setFocus,
            control,
            reset,
            formState: {errors}
        } = useForm<ExamSessionCreateInput>({
            mode: 'onBlur',
            resolver: zodResolver(examSessionCreateSchema),
            defaultValues: {
                name: '',
                examType: '',
                only_exam_room: false,
                rooms: [],
                branch: null
            }
        });

        const branch = watch('branch')

        useEffect(() => {
            if (filteredBranches?.length === 1) {
                setValue('branch', filteredBranches[0].id)
            }
        }, [setValue, filteredBranches]);

        const {data: rooms} = useQuery({
            queryKey: ['rooms-create-exam-session', branch],
            queryFn: async ({queryKey}) => {
                let url = '/test/exam-sessions/rooms'
                if (queryKey[1]) {
                    url += `?branch=${queryKey[1]}`
                }
                const {data} = await axios.get(url)
                return data
            },
            enabled: !!branch,
            select: (data) => data.data.rooms

        })

        const onlyExamRooms = watch('only_exam_room')

        useEffect(() => {
            if (!onlyExamRooms) {
                setValue('rooms', [])
            }
        }, [setValue, onlyExamRooms]);

        useEffect(() => {
            setFocus('name')
        }, [setFocus]);

        const handleFile = useCallback((file: File | null) => {
            if (!file) return;

            if (file.size > 1024 * 1024 * 10) {
                toast.error('Размер файла не должен превышать 10 МБ');
                return;
            }

            if (file.type !== 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet') {
                toast.error('Неверный формат файла. Допустимый формат: .xlsx');
                return;
            }

            const reader = new FileReader();

            reader.onload = function (e: ProgressEvent<FileReader>) {
                const data = e.target?.result;
                if (data) {
                    const workbook = XLSX.read(data, {type: 'binary'});

                    // Get the name of the first sheet
                    const firstSheetName = workbook.SheetNames[0];

                    // Get the worksheet
                    const worksheet = workbook.Sheets[firstSheetName];

                    // Convert the worksheet to JSON
                    const jsonData = XLSX.utils.sheet_to_json(worksheet);

                    setData(jsonData.map((examinee: Examine) => ({
                        identifier: `${examinee.identifier}`.toUpperCase(),
                        full_name: `${examinee.full_name}`.toUpperCase(),
                        subject: `${examinee.subject}`.toUpperCase(),
                        difficulty_level: examinee.difficulty_level ? examinee.difficulty_level : 1,
                        date: `${examinee.date}`,
                        time: `${examinee.time}`,
                    })))
                    setValue('examinees', jsonData)
                }
            };

            reader.readAsBinaryString(file);
        }, [setValue]);

        const clean = useCallback(() => {
            queryClient.invalidateQueries(['test-bank', 'subjects'], {refetchActive: true})
            reset()
            setValue('examinees', [])
            setData([])
        }, [queryClient, reset, setValue])

        return (
            <Container fluid="lg">
                <Card className="animate__animated animate__faster animate__fadeIn shadow">
                    <Form onSubmit={handleSubmit(createExamSession)}>
                        <Card.Header className="d-flex align-items-center justify-content-between">
                            <h5>
                                Создание экзамена
                            </h5>
                            <div className="d-flex gap-3">
                                <Button
                                    variant="info"
                                    className="center gap-2 py-2 px-4"
                                    onClick={() => {
                                        window.open('/samples/sample_exam_session.xlsx', '_blank');
                                    }}
                                    disabled={isLoading}
                                >
                                    <FaRegFileExcel/> Загрузить пример
                                </Button>
                                <Button
                                    variant="danger"
                                    onClick={clean}
                                    className="center gap-2 py-2 px-4"
                                    disabled={isLoading}
                                >
                                    <FaRegFileExcel/> Очистить
                                </Button>
                                <Button
                                    variant="success"
                                    className="center gap-2 py-2 px-4"
                                    type="submit"
                                    disabled={isLoading || hasError}
                                >
                                    <FaPlus
                                        className={isLoading && "animate__animated animate__rotateIn animate__infinite"}
                                    /> Создать
                                </Button>
                            </div>
                        </Card.Header>

                        <Card.Body>
                            {(authUser.staff?.branch_ids.length > 1 || authUser.roles.includes("admin")) && (
                                <Form.Group>
                                    <Form.Label>Филиал</Form.Label>
                                    <Form.Control
                                        as="select"
                                        {...register("branch")}
                                    >
                                        <option value="">Выберите филиал</option>
                                        {
                                            filteredBranches?.map((branch) => (
                                                <option
                                                    key={branch.id}
                                                    value={branch.id}
                                                >{branch.name.ru}</option>
                                            ))
                                        }
                                    </Form.Control>
                                </Form.Group>
                            )}
                            <br/>
                            <>
                                <Row>
                                    <Col>
                                        <FloatingInput
                                            label="Название"
                                            id="name"
                                            watch={watch}
                                            register={register}
                                            errors={errors}
                                            placeholder="Название"
                                            disabled={isLoading}
                                        />

                                        <Form.Check
                                            type="checkbox"
                                            label="Только аудитории"
                                            {...register('only_exam_room')}
                                        />

                                        <Form.Group className="mt-3">
                                            <Form.Label>Аудитории</Form.Label>
                                            <Form.Control
                                                disabled={!onlyExamRooms}
                                                as="select"
                                                multiple
                                                {...register('rooms')}
                                            >
                                                {rooms && rooms.length > 0 ? rooms?.map((room) => (
                                                    <option
                                                        key={room.id}
                                                        value={room.id}
                                                    >{room.name}</option>
                                                )) : (
                                                    <option
                                                        key="disabled"
                                                        disabled
                                                    >Нет доступных аудиторий</option>
                                                )}
                                            </Form.Control>
                                        </Form.Group>
                                    </Col>
                                    <Col>
                                        <FloatingSelect
                                            label="Тип экзамена"
                                            id="examType"
                                            watch={watch}
                                            register={register}
                                            errors={errors}
                                            placeholder="Exam type"
                                            disabled={isLoading}
                                            options={[
                                                {label: 'Финал', value: ExamType.final},
                                                {label: 'Пересдача', value: ExamType.retake},
                                                {label: 'Другое', value: ExamType.other},
                                            ]}
                                            defaultValue={ExamType.final}
                                        />
                                    </Col>

                                    {/*    <Col>*/}
                                    {/*        <FloatingInput*/}
                                    {/*            label="Start date"*/}
                                    {/*            id="startDate"*/}
                                    {/*            watch={watch}*/}
                                    {/*            register={register}*/}
                                    {/*            errors={errors}*/}
                                    {/*            placeholder="Start date"*/}
                                    {/*            disabled={isLoading}*/}
                                    {/*            type="date"*/}
                                    {/*        />*/}
                                    {/*    </Col>*/}
                                    {/*    <Col>*/}
                                    {/*        <FloatingInput*/}
                                    {/*            label="End date"*/}
                                    {/*            id="endDate"*/}
                                    {/*            watch={watch}*/}
                                    {/*            register={register}*/}
                                    {/*            errors={errors}*/}
                                    {/*            placeholder="End date"*/}
                                    {/*            disabled={isLoading}*/}
                                    {/*            type="date"*/}
                                    {/*        />*/}
                                    {/*    </Col>*/}
                                    {/*</Row>*/}
                                    {/*<Row>*/}
                                    {/*    <Col>*/}
                                    {/*        <FloatingInput*/}
                                    {/*            label="Duration (minutes)"*/}
                                    {/*            id="duration"*/}
                                    {/*            watch={watch}*/}
                                    {/*            register={register}*/}
                                    {/*            errors={errors}*/}
                                    {/*            placeholder="Duration"*/}
                                    {/*            disabled={isLoading}*/}
                                    {/*            type="number"*/}
                                    {/*        />*/}
                                    {/*    </Col>*/}
                                    {/*    <Col>*/}
                                    {/*        <FloatingInput*/}
                                    {/*            label="Max points"*/}
                                    {/*            id="maxPoints"*/}
                                    {/*            watch={watch}*/}
                                    {/*            register={register}*/}
                                    {/*            errors={errors}*/}
                                    {/*            placeholder="Max points"*/}
                                    {/*            disabled={isLoading}*/}
                                    {/*            type="number"*/}
                                    {/*        />*/}
                                    {/*    </Col>*/}
                                    {/*    <Col>*/}
                                    {/*        <FloatingInput*/}
                                    {/*            label="Start time"*/}
                                    {/*            id="startTime"*/}
                                    {/*            watch={watch}*/}
                                    {/*            register={register}*/}
                                    {/*            errors={errors}*/}
                                    {/*            placeholder="Start time"*/}
                                    {/*            disabled={isLoading}*/}
                                    {/*            type="time"*/}
                                    {/*        />*/}
                                    {/*    </Col>*/}
                                    {/*    <Col>*/}
                                    {/*        <FloatingInput*/}
                                    {/*            label="End time"*/}
                                    {/*            id="endTime"*/}
                                    {/*            watch={watch}*/}
                                    {/*            register={register}*/}
                                    {/*            errors={errors}*/}
                                    {/*            placeholder="End time"*/}
                                    {/*            disabled={isLoading}*/}
                                    {/*            type="time"*/}
                                    {/*        />*/}
                                    {/*    </Col>*/}
                                    {/*</Row>*/}
                                    {/*<Row>*/}
                                    {/*    <Col>*/}
                                    {/*        <FloatingInput*/}
                                    {/*            label="Point per question"*/}
                                    {/*            id="pointPerQuestion"*/}
                                    {/*            watch={watch}*/}
                                    {/*            register={register}*/}
                                    {/*            errors={errors}*/}
                                    {/*            placeholder="Point per question"*/}
                                    {/*            disabled={isLoading}*/}
                                    {/*            type="number"*/}
                                    {/*        />*/}
                                    {/*    </Col>*/}
                                    {/*    <Col>*/}
                                    {/*        <FloatingInput*/}
                                    {/*            label="Questions"*/}
                                    {/*            id="questions"*/}
                                    {/*            watch={watch}*/}
                                    {/*            register={register}*/}
                                    {/*            errors={errors}*/}
                                    {/*            placeholder="Questions"*/}
                                    {/*            disabled={isLoading}*/}
                                    {/*            type="number"*/}
                                    {/*        />*/}
                                    {/*    </Col>*/}
                                    {/*    <Col>*/}
                                    {/*        <FloatingInput*/}
                                    {/*            label="Early access"*/}
                                    {/*            id="earlyAccess"*/}
                                    {/*            watch={watch}*/}
                                    {/*            register={register}*/}
                                    {/*            errors={errors}*/}
                                    {/*            placeholder="Early access"*/}
                                    {/*            disabled={isLoading}*/}
                                    {/*            type="time"*/}
                                    {/*        />*/}
                                    {/*    </Col>*/}
                                    {/*    <Col>*/}
                                    {/*        <FloatingInput*/}
                                    {/*            label="Late access"*/}
                                    {/*            id="lateAccess"*/}
                                    {/*            watch={watch}*/}
                                    {/*            register={register}*/}
                                    {/*            errors={errors}*/}
                                    {/*            placeholder="Late access"*/}
                                    {/*            disabled={isLoading}*/}
                                    {/*            type="time"*/}
                                    {/*        />*/}
                                    {/*    </Col>*/}
                                </Row>
                                <Col
                                    md={12}
                                    className="mt-4"
                                >
                                    <Accordion defaultActiveKey="0">
                                        <Accordion.Item eventKey="0">
                                            <Accordion.Header>Дополнительные опции</Accordion.Header>
                                            <Accordion.Body>
                                                <Row>
                                                    <Col md={6}>
                                                        <FloatingInput
                                                            register={register}
                                                            watch={watch}
                                                            id="amountOfQuestions"
                                                            label="Количество вопросов"
                                                            errors={errors}
                                                            type="number"
                                                            required={false}
                                                        />
                                                    </Col>

                                                    <Col md={6}>
                                                        <FloatingInput
                                                            register={register}
                                                            watch={watch}
                                                            id="duration"
                                                            label="Продолжительность"
                                                            errors={errors}
                                                            type="number"
                                                            required={false}
                                                        />
                                                    </Col>
                                                </Row>
                                            </Accordion.Body>
                                        </Accordion.Item>
                                    </Accordion>
                                </Col>

                                <hr/>
                                <Row>
                                    <Col>
                                        {data.length === 0 ? <UploadFileField
                                            label="Файл с данными"
                                            id="examineesFile"
                                            maxFiles={1}
                                            required={false}
                                            accept=".xlsx"
                                            maxFileSize={25 * 1024 * 1024}
                                            onDrop={(acceptedFiles) => handleFile(acceptedFiles[0])}
                                            control={control}
                                            disabled={isLoading}
                                        /> : (
                                            <ExamSessionTable
                                                data={data}
                                                setHasError={setHasError}
                                            />
                                        )}
                                    </Col>
                                </Row> </>
                            <hr/>

                        </Card.Body>
                    </Form>
                </Card>
            </Container>);
    }
;

export default ExamSessionCreate;