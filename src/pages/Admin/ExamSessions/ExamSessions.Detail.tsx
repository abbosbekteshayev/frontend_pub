import { Link, useNavigate, useParams } from "react-router-dom";
import {
    IExamSessionExamineesResponse,
    useDeleteExamSessionMutation,
    useExamCredentialsQuery,
    useExamResultsQuery,
    useExamSessionQuery,
    useResetExamineeMutation
} from "@/api/ExamSession.api.ts";
import { AxiosError } from "axios";
import { DataTableHeadersType, ErrorResponse, GenericResponse } from "@/types";
import { useCallback, useEffect, useMemo, useState } from "react";
import useStateContext from "@/hooks/useStateContext.tsx";
import {
    Alert,
    Badge,
    Button,
    Card,
    Col,
    Container,
    FloatingLabel,
    Form,
    InputGroup,
    Modal,
    OverlayTrigger,
    Row,
    Spinner,
    Tooltip
} from "react-bootstrap";
import { ClipLoader, DotLoader, ScaleLoader } from "react-spinners";
import {
    FaEye,
    FaFileExcel,
    FaPlus,
    FaPrint,
    FaRecycle,
    FaRepeat,
    FaTrash,
    FaUserPlus,
    FaUsers,
    FaUserXmark,
    FaX
} from "react-icons/fa6";
import { toast } from "react-toastify";
import { exportExamCredentials, exportExamResults } from "@/utils/exportXLSX.ts";
import { ACTIONS } from "@/utils/constants.ts";
import { FaEdit } from "react-icons/fa";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useQuery, useMutation } from "@tanstack/react-query";
import { ExamineeInput, examineeSchema } from "@/schemas/Examinee.schema.ts";
import useAxios from "@/hooks/useAxios.ts";
import InfiniteScroll from "react-infinite-scroll-component";
import TableOrderButton from "@/components/ui/TableOrderButton.tsx";
import StatisticChart from "@/components/StatisticChart.tsx";
import DataTable from "@/components/ui/DataTable.tsx";
import useInfinityRequest from "@/hooks/useInfinityRequest.ts";
import { IExamSessionExaminee } from "@/api/ExamSession.api.ts";

enum ExamineeField {
    IDENTIFIER = "identifier",
    FULL_NAME = "full_name",
    USERNAME = "username",
    SUBJECT = "subject",
}

enum ExamineeSortBy {
    IDENTIFIER = "identifier",
    FULL_NAME = "full_name",
    SUBJECT = "subject",
    DATE = "date",
    RESULT = "answerSheet",
}

const ExamSessionDetailPage = () => {
    const { idx } = useParams<{ idx: string }>();
    const { dispatch } = useStateContext()
    const navigate = useNavigate();
    const axios = useAxios();

    const [modal, setModal] = useState<"" | "delete" | "update" | 'create'>("");
    const [selectedIdx, setSelectedIdx] = useState<null | string>(null);

    const { data: examSession, isFetching, isError, error } = useExamSessionQuery(idx!);

    const {
        data: examinees,
        objects,
        refetch: refetchExaminees,
        isFetching: isFetchingExaminees,
        fetchNextPage,
        hasNextPage,
        isError: isErrorExaminees,
        error: errorExaminees,
        sortBy,
        order,
        onSort,
        searchBy,
        search,
        onSearch
    } = useInfinityRequest<IExamSessionExamineesResponse>({
        url: `/test/exam-sessions/${ idx }/examinees`,
        queryKey: ['exam-session-examinees', idx],
        key: 'examinees',
        enabled: !!idx,
        keepPreviousData: true,
    });

    if (isErrorExaminees) {
        toast.error((errorExaminees as AxiosError<ErrorResponse>).response?.data.message || (errorExaminees as AxiosError).message)
    }

    const {
        isFetching: isFetchingExamResults,
        isError: isErrorOnExamResults,
        error: errorOnExamResults,
        refetch: fetchExamResults
    } = useExamResultsQuery(idx!, {
        onSuccess: (res) => {
            exportExamResults(res)
        }
    });

    const {
        isFetching: isFetchingExamCredentials,
        isError: isErrorOnExamCredentials,
        error: errorOnExamCredentials,
        refetch: fetchExamCredentials
    } = useExamCredentialsQuery(idx!, {
        onSuccess: (res) => {
            exportExamCredentials(res)
        }
    });

    const { mutate: deleteExamSession, isLoading: isDeleting } = useDeleteExamSessionMutation({
        onSuccess: () => {
            navigate(-1)
            toast.success("Экзаменационная сессия успешно удалена")
        },
        onError: (error: AxiosError<GenericResponse>) => {
            toast.error(error.response?.data.message || error.message)
        }
    })

    const { register,
        setValue,
        setError,
        setFocus,
        handleSubmit,
        reset,
        formState: { errors } } = useForm({
        resolver: zodResolver(examineeSchema),
        defaultValues: {
            identifier: "",
            full_name: "",
            subject: "",
            date: "",
            time: "",
            duration: null,
            questions: null,
        }
    })

    const {
        data: subjects,
        isError: subjectHasError,
        isFetching: subjectIsFetching,
        refetch: subjectFetch,
        error: subjectError
    } = useQuery({
        queryKey: ['examinee-subjects'],
        enabled: false,
        queryFn: async () => {
            const { data } = await axios.get('/test/test-bank/active')
            return data
        },
        select: (data) => data.data.testBanks
    })

    const {
        mutate: createMutation,
        isLoading: createLoading
    } = useMutation({
        mutationFn: async (data: ExamineeInput) => {
            const response = await axios.post(`/test/exam-sessions/${ idx }/examinees`, data)
            return response.data
        },
        onSuccess: () => {
            setModal("")
            reset()
            toast.success("Экзаменуемый успешно создан")
            refetchExaminees()
        },
        onError: (error: AxiosError<ErrorResponse>) => {
            if (Array.isArray(error.response?.data.errors)) {
                error.response?.data.errors.forEach((error) => {
                    setError((error.path[error.path.length - 1] as keyof ExamineeInput), { message: error.message })
                })
            } else {
                toast.error(error.response?.data.message || error.message)
            }
        }
    })

    const {
        mutate: updateMutation,
        isLoading: updateLoading
    } = useMutation({
        mutationFn: async (data: ExamineeInput) => {
            const response = await axios.patch(`/test/exam-sessions/${ idx }/examinees/${ selectedIdx }`, data)
            return response.data
        },
        onSuccess: () => {
            setModal("")
            reset()
            setSelectedIdx(null)
            toast.success("Экзаменуемый успешно обновлен")
            refetchExaminees()
        },
        onError: (error: AxiosError<ErrorResponse>) => {
            if (Array.isArray(error.response?.data.errors)) {
                error.response?.data.errors.forEach((error) => {
                    setError((error.path[error.path.length - 1] as keyof ExamineeInput), { message: error.message })
                })
            } else {
                toast.error(error.response?.data.message || error.message)
            }
        }
    })

    const {
        mutate: deleteMutation,
        isLoading: deleteLoading
    } = useMutation({
        mutationFn: async () => {
            await axios.delete(`/test/exam-sessions/${ idx }/examinees/${ selectedIdx }`)
        },
        onSuccess: () => {
            setModal("")
            setSelectedIdx(null)
            refetchExaminees()
            toast.success("Эгзаменуемый успешно удален")
        },
        onError: (error: AxiosError<GenericResponse>) => {
            toast.error(error.response?.data.message || error.message)
        }
    })

    useEffect(() => {
        if (isErrorOnExamResults) {
            toast.error((errorOnExamResults as AxiosError<GenericResponse>).response?.data.message || (errorOnExamResults as AxiosError).message)
        }
    }, [errorOnExamResults, isErrorOnExamResults]);

    useEffect(() => {
        if (isErrorOnExamCredentials) {
            toast.error((errorOnExamCredentials as AxiosError<GenericResponse>).response?.data.message || (errorOnExamCredentials as AxiosError).message)
        }
    }, [errorOnExamCredentials, isErrorOnExamCredentials]);

    useEffect(() => {
        if (subjectHasError) {
            toast.error((subjectError as AxiosError<GenericResponse>).response?.data.message || (subjectError as AxiosError).message)
        }
    }, [subjectError, subjectHasError]);

    const { mutate: resetExaminee, isLoading: isReseting } = useResetExamineeMutation({
        onSuccess: () => {
            refetchExaminees()
            toast.success("Экзаменуемый был обнулен")
        },
        onError: (error: AxiosError<GenericResponse>) => {
            toast.error(error.response?.data.message || error.message)
        }
    })

    useEffect(() => {
        dispatch({
            type: ACTIONS.SET_BREADCRUMBS,
            payload: [
                { label: 'Экзаменационные сессии', path: '/exam-sessions' },
                { label: examSession?.name, path: `/exam-sessions/${ idx }` }
            ]
        })
    }, [dispatch, examSession?.name, idx]);

    // Переменная модали для создание студета
    const actionUpdate = useCallback((idx: string) => {
        setSelectedIdx(idx)
        const examinee = objects?.find((examinee) => examinee.id === idx)
        if (examinee) {
            subjectFetch().then(() => {
                setModal("update")
                setValue('identifier', examinee.identifier)
                setValue('full_name', examinee.full_name)
                setValue('subject', examinee.testBank?.id)
                setValue('date', examinee.date)
                setValue('time', examinee.time.split(":").slice(0, 2).join(":"))
                setValue('duration', examinee.duration)
                setValue('questions', examinee.questions)
            })
        }
    }, [setSelectedIdx, setValue, setModal, objects, subjectFetch])

    const actionCreate = useCallback(() => {
        subjectFetch().then(() => {
            setModal("create")
            setFocus('identifier')
        })
    }, [setModal, setFocus, subjectFetch])

    const actionDelete = useCallback((idx: string) => {
        setSelectedIdx(idx)
        setModal("delete")
    }, [])

    const modalClose = useCallback(() => {
        setModal("")
        setSelectedIdx(null)
        reset()
    }, [setModal, setSelectedIdx, reset])

    const tableHeaders: DataTableHeadersType<IExamSessionExaminee> = useMemo(() => {
        return [
            {
                key: "identifier",
                sortable: () => (
                    <TableOrderButton
                        label="ID"
                        sortBy={ sortBy }
                        order={ order }
                        field="identifier"
                        onClick={ () => onSort(ExamineeSortBy.IDENTIFIER) }
                    />
                ),
                searchable: () => (
                    <InputGroup>
                        <Form.Control
                            type="text"
                            placeholder="Поиск по ID"
                            value={ searchBy === ExamineeField.IDENTIFIER ? search : "" }
                            onChange={ e => onSearch(ExamineeField.IDENTIFIER, e.target.value) }
                        />
                    </InputGroup>
                )
            },
            {
                key: "full_name",
                sortable: () => (
                    <TableOrderButton
                        label="ФИО"
                        sortBy={ sortBy }
                        order={ order }
                        field="full_name"
                        onClick={ () => onSort(ExamineeSortBy.FULL_NAME) }
                    />
                ),
                searchable: () => (
                    <InputGroup>
                        <Form.Control
                            type="text"
                            placeholder="Поиск по ФИО"
                            value={ searchBy === ExamineeField.FULL_NAME ? search : "" }
                            onChange={ e => onSearch(ExamineeField.FULL_NAME, e.target.value) }
                        />
                    </InputGroup>
                )
            },
            {
                key: "subject",
                sortable: () => (
                    <TableOrderButton
                        label="Предмет"
                        sortBy={ sortBy }
                        order={ order }
                        field="subject"
                        onClick={ () => onSort(ExamineeSortBy.SUBJECT) }
                    />
                ),
                searchable: () => (
                    <InputGroup>
                        <Form.Control
                            type="text"
                            placeholder="Поиск по предмету"
                            value={ searchBy === ExamineeField.SUBJECT ? search : "" }
                            onChange={ e => onSearch(ExamineeField.SUBJECT, e.target.value) }
                        />
                    </InputGroup>
                ),
                render: (row: IExamSessionExaminee) => (
                    <div className="d-flex align-items-center">
                        <Badge
                            bg="primary"
                            className="me-2 d-flex align-items-center"
                        >
                            { row.difficulty_level }
                        </Badge>

                        { row.testBank?.subject }
                    </div>
                )
            },
            {
                label: "Логин",
                key: "username",
                searchable: () => (
                    <InputGroup>
                        <Form.Control
                            type="text"
                            placeholder="Поиск по логину"
                            value={ searchBy === ExamineeField.USERNAME ? search : "" }
                            onChange={ e => onSearch(ExamineeField.USERNAME, e.target.value) }
                        />
                    </InputGroup>
                )
            },
            {
                label: "Пароль",
                key: "password",
            },
            {
                key: "date",
                render: (row: IExamSessionExaminee) => `${ row.date } ${ row.time.split(":").slice(0, 2).join(":") }`,
                sortable: () => (
                    <TableOrderButton
                        label="Дата и время"
                        sortBy={ sortBy }
                        order={ order }
                        field="date"
                        onClick={ () => onSort(ExamineeSortBy.DATE) }
                    />
                ),
            },
            {
                key: "answerSheet",
                render: (row: IExamSessionExaminee) => (
                    row.answerSheet === null ? '-' : `${ row.answerSheet.correctAnswers?.length || 0 } из ${ row.questions }`
                ),
                sortable: () => (
                    <TableOrderButton
                        label="Результат"
                        sortBy={ sortBy }
                        order={ order }
                        field="answerSheet"
                        onClick={ () => onSort(ExamineeSortBy.RESULT) }
                    />
                )
            },
            {
                label: "Статус",
                key: "status",
                render: (row: IExamSessionExaminee) => (
                    <Badge
                        className="text-uppercase"
                        bg={ row.status === 'not-started' ? 'danger' : row.status === 'finished' ? 'success' : 'primary' }
                    >
                        { row.status === 'not-started' ? 'Не начался' : row.status === 'finished' ? 'Завершено' : 'В процессе' }
                    </Badge>
                )
            },
            {
                label: "Действия",
                key: "actions",
                render: (row: IExamSessionExaminee) => (
                    <div className="d-flex gap-2 justify-content-center align-items-center">
                        <OverlayTrigger
                            placement="top"
                            overlay={ <Tooltip>Редактировать</Tooltip> }
                        >
                            <Button
                                className="btn-icon text-white"
                                disabled={ updateLoading }
                                onClick={ () => actionUpdate(row.id) }
                                variant="warning"
                            >
                                <FaEdit/>
                            </Button>
                        </OverlayTrigger>
                        <OverlayTrigger
                            placement="top"
                            overlay={ <Tooltip>Протокол тестирования</Tooltip> }
                        >
                            <Button
                                className="btn-icon text-white"
                                disabled={ row.answerSheet === null }
                                onClick={ () => navigate(`/exam-sessions/${ idx }/answer-sheets/${ row.answerSheet?.id }`) }
                                variant="info"
                            >
                                <FaEye/>
                            </Button>
                        </OverlayTrigger>
                        <OverlayTrigger
                            placement="top"
                            overlay={ <Tooltip>Обнулить результат</Tooltip> }
                        >
                            <Button
                                className="btn-icon"
                                variant="primary"
                                disabled={ isReseting || row.status === 'not-started' }
                                onClick={ () => resetExaminee(row.id) }
                            >
                                {
                                    isReseting ?
                                        <Spinner
                                            as="span"
                                            animation="border"
                                            size="sm"
                                            role="status"
                                            aria-hidden="true"
                                        /> :
                                        <FaRecycle/>
                                }
                            </Button>
                        </OverlayTrigger>
                        <OverlayTrigger
                            placement="top"
                            overlay={ <Tooltip>Удалить экзаменуемого</Tooltip> }
                        >
                            <Button
                                className="btn-icon"
                                variant="danger"
                                disabled={ isReseting }
                                onClick={ () => actionDelete(row.id) }
                            >
                                {
                                    isReseting ?
                                        <Spinner
                                            as="span"
                                            animation="border"
                                            size="sm"
                                            role="status"
                                            aria-hidden="true"
                                        /> :
                                        <FaUserXmark/>
                                }
                            </Button>
                        </OverlayTrigger>
                    </div>
                )
            }
        ]
    }, [sortBy, order, onSort, searchBy, search, onSearch, updateLoading, isReseting, actionUpdate, navigate, idx, resetExaminee, actionDelete]);

    return (
        <>
            <Modal
                show={ ['update', 'create'].includes(modal) }
                onHide={ modalClose }
                centered
                animation
                backdrop="static"
            >
                <Modal.Header closeButton>
                    <h5>
                        { modal === 'create' ? 'Создать' : 'Изменить' } экзаменуемого
                    </h5>
                </Modal.Header>
                <Form
                    onSubmit={ handleSubmit(formData => modal === 'create' ? createMutation(formData) : updateMutation(formData)) }
                >
                    <Modal.Body>

                        <FloatingLabel
                            label="ID экзаменуемого"
                            className={ `mb-3 ${ errors.identifier ? 'is-invalid' : '' }` }
                        >
                            <Form.Control
                                type="text"
                                disabled={ updateLoading || createLoading }
                                { ...register('identifier') }
                            />
                            { errors.identifier &&
                                <Form.Text className="text-danger">{ errors.identifier.message }</Form.Text> }
                        </FloatingLabel>
                        <FloatingLabel
                            label="ФИО экзаменуемого"
                            className={ `mb-3 ${ errors.full_name ? 'is-invalid' : '' }` }
                        >
                            <Form.Control
                                type="text"
                                disabled={ updateLoading || createLoading }
                                { ...register('full_name') }
                            />
                            { errors.full_name &&
                                <Form.Text className="text-danger">{ errors.full_name.message }</Form.Text> }
                        </FloatingLabel>

                        <FloatingLabel
                            controlId="subject"
                            label="Предметы"
                            className={ `mb-3 ${ errors.subject ? 'is-invalid' : '' }` }
                        >
                            <Form.Select
                                disabled={ updateLoading || createLoading }
                                { ...register('subject') }>
                                <option value="">Выберите предмет</option>
                                { Array.isArray(subjects) && subjects?.map((subject) => (
                                    <option
                                        key={ subject.id }
                                        value={ subject.id }
                                    >{ subject.code } - { subject.subject }</option>
                                )) }
                            </Form.Select>
                            { errors.subject &&
                                <Form.Text className="text-danger">{ errors.subject.message }</Form.Text> }
                        </FloatingLabel>

                        <FloatingLabel
                            label="Дата"
                            className={ `mb-3 ${ errors.date ? 'is-invalid' : '' }` }
                        >
                            <Form.Control
                                type="date"
                                disabled={ updateLoading || createLoading }
                                { ...register('date') }
                            />
                            { errors.date &&
                                <Form.Text className="text-danger">{ errors.date.message }</Form.Text> }
                        </FloatingLabel>
                        <FloatingLabel
                            label="Время"
                            className={ `mb-3 ${ errors.time ? 'is-invalid' : '' }` }
                        >
                            <Form.Control
                                type="time"
                                disabled={ updateLoading || createLoading }
                                { ...register('time') }
                            />
                            { errors.time &&
                                <Form.Text className="text-danger">{ errors.time.message }</Form.Text> }
                        </FloatingLabel>
                        <FloatingLabel
                            label="Продолжительность (min)"
                            className={ `mb-3 ${ errors.duration ? 'is-invalid' : '' }` }
                        >
                            <Form.Control
                                type="number"
                                disabled={ updateLoading || createLoading }
                                { ...register('duration', { valueAsNumber: true }) }
                            />
                        </FloatingLabel>
                        <FloatingLabel
                            label="Количество вопросов"
                            className={ `mb-3 ${ errors.questions ? 'is-invalid' : '' }` }
                        >
                            <Form.Control
                                type="number"
                                disabled={ updateLoading || createLoading }
                                { ...register('questions', { valueAsNumber: true }) }
                            />
                        </FloatingLabel>
                    </Modal.Body>
                    <Modal.Footer>
                        <Button
                            variant="secondary"
                            type="button"
                            disabled={ updateLoading || createLoading }
                            className="center gap-2 py-2 px-3"
                            onClick={ modalClose }
                        >
                            <FaX/> Отменить
                        </Button>
                        <Button
                            variant={ modal === 'create' ? "success" : "primary" }
                            type="submit"
                            disabled={ updateLoading || createLoading }
                            className="center gap-2 py-2 px-3"
                        >
                            { modal === 'create' ? <><FaPlus/> Создать</> : <><FaEdit/> Изменить</> }
                        </Button>
                    </Modal.Footer>
                </Form>
            </Modal>
            <Modal
                show={ modal === "delete" }
                onHide={ () => setModal("") }
                centered
                animation
                backdrop="static"
            >
                <Modal.Header closeButton>
                    <h5>
                        Удалить экзаменуемого
                    </h5>
                </Modal.Header>
                <Modal.Body>
                    <div>Вы уверены, что хотите удалить экзаменуемого?</div>
                    <textarea
                        className="form-control mt-3"
                        placeholder="Причина удаления"
                        rows={ 3 }
                        />
                </Modal.Body>
                <Modal.Footer>
                    <Button
                        variant="secondary"
                        type="button"
                        disabled={ deleteLoading }
                        className="center gap-2 py-2 px-3"
                        onClick={ () => setModal("") }
                    >
                        <FaX/> Отменить
                    </Button>
                    <Button
                        variant="danger"
                        type="button"
                        disabled={ deleteLoading }
                        className="center gap-2 py-2 px-3"
                        onClick={ () => deleteMutation() }
                    >
                        <FaTrash/> Удалить
                    </Button>
                </Modal.Footer>
            </Modal>
            <Container fluid>
                <Card className="animate__animated animate__faster animate__fadeIn shadow">
                    <Card.Header className="d-flex justify-content-between align-items-center">
                        <p className="fs-5 mb-0">Экзаменационная сессия: <b>{ examSession?.name }</b></p>
                        <Button
                            className="btn-icon"
                            variant="danger"
                            disabled={ isDeleting }
                            onClick={ () => deleteExamSession(idx!) }
                        >
                            <FaTrash/>
                        </Button>
                    </Card.Header>
                    <Card.Body>
                        { isFetching && (
                            <div className="d-flex justify-content-center">
                                <ScaleLoader
                                    color="#0096DB"
                                    height={ 15 }
                                />
                            </div>
                        ) }

                        { isError && (
                            <Alert variant="danger">
                                <p className="mb-0">
                                    <b>Ошибка: </b>
                                    { (error as AxiosError<GenericResponse>).response?.data.message || (error as AxiosError).message }
                                </p>
                            </Alert>
                        ) }

                        { examSession && (
                            <Row>
                                <Col>
                                    <FloatingLabel
                                        label="Название"
                                        className="mb-3"
                                    >
                                        <Form.Control
                                            value={ examSession?.name }
                                            disabled
                                        />
                                    </FloatingLabel>
                                </Col>
                                <Col>
                                    <FloatingLabel
                                        label="Тип экзамена"
                                        className="mb-3"
                                    >
                                        <Form.Control
                                            value={ examSession?.examType }
                                            disabled
                                        />
                                    </FloatingLabel>
                                </Col>
                                <hr/>
                            </Row>
                        ) }
                        { examSession && (

                            <Row>

                                <StatisticChart idx={ idx }/>

                            </Row>
                        ) }
                        { examinees && (
                            <>
                                <hr/>
                                <div className="d-flex flex-column flex-md-row align-items-center justify-content-between mb-3">
                                    <h5 className="d-flex gap-2 align-items-center">
                                        <FaUsers className="text-primary"/> Экзаменуемые
                                    </h5>
                                    <div className="d-flex flex-column flex-md-row gap-3">
                                        <Button
                                            as={ Link }
                                            variant="warning"
                                            className="center gap-2"
                                            disabled={ isFetching || subjectIsFetching }
                                            to={ `/exam-sessions/${ idx }/bulk-upload` }
                                        >
                                            <FaUserPlus/>
                                        </Button>
                                        <Button
                                            variant="success"
                                            onClick={ actionCreate }
                                            className="center gap-2"
                                            disabled={ isFetching || subjectIsFetching }
                                        >
                                            <FaPlus/>
                                            Добавить
                                        </Button>
                                        <Button
                                            variant="primary"
                                            onClick={ () => refetchExaminees() }
                                            className="center gap-2"
                                            disabled={ isFetching }
                                        >
                                            <FaRepeat/>
                                            Обновить
                                        </Button>
                                        <Button
                                            variant="info"
                                            onClick={ () => fetchExamResults() }
                                            className="center gap-2"
                                            disabled={ isFetchingExamResults }
                                        >
                                            { isFetchingExamResults ? <div className="d-flex align-items-center">
                                                <ClipLoader
                                                    color="#fff"
                                                    size={ 15 }
                                                />
                                            </div> : <FaFileExcel/> }
                                            Экспорт результатов
                                        </Button>
                                        <Button
                                            variant="secondary"
                                            onClick={ () => fetchExamCredentials() }
                                            disabled={ isFetchingExamCredentials }
                                            className="center gap-2"
                                        >
                                            <FaPrint/>Экспорт реквизитов для входа
                                        </Button>
                                    </div>
                                </div>
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
                                    <DataTable<IExamSessionExaminee>
                                        headers={ tableHeaders }
                                        data={ objects }
                                        isFetching={ isFetchingExaminees }
                                        isError={ isErrorExaminees }
                                        error={ isErrorExaminees as AxiosError<ErrorResponse> }
                                    />
                                </InfiniteScroll>
                            </>
                        ) }
                    </Card.Body>
                </Card>
            </Container>
        </>
    );
};

export default ExamSessionDetailPage;