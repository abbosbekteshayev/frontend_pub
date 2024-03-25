import { useCallback, useEffect, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { useParams } from "react-router-dom";
import { AiFillApi } from "react-icons/ai";
import useStateContext from "@/hooks/useStateContext.tsx";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery } from "@tanstack/react-query";
import { toast } from "react-toastify";
import { AxiosError } from "axios";
import { DataTableHeadersType, ErrorResponse, GenericResponse } from "@/types";
import { Button, Card, Container, FloatingLabel, Form, InputGroup, Modal } from "react-bootstrap";
import { FaPlus, FaRepeat, FaTrash, FaX } from "react-icons/fa6";
import { FaEdit } from "react-icons/fa";
import { ComputerInput, computerSchema } from "@/schemas/Computer.schema.ts";
import { ACTIONS } from "@/utils/constants.ts";
import { Computer } from "@/types/entities.ts";
import useCheckPermission from "@/hooks/useCheckPermission.tsx";
import DataTable from "@/components/ui/DataTable.tsx";
import useAxios from "@/hooks/useAxios.ts";

export const ComputersListPage = () => {
    const { dispatch } = useStateContext();
    const { idx } = useParams();
    const checkPermission = useCheckPermission();
    const axios = useAxios();

    const [modal, setModal] = useState<"" | "delete" | "update" | 'create'>("");
    const [selectedIdx, setSelectedIdx] = useState<null | string>(null);
    const [checkedComputers, setCheckedComputers] = useState<[]>([]);
    const [search, setSearch] = useState<{ room: string, ip: string }>({ room: '', ip: '' });

    useEffect(() => {
        dispatch({
            type: ACTIONS.SET_BREADCRUMBS,
            payload: [
                { label: 'Компьютеры', path: '/computers' }
            ]
        })
    }, [dispatch]);

    const { register, setValue, setError, setFocus, handleSubmit, reset, formState: { errors } } = useForm({
        resolver: zodResolver(computerSchema),
        defaultValues: {
            ip: "",
            room: "",
        }
    })

    const {
        data: rooms,
        isError: roomsHasError,
        refetch: roomsRefetch,
        error: roomsError
    } = useQuery({
        queryKey: ['rooms-computer'],
        enabled: false,
        queryFn: async () => {
            const url = idx ? `/core/rooms/${ idx }` : `/core/rooms/all`
            const { data } = await axios.get(url)
            return data
        },
        select: (data) => idx ? data.data.room : data.data.rooms
    })

    useEffect(() => {
        if (roomsHasError) {
            toast.error((roomsError as AxiosError<GenericResponse>)?.response?.data.message || (roomsError as AxiosError)?.message)
        }
    }, [roomsHasError, roomsError]);

    const { data: computers, isFetching, isError, error, refetch } = useQuery({
        queryKey: ['computers', `${ idx }`],
        keepPreviousData: true,
        queryFn: async () => {
            const url = idx ? `/core/rooms/${ idx }` : `/core/computers`
            const { data } = await axios.get(url)
            return data
        },
        select: (data) => idx ? data.data.room.computers : data.data.computers
    })

    const filteredComputers = useMemo(() => {
        if (idx) {
            return computers?.filter((computer: Computer) => {
                return computer.ip.toLowerCase().includes(search.ip.toLowerCase());
            })
        }

        return computers?.filter((computer: Computer) => {
            return computer?.room?.name.toLowerCase().includes(search.room.toLowerCase()) && computer.ip.toLowerCase().includes(search.ip.toLowerCase())
        })
    }, [computers, search.ip, search.room])

    const {
        mutate: createMutation,
        isLoading: createLoading
    } = useMutation({
        mutationFn: async (data: ComputerInput) => {
            const response = await axios.post(`/core/computers`, data)
            return response.data
        },
        onSuccess: () => {
            setModal("")
            reset()
            toast.success("Компьютер успешно создан")
            refetch()
        },
        onError: (error: AxiosError<ErrorResponse>) => {
            if (Array.isArray(error.response?.data.errors)) {
                error.response?.data.errors.forEach((error) => {
                    setError((error.path[error.path.length - 1] as keyof ComputerInput), { message: error.message })
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
        mutationFn: async (data: ComputerInput) => {
            const response = await axios.patch(`/core/computers/${ selectedIdx }`, data)
            return response.data
        },
        onSuccess: () => {
            setModal("")
            reset()
            setSelectedIdx(null)
            toast.success("Компьютер успешно обновлен")
            refetch()
        },
        onError: (error: AxiosError<ErrorResponse>) => {
            if (Array.isArray(error.response?.data.errors)) {
                error.response?.data.errors.forEach((error) => {
                    setError((error.path[error.path.length - 1] as keyof ComputerInput), { message: error.message })
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
        mutationFn: async (idx: string) => {
            await axios.delete(`/core/computers/${ idx }`)
        },
        onSuccess: () => {
            setModal("")
            setSelectedIdx(null)
            refetch()
            toast.success("Компьютер успешна удален")
        },
        onError: (error: AxiosError<GenericResponse>) => {
            toast.error(error.response?.data.message || error.message)
        }
    })

    const actionUpdate = useCallback((computerID: string) => {
        setSelectedIdx(computerID)
        const computer = computers?.find((computer: Computer) => computer.id === computerID)
        if (computer) {
            roomsRefetch().then(() => {
                setModal("update")
                setValue('ip', computer.ip)
                setValue('room', idx ? idx : computer.room.id)
                setFocus('ip')
            })
        }
    }, [computers, roomsRefetch, setValue, idx, setFocus])

    const actionCreate = useCallback(() => {
        roomsRefetch().then(() => {
            setModal("create")
            setFocus('ip')
        })
    }, [setModal, setFocus, roomsRefetch])

    const actionDelete = useCallback((idx: string) => {
        setSelectedIdx(idx)
        setModal("delete")
    }, [])

    const modalClose = useCallback(() => {
        setModal("")
        setSelectedIdx(null)
        reset()
    }, [setModal, setSelectedIdx, reset])

    const handleActivation = useCallback(async (idx: string, active: boolean) => {
        try {
            const response = await axios.patch(`/core/computers/${ idx }`, { active })

            if (response.data) {
                refetch()
                toast.success("Компьютер успешно обновлен")
            }
        }
        catch (error: AxiosError<ErrorResponse>) {
            toast.error(error.response?.data.message || error.message)
        }
    }, [refetch])

    const tableHeaders = useMemo(() => {
        const columns: DataTableHeadersType<Computer>[] = [
            {
                label: 'IP',
                key: 'ip',
                searchable: () => (
                    <InputGroup>
                        <Form.Control
                            type="text"
                            placeholder="Поиск по IP"
                            value={ search.ip }
                            onChange={ e => setSearch({ ...search, ip: e.target.value }) }
                        />
                    </InputGroup>
                )
            },
            {
                label: 'Действия',
                key: 'actions',
                render: (row: Computer) => (
                    <div className="d-flex align-items-center justify-content-end gap-2">
                        { row.active ? <span className="badge bg-success">Активный</span> :
                            <span className="badge bg-danger">Не активный</span> }
                        <Form.Switch>
                            <Form.Switch.Input
                                checked={ row.active }
                                onChange={ () => handleActivation(row.id, !row.active) }
                                disabled={ updateLoading }
                                className="btn-icon"
                            />
                        </Form.Switch>
                        { checkPermission(1103) &&
                            <Button
                                variant="info"
                                onClick={ () => actionUpdate(row.id) }
                                disabled={ updateLoading }
                                className="btn-icon"
                            >
                                <FaEdit/>
                            </Button> }
                        { checkPermission(1104) &&
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
            },
        ]

        if (!idx) {
            columns.unshift({
                label: 'Аудитория',
                key: 'room.name',
                render: (row: Computer) => (
                    <div className="d-flex align-items-center justify-content-center">
                        { row.room.name }
                    </div>
                ),
                searchable: () => (
                    <InputGroup>
                        <Form.Control
                            type="text"
                            placeholder="Поиск по аудитории"
                            value={ search.room }
                            onChange={ e => setSearch({ ...search, room: e.target.value }) }
                        />
                    </InputGroup>
                ),
            })
        }

        return columns;
    }, [search, actionUpdate, actionDelete, idx, handleActivation, updateLoading, deleteLoading]);

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
                        { modal === 'create' ? 'Создать' : 'Изменить' } компьютер
                    </h5>
                </Modal.Header>
                <Form
                    onSubmit={ handleSubmit(formData => modal === 'create' ? createMutation(formData) : updateMutation(formData)) }
                >
                    <Modal.Body>
                        <FloatingLabel
                            controlId="ip"
                            label="IP"
                            className={ `mb-3 ${ errors.ip ? 'is-invalid' : '' }` }
                        >
                            <Form.Control
                                type="text"
                                disabled={ updateLoading || createLoading }
                                { ...register('ip') }
                            />
                            { errors.ip &&
                                <Form.Text className="text-danger">{ errors.ip.message }</Form.Text> }
                        </FloatingLabel>
                        <FloatingLabel
                            controlId="room"
                            label="Аудитория"
                            className={ `mb-3 ${ errors.room ? 'is-invalid' : '' }` }
                        >
                            { idx ?
                                <Form.Select
                                    disabled={ updateLoading || createLoading }
                                    { ...register('room')
                                    }>
                                    <option
                                        selected
                                        value={ idx }
                                    >
                                        { rooms?.name }
                                    </option>
                                </Form.Select> :
                                <Form.Select
                                    disabled={ updateLoading || createLoading }
                                    { ...register('room') }
                                >
                                    <option value="">Выберите аудиторию</option>
                                    { Array.isArray(rooms) && rooms?.map((room) => (
                                        <option
                                            key={ room.id }
                                            value={ room.id }
                                        >
                                            { room.name }
                                        </option>
                                    )) }
                                </Form.Select> }
                            { errors.room &&
                                <Form.Text className="text-danger">{ errors.room.message }</Form.Text>
                            }
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
                        Удалить компьютер
                    </h5>
                </Modal.Header>
                <Modal.Body>
                    Вы уверены, что хотите удалить компьютер?
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
                        <h5>{ idx ? "Компьютеры данной комнаты" : "Все компьютеры" }</h5>
                        <div className="d-flex gap-2">
                            { checkPermission(1101) &&
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
                        <div className="tableHeightFixer overflow-auto mb-2">
                            <DataTable
                                headers={ tableHeaders }
                                data={ filteredComputers }
                                isFetching={ isFetching }
                                isError={ isError }
                                error={ error as AxiosError<GenericResponse> }
                                selectable={ [checkedComputers, setCheckedComputers] }
                            />
                        </div>
                        <div className="d-flex gap-1">
                            <Button
                                variant="info"
                                disabled={ !checkedComputers.length || updateLoading }
                                onClick={ () => {
                                    handleActivation(checkedComputers)
                                } }
                                className="btn-icon"
                            >
                                <AiFillApi/>
                            </Button>
                            <Button
                                variant="danger"
                                disabled={ !checkedComputers.length || deleteLoading }
                                onClick={ () => {
                                    if (checkedComputers.length > 0) {
                                        setModal("delete")
                                    } else {
                                        toast.error("Выберите компьютеры")
                                    }
                                } }
                                className="btn-icon"
                            >
                                <FaTrash/>
                            </Button>
                        </div>

                    </Card.Body>
                </Card>
            </Container>
        </>
    );
};

export default ComputersListPage;