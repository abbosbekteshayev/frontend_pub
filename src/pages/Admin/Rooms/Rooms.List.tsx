import { useCallback, useEffect, useMemo, useState } from "react";
import useStateContext from "@/hooks/useStateContext.tsx";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { useMutation, useQuery } from "@tanstack/react-query";
import authAxios from "@/utils/axios.ts";
import { toast } from "react-toastify";
import { AxiosError } from "axios";
import { ErrorResponse, GenericResponse } from "@/types";
import { Button, Card, Container, FloatingLabel, Form, Modal, Table } from "react-bootstrap";
import { FaPlus, FaRepeat, FaTrash, FaX } from "react-icons/fa6";
import { FaEdit, FaSearch } from "react-icons/fa";
import { ScaleLoader } from "react-spinners";
import { RoomInput, roomSchema } from "@/schemas/Room.schema.ts";
import { ACTIONS } from "@/utils/constants.ts";
import { axiosZodErrorHandler } from "@/utils/handlerError.ts";
import { Room } from "@/types/entities.ts";
import { useNavigate } from "react-router-dom";
import useCheckPermission from "@/hooks/useCheckPermission.tsx";
import { UserRole } from "@/schemas/Users.schema.ts";
import DataTable from "@/components/ui/DataTable.tsx";

export const RoomsListPage = () => {
    const { state: {authUser}, dispatch } = useStateContext();
    const navigate = useNavigate();
    const checkPermission = useCheckPermission();

    const [modal, setModal] = useState<"" | "delete" | "update" | 'create'>("");
    const [selectedIdx, setSelectedIdx] = useState<null | string>(null);

    useEffect(() => {
        dispatch({
            type: ACTIONS.SET_BREADCRUMBS,
            payload: [
                { label: 'Аудитории', path: '/rooms' }
            ]
        })
    }, [dispatch]);

    const { register, setValue, setError, setFocus, handleSubmit, reset, watch, formState: { errors } } = useForm({
        resolver: zodResolver(roomSchema),
        defaultValues: {
            name: '',
            capacity: 1,
            branch: '',
            is_exam_room: false,
            timetable_id: '',
        }
    })

    const {
        data: branches,
        isError: branchesHasError,
        refetch: branchesRefetch,
        error: branchesError
    } = useQuery({
        queryKey: ['branches-room'],
        enabled: false,
        queryFn: async () => {
            const { data } = await authAxios.get('/core/branches/all')
            return data
        },
        select: (data) => data.data.branches
    })

    useEffect(() => {
        if (branchesHasError) {
            toast.error((branchesError as AxiosError<GenericResponse>)?.response?.data.message || (branchesError as AxiosError)?.message)
        }
    }, [branchesHasError, branchesError]);

    const { data: rooms, isFetching, isError, error, refetch } = useQuery({
        queryKey: ['rooms'],
        queryFn: async () => {
            const { data } = await authAxios.get('/core/rooms')
            return data
        },
        select: (data) => data.data.rooms
    })

    const branch = watch("branch");

    const showBranch = useMemo(() => {
        return authUser?.roles.includes(UserRole.ADMIN) || (authUser?.roles.includes(UserRole.STAFF) && authUser?.staff.branch_ids.length > 1)
    }, [authUser, branch])

    const {
        mutate: createMutation,
        isLoading: createLoading
    } = useMutation({
        mutationFn: async (data: RoomInput) => {
            const response = await authAxios.post(`/core/rooms`, data)
            return response.data
        },
        onSuccess: () => {
            setModal("")
            reset()
            toast.success("Аудитория успешно создана")
            refetch()
        },
        onError: (error: AxiosError<ErrorResponse>) => axiosZodErrorHandler(error, setError)
    })

    const {
        mutate: updateMutation,
        isLoading: updateLoading
    } = useMutation({
        mutationFn: async (data: RoomInput) => {
            const response = await authAxios.patch(`/core/rooms/${ selectedIdx }`, data)
            return response.data
        },
        onSuccess: () => {
            setModal("")
            reset()
            setSelectedIdx(null)
            toast.success("Аудитория успешно обновлена")
            refetch()
        },
        onError: (error: AxiosError<ErrorResponse>) => {
            if (Array.isArray(error.response?.data.errors)) {
                error.response?.data.errors.forEach((error) => {
                    setError((error.path[error.path.length - 1] as keyof RoomInput), { message: error.message })
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
            await authAxios.delete(`/core/rooms/${ selectedIdx }`)
        },
        onSuccess: () => {
            setModal("")
            setSelectedIdx(null)
            refetch()
            toast.success("Аудитория успешна удалена")
        },
        onError: (error: AxiosError<GenericResponse>) => {
            toast.error(error.response?.data.message || error.message)
        }
    })

    const actionUpdate = useCallback((idx: string) => {
        setSelectedIdx(idx)
        const room = rooms?.find((room: Room) => room.id === idx)
        if (room) {
            branchesRefetch().then(() => {
                setModal("update")
                setValue('name', room.name)
                setValue('capacity', room.capacity)
                setValue('branch', room.branch.id)
                setValue('is_exam_room', room.is_exam_room)
                setValue('timetable_id', room.timetable_id)
                setFocus('name')
            })
        }
    }, [setSelectedIdx, setValue, setFocus, rooms, branchesRefetch])

    const actionCreate = useCallback(() => {
        branchesRefetch().then(() => {
            setModal("create")
            setFocus('name')
        })
    }, [setModal, setFocus, branchesRefetch])

    const actionDelete = useCallback((idx: string) => {
        setSelectedIdx(idx)
        setModal("delete")
    }, [])

    const modalClose = useCallback(() => {
        setModal("")
        setSelectedIdx(null)
        reset()
    }, [setModal, setSelectedIdx, reset])

    const tableHeaders = useMemo(() => {
        const headers = [
            {
                key: 'name',
                label: 'Аудитория',
            },
            {
                key: 'capacity',
                label: 'Вместимость',
            },
            {
                key: 'computers_count',
                label: 'Количество компьютеров',
            },
            {
                key: 'actions',
                label: 'Действия',
                className: 'text-end',
                render: (row) => (
                    <div className="d-flex align-items-center justify-content-end gap-2">
                        <Button
                            variant="success"
                            onClick={ () => navigate(`/rooms/${ row.id }`) }
                            className="btn-icon"
                        >
                            <FaSearch/>
                        </Button>
                        { checkPermission(1203) &&
                            <Button
                                variant="info"
                                onClick={ () => actionUpdate(row.id) }
                                disabled={ updateLoading }
                                className="btn-icon"
                            >
                                <FaEdit/>
                            </Button> }
                        { checkPermission(1204) &&
                            <Button
                                variant="danger"
                                disabled={ deleteLoading }
                                onClick={ () => actionDelete(row.id) }
                                className="btn-icon"
                            >
                                <FaTrash/>
                            </Button> }
                    </div>
                )
            }
        ];

        if(showBranch) {
            headers.splice(0, 0, {
                key: 'branch',
                label: 'Филиал',
                render: (row) => row.branch?.name.ru
            })
        }

        return headers;
    }, [showBranch, navigate, actionUpdate, updateLoading, actionDelete, deleteLoading, checkPermission])

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
                        { modal === 'create' ? 'Создать' : 'Изменить' } аудиторию
                    </h5>
                </Modal.Header>
                <Form
                    onSubmit={ handleSubmit(formData => modal === 'create' ? createMutation(formData) : updateMutation(formData)) }
                >
                    <Modal.Body>
                        <FloatingLabel
                            controlId="name"
                            label="Название"
                            className={ `mb-3 ${ errors.name ? 'is-invalid' : '' }` }
                        >
                            <Form.Control
                                type="text"
                                disabled={ updateLoading || createLoading }
                                { ...register('name') }
                            />
                            { errors.name &&
                                <Form.Text className="text-danger">{ errors.name.message }</Form.Text> }
                        </FloatingLabel>
                        <FloatingLabel
                            controlId="branch"
                            label="Филиал"
                            className={ `mb-3 ${ errors.branch ? 'is-invalid' : '' }` }
                        >
                            <Form.Select
                                disabled={ updateLoading || createLoading }
                                { ...register('branch') }>
                                <option value="">Выберите филиала</option>
                                { Array.isArray(branches) && branches?.map((branch) => (
                                    <option
                                        key={ branch.id }
                                        value={ branch.id }
                                    >{ branch.name.ru }</option>
                                )) }
                            </Form.Select>
                            { errors.branch &&
                                <Form.Text className="text-danger">{ errors.branch.message }</Form.Text> }
                        </FloatingLabel>

                        <FloatingLabel
                            controlId="capacity"
                            label="Вместимость"
                            className={ `mb-3 ${ errors.capacity ? 'is-invalid' : '' }` }
                        >
                            <Form.Control
                                type="number"
                                disabled={ updateLoading || createLoading }
                                { ...register('capacity', { valueAsNumber: true }) }
                            />
                            { errors.capacity &&
                                <Form.Text className="text-danger">{ errors.capacity.message }</Form.Text> }
                        </FloatingLabel>
                        <FloatingLabel
                            controlId="timetable_id"
                            label="ID расписание"
                            className={ `mb-3 ${ errors.timetable_id ? 'is-invalid' : '' }` }
                        >
                            <Form.Control
                                type="text"
                                disabled={ updateLoading || createLoading }
                                { ...register('timetable_id') }
                            />
                            { errors.timetable_id &&
                                <Form.Text className="text-danger">{ errors.timetable_id.message }</Form.Text> }
                        </FloatingLabel>
                        <Form.Label>
                            <Form.Check>
                                <Form.Check.Input
                                    type="checkbox"
                                    disabled={ updateLoading || createLoading }
                                    { ...register('is_exam_room') }
                                />
                            </Form.Check>
                            <span className="ms-2">Экзаменационная аудитория</span>
                        </Form.Label>
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
                        Удалить комнату
                    </h5>
                </Modal.Header>
                <Modal.Body>
                    Вы уверены, что хотите удалить комнату?
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
            <Container fluid="lg">
                <Card className="animate__animated animate__faster animate__fadeIn shadow">
                    <Card.Header className="d-flex justify-content-between align-items-center">
                        <h5>Все аудитории</h5>
                        <div className="d-flex gap-2">
                            { checkPermission(1201) &&
                                <Button
                                    variant="success"
                                    className="btn-icon"
                                    onClick={ actionCreate }
                                >
                                    <FaPlus/>
                                </Button> }
                            <Button
                                variant="info"
                                className="btn-icon"
                                onClick={ () => refetch() }
                            >
                                <FaRepeat/>
                            </Button>
                        </div>
                    </Card.Header>
                    <Card.Body>
                        <DataTable
                            headers={ tableHeaders }
                            data={ rooms }
                            isFetching={ isFetching }
                            isError={ isError }
                            error={ error }
                        />
                    </Card.Body>
                </Card>
            </Container>
        </>
    );
};

export default RoomsListPage;