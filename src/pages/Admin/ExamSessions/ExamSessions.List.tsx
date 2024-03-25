import { useCallback, useEffect, useMemo, useState } from 'react';
import useStateContext from "@/hooks/useStateContext.tsx";
import { Badge, Button, Card, Container, FloatingLabel, Form, InputGroup, Modal } from "react-bootstrap";
import { useMutation, useQuery } from "@tanstack/react-query";
import {
    activationExamSessionFn,
    ExamSessions,
    getAllExamSessionsFn,
    useDeleteExamSessionMutation,
    useUpdateExamSessionMutation
} from "@/api/ExamSession.api.ts";
import { toast } from "react-toastify";
import { Link } from "react-router-dom";
import { FaRepeat, FaTrash, FaX } from "react-icons/fa6";
import { AxiosError } from "axios";
import { DataTableHeadersType, ErrorResponse, GenericResponse } from "@/types";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { ExamSessionUpdateInput, examSessionUpdateSchema } from "@/schemas/ExamSession.schema.ts";
import { FaEdit, FaInfoCircle } from "react-icons/fa";
import { ACTIONS } from "@/utils/constants.ts";
import useAxios from "@/hooks/useAxios.ts";
import useCheckPermission from "@/hooks/useCheckPermission.tsx";
import DataTable from "@/components/ui/DataTable.tsx";
import { Order } from "@/types/enums.ts";
import TableOrderButton from "@/components/ui/TableOrderButton.tsx";

const EXAM_TYPES = {
    final: 'Финальный',
    retake: "Пересдача",
    other: "Другое"
}

enum ESearchBy {
    NAME = "name",
    EXAM_TYPE = "examType"
}

enum ESortBy {
    STATUS = "status",
}

const ExamSessionList = () => {
    const { dispatch } = useStateContext();
    const axios = useAxios();
    const checkPermission = useCheckPermission();

    const [modal, setModal] = useState<"" | "delete" | "update">("");
    const [selectedIdx, setSelectedIdx] = useState<null | string>(null);
    const [order, setOrder] = useState<Order | null>(null);
    const [sortBy, setSortBy] = useState<string>("");
    const [search, setSearch] = useState<string>("");
    const [searchBy, setSearchBy] = useState(ESearchBy.NAME);

    const { register, setValue, setError, setFocus, handleSubmit, reset, watch, formState: { errors } } = useForm({
        resolver: zodResolver(examSessionUpdateSchema),
        defaultValues: {
            name: "",
            examType: "",
            only_exam_room: false,
            branch: "",
            rooms: []
        }
    })

    useEffect(() => {
        dispatch({
            type: ACTIONS.SET_BREADCRUMBS,
            payload: [
                { label: 'Экзаменационные сессии', path: '/exam-sessions' }
            ]
        })
    }, [dispatch]);

    const { data: examSessions, isFetching, isError, refetch, error } = useQuery({
        queryKey: ['examSessions'],
        queryFn: getAllExamSessionsFn,
        select: (data) => data.data.examSessions,
    })

    const onSearch = useCallback((field: string, value: string) => {
        setSearchBy(field);
        setSearch(value);
    }, []);

    const onSort = useCallback((field: string) => {

        setOrder(order === Order.ASC ? Order.DESC : Order.ASC);
        setSortBy(field);
    }, [order]);

    const objects = useMemo(() => {
        const searched = examSessions?.filter((examSession) => {
            if(searchBy === ESearchBy.BRANCH) {
                return examSession.branch.id === search;
            }

            return examSession[searchBy as keyof ExamSessions].toLowerCase().includes(search.toLowerCase());
        });

        if (sortBy) {
            return searched?.sort((a, b) => {
                if(sortBy === ESortBy.STATUS) {
                    return order === Order.ASC ? (a.active ? -1 : 1) : (a.active ? 1 : -1);
                }

                if (order === Order.ASC) {
                    return a[sortBy] > b[sortBy] ? 1 : -1;
                }
                else {
                    return a[sortBy] < b[sortBy] ? 1 : -1;
                }
            });
        }

        return searched;
    }, [examSessions, order, search, searchBy, sortBy]);

    const {
        mutate: handleActivation,
        isLoading: activationIsLoading
    } = useMutation({
        mutationFn: activationExamSessionFn,
        onSuccess: () => {
            refetch()
        },
        onError(error: AxiosError<GenericResponse>) {
            toast.error(error.response?.data.message || error.message)
        }
    })

    const branch = watch("branch");

    const {
        data: branches,
    } = useQuery({
        queryKey: ['branches'],
        enabled: checkPermission(102),
        queryFn: async () => {
            const { data } = await axios.get('/core/branches/all');
            return data;
        },
        select: ({ data }) => data.branches
    })

    const {
        data: rooms,
    } = useQuery({
        queryKey: ['rooms', branch],
        enabled: !!branch,
        queryFn: async ({ queryKey }) => {
            const { data } = await axios.get(`/core/rooms/all/${ queryKey[1] }`)
            return data
        },
        select: (data) => data.data.rooms
    })

    const onlyExamRooms = watch('only_exam_room')

    useEffect(() => {
        if (!onlyExamRooms) {
            setValue('rooms', [])
        }
    }, [setValue, onlyExamRooms]);

    const {
        mutate: updateMutation,
        isLoading: updateLoading
    } = useUpdateExamSessionMutation({
        onSuccess: () => {
            setModal("")
            reset()
            setSelectedIdx(null)
            toast.success("Экзаменационная сессия успешно обновлена")
            refetch()
        },
        onError: (error: AxiosError<ErrorResponse>) => {
            if (Array.isArray(error.response?.data.errors)) {
                error.response?.data.errors.forEach((error) => {
                    setError((error.path[error.path.length - 1] as keyof ExamSessionUpdateInput), { message: error.message })
                })
            } else {
                toast.error(error.response?.data.message || error.message)
            }
        }
    })

    const {
        mutate: deleteMutation,
        isLoading: deleteLoading
    } = useDeleteExamSessionMutation({
        onSuccess: () => {
            setModal("")
            setSelectedIdx(null)
            refetch()
            toast.success("Экзаменационная сессия успешно удалена")
        },
        onError: (error) => {
            toast.error(error.response?.data.message || error.message)
        }
    })

    const actionUpdate = useCallback((idx: string) => {
            setSelectedIdx(idx)
            setModal("update")
            const examSession = examSessions?.find((examSession) => examSession.id === idx)
            if (examSession) {
                setValue("branch", examSession.branch.id)
                setValue("name", examSession.name)
                setValue("examType", examSession.examType)
                setFocus("name")
                setValue("only_exam_room", examSession.only_exam_room)
                setTimeout(() => {
                    setValue("rooms", examSession.rooms.map(room => room.id))
                }, 100)
            }
        }, [examSessions, setFocus, setValue]
    )

    useEffect(() => {
        if (branch) {
            setValue("rooms", [])
        }
    }, [branch, setValue]);

    useEffect(() => {
        if (modal === "update" && branch && rooms) {
            const examSession = examSessions?.find((examSession) => examSession.id === selectedIdx)
            setValue("rooms", examSession.rooms.map((room) => room.id))
        }
    }, [branch, examSessions, modal, rooms, selectedIdx, setValue]);

    const actionDelete = useCallback((idx: string) => {
        setSelectedIdx(idx)
        setModal("delete")
    }, [])

    const tableHeaders = useMemo(() => {
        const columns: DataTableHeadersType<ExamSessions>[] = [
            {
                key: 'name',
                label: 'Название',
                searchable: () => (
                    <InputGroup>
                        <Form.Control
                            type="text"
                            placeholder="Поиск по названию"
                            value={ searchBy === ESearchBy.NAME ? search : "" }
                            onChange={ e => onSearch(ESearchBy.NAME, e.target.value) }
                        />
                    </InputGroup>
                )
            },
            {
                key: 'examType',
                label: 'Тип экзамена',
                render: (row) => EXAM_TYPES[row.examType],
                searchable: () => (
                    <Form.Select
                        value={ searchBy === ESearchBy.EXAM_TYPE ? search : "" }
                        onChange={ e => onSearch(ESearchBy.EXAM_TYPE, e.target.value) }
                    >
                        <option value="">Все</option>
                        { Object.entries(EXAM_TYPES).map(([key, value]) => (
                            <option
                                key={ key }
                                value={ key }
                            >
                                { value }
                            </option>
                        )) }
                    </Form.Select>
                )
            },
            {
                key: 'rooms',
                label: 'Аудитории',
                render: (row) => row.rooms?.map((room, index) => (
                    <Badge
                        key={ index }
                        bg="info"
                        className="me-1"
                    >
                        { room.name }
                    </Badge>
                ))
            },
            {
                key: 'status',
                sortable: () => (
                    <TableOrderButton
                        label="Статус"
                        sortBy={ sortBy }
                        order={ order }
                        field={ ESortBy.STATUS }
                        onClick={ () => onSort(ESortBy.STATUS) }
                    />
                ),
                render: (row) => (
                    <Form.Switch>
                        <Form.Switch.Input
                            checked={ row.active }
                            disabled={ activationIsLoading }
                            onChange={ () => handleActivation(row.id) }
                        />
                    </Form.Switch>
                )
            },
            {
                key: 'actions',
                label: 'Действия',
                className: 'text-end',
                render: (row) => (
                    <div className="d-flex gap-2 justify-content-end align-items-center">
                        <Button
                            as={ Link }
                            className="btn-icon"
                            to={ `/exam-sessions/${ row.id }` }
                        >
                            <FaInfoCircle/>
                        </Button>
                        <Button
                            variant="info"
                            onClick={ () => actionUpdate(row.id) }
                            disabled={ updateLoading }
                            className="btn-icon"
                        >
                            <FaEdit/>
                        </Button>
                        <Button
                            variant="danger"
                            disabled={ deleteLoading }
                            onClick={ () => actionDelete(row.id) }
                            className="btn-icon"
                        >
                            <FaTrash/>
                        </Button>
                    </div>
                )
            }
        ]

        if (checkPermission(102)) {
            columns.splice(2, 0, {
                key: 'branch',
                label: 'Филиал',
                searchable: () => (
                    <Form.Select
                        value={ searchBy === ESearchBy.BRANCH ? search : "" }
                        onChange={ e => onSearch(ESearchBy.BRANCH, e.target.value) }
                    >
                        <option value="">Все</option>
                        { branches?.map((branch) => (
                            <option
                                key={ branch.id }
                                value={ branch.id }
                            >
                                { branch.name.ru }
                            </option>
                        )) }
                    </Form.Select>
                ),
                render: (row) => row.branch?.name.ru
            });
        }

        return columns;
    }, [checkPermission, searchBy, search, onSearch, sortBy, order, onSort, activationIsLoading, handleActivation, updateLoading, deleteLoading, actionUpdate, actionDelete, branches]);

    return (
        <>
            <Modal
                show={ modal === "update" }
                onHide={ () => setModal("") }
                centered
                animation
                backdrop="static"
            >
                <Modal.Header closeButton>
                    <h5>
                        Изменить экзаменационную сессию
                    </h5>
                </Modal.Header>
                <Form onSubmit={ handleSubmit(formData => updateMutation({ id: selectedIdx!, ...formData })) }>
                    <Modal.Body>
                        <FloatingLabel
                            controlId="name"
                            label="Название"
                            className={ `mb-3 ${ errors.name ? 'is-invalid' : '' }` }
                        >
                            <Form.Control
                                type="text"
                                { ...register('name') }
                            />
                            { errors.name && <Form.Text className="text-danger">{ errors.name.message }</Form.Text> }
                        </FloatingLabel>
                        <FloatingLabel
                            controlId="examType"
                            label="Тип экзамена"
                            className={ `mb-3 ${ errors.examType ? 'is-invalid' : '' }` }
                        >
                            <Form.Select
                                { ...register('examType') }
                            >
                                { Object.entries(EXAM_TYPES).map(([key, value]) => (
                                    <option
                                        key={ key }
                                        value={ key }
                                    >{ value }</option>
                                )) }
                            </Form.Select>
                            { errors.examType &&
                                <Form.Text className="text-danger">{ errors.examType.message }</Form.Text> }
                        </FloatingLabel>

                        <Form.Check
                            type="checkbox"
                            label="Только аудитории"
                            { ...register('only_exam_room') }
                        />

                        <Form.Group className="mt-3">
                            <Form.Label>Аудитории</Form.Label>
                            <Form.Control
                                disabled={ !onlyExamRooms }
                                as="select"
                                multiple
                                { ...register('rooms') }
                            >
                                { rooms && rooms.length > 0 ? rooms?.map((room) => (
                                    <option
                                        key={ room.id }
                                        value={ room.id }
                                    >{ room.name }</option>
                                )) : (
                                    <option disabled>Нет доступных аудиторий</option>
                                ) }
                            </Form.Control>
                        </Form.Group>
                    </Modal.Body>
                    <Modal.Footer>
                        <Button
                            variant="secondary"
                            type="button"
                            disabled={ updateLoading }
                            className="center gap-2 py-2 px-3"
                            onClick={ () => setModal("") }
                        >
                            <FaX/> Отменить
                        </Button>
                        <Button
                            variant="primary"
                            type="submit"
                            disabled={ updateLoading }
                            className="center gap-2 py-2 px-3"
                        >
                            <FaEdit/> Изменить
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
                        Удалить экзаменационную сессию
                    </h5>
                </Modal.Header>
                <Modal.Body>
                    Вы уверены, что хотите удалить экзаменационную сессию?
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
                        onClick={ () => deleteMutation(selectedIdx!) }
                    >
                        <FaTrash/> Удалить
                    </Button>
                </Modal.Footer>
            </Modal>
            <Container fluid="lg">
                <Card className="animate__animated animate__faster animate__fadeIn shadow">
                    <Card.Header className="d-flex justify-content-between align-items-center">
                        <h5>
                            Экзаменационные сессии
                        </h5>
                        <Button
                            variant="info"
                            className="btn-icon"
                            onClick={ () => refetch() }
                        >
                            <FaRepeat/>
                        </Button>
                    </Card.Header>
                    <Card.Body>
                        <DataTable<ExamSessions>
                            headers={ tableHeaders }
                            data={ objects }
                            isFetching={ isFetching }
                            isError={ isError }
                            error={ error as AxiosError<GenericResponse> }
                        />
                    </Card.Body>
                </Card>
            </Container>
        </>
    );
};

export default ExamSessionList;