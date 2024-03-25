import { useCallback, useEffect, useMemo, useState } from "react";
import useStateContext from "@/hooks/useStateContext.tsx";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import {
    PermissionsCreateInput,
    permissionsCreateSchema,
    PermissionsUpdateInput
} from "@/schemas/Permissions.schema.ts";
import { useMutation, useQuery } from "@tanstack/react-query";
import authAxios from "@/utils/axios.ts";
import { toast } from "react-toastify";
import { AxiosError } from "axios";
import { ErrorResponse, GenericResponse } from "@/types";
import { Button, Card, Container, FloatingLabel, Form, Modal } from "react-bootstrap";
import { FaPlus, FaRepeat, FaTrash, FaX } from "react-icons/fa6";
import { FaEdit } from "react-icons/fa";
import { ACTIONS } from "@/utils/constants.ts";
import DataTable from "@/components/ui/DataTable.tsx";

export const PermissionsListPage = () => {
    const { dispatch } = useStateContext()

    const [modal, setModal] = useState<"" | "delete" | "update" | 'create'>("");
    const [selectedIdx, setSelectedIdx] = useState<null | string>(null);

    useEffect(() => {
        dispatch({
            type: ACTIONS.SET_BREADCRUMBS,
            payload: [
                { label: 'Пользователи', path: '/users' },
                { label: 'Разрешения', path: '/users/permissions' }
            ]
        })
    }, [dispatch]);

    const { register, setValue, setError, handleSubmit, reset, formState: { errors } } = useForm({
        resolver: zodResolver(permissionsCreateSchema),
        defaultValues: {
            label: "",
            permission: "",
            code: 0,
            entity: "",
        }
    })

    const { data: permissions, isFetching, isLoading, isError, refetch, error } = useQuery({
        queryKey: ['permissions'],
        queryFn: async () => {
            const { data } = await authAxios.get('/cabinet/permissions/all')
            return data
        },
        select: (data) => data.data.permissions
    })

    const {
        mutate: createMutation,
        isLoading: createLoading
    } = useMutation({
        mutationFn: async (data: PermissionsCreateInput) => {
            const response = await authAxios.post(`/cabinet/permissions`, data)
            return response.data
        },
        onSuccess: () => {
            setModal("")
            reset()
            toast.success("Разрешение успешно создан")
            refetch()
        },
        onError: (error: AxiosError<ErrorResponse>) => {
            if (Array.isArray(error.response?.data.errors)) {
                error.response?.data.errors.forEach((error) => {
                    setError((error.path[error.path.length - 1] as keyof PermissionsCreateInput), { message: error.message })
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
        mutationFn: async (data: PermissionsUpdateInput) => {
            const response = await authAxios.patch(`/cabinet/permissions/${ selectedIdx }`, data)
            return response.data
        },
        onSuccess: () => {
            setModal("")
            reset()
            setSelectedIdx(null)
            toast.success("Разрешение успешно обновлен")
            refetch()
        },
        onError: (error: AxiosError<ErrorResponse>) => {
            if (Array.isArray(error.response?.data.errors)) {
                error.response?.data.errors.forEach((error) => {
                    setError((error.path[error.path.length - 1] as keyof PermissionsUpdateInput), { message: error.message })
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
            await authAxios.delete(`/cabinet/permissions/${ selectedIdx }`)
        },
        onSuccess: () => {
            setModal("")
            setSelectedIdx(null)
            refetch()
            toast.success("Разрешение успешно удален")
        },
        onError: (error: AxiosError<GenericResponse>) => {
            toast.error(error.response?.data.message || error.message)
        }
    })

    const actionUpdate = useCallback((idx: string) => {
        setSelectedIdx(idx)
        setModal("update")
        const permission = permissions?.find((permission) => permission.code === idx)
        if (permission) {
            setValue('label', permission.label)
            setValue('permission', permission.permission)
            setValue('code', permission.code)
            setValue('entity', permission.entity)
        }
    }, [permissions, setValue, setSelectedIdx, setModal])

    const actionCreate = useCallback(() => {
        setModal("create")
    }, [])

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
        return [
            {
                key: 'label',
                label: 'Название',
            },
            {
                key: 'permission',
                label: 'Разрешение',
            },
            {
                key: 'code',
                label: 'Код',
            },
            {
                key: 'actions',
                label: 'Действия',
                className: 'text-end',
                render: (row) => (
                    <div className="d-flex gap-2 justify-content-end align-items-center">
                        <Button
                            variant="info"
                            onClick={ () => actionUpdate(row.code) }
                            disabled={ updateLoading }
                            className="btn-icon"
                        >
                            <FaEdit/>
                        </Button>
                        <Button
                            variant="danger"
                            disabled={ deleteLoading }
                            onClick={ () => actionDelete(row.code) }
                            className="btn-icon"
                        >
                            <FaTrash/>
                        </Button>
                    </div>
                )
            }
        ]
    }, [actionUpdate, actionDelete, updateLoading, deleteLoading]);

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
                        { modal === 'create' ? 'Создать' : 'Изменить' } разрешение
                    </h5>
                </Modal.Header>
                <Form
                    onSubmit={ handleSubmit(formData => modal === 'create' ? createMutation(formData) : updateMutation(formData)) }
                >
                    <Modal.Body>
                        <FloatingLabel
                            controlId="label"
                            label="Ярлык"
                            className={ `mb-3 ${ errors.label ? 'is-invalid' : '' }` }
                        >
                            <Form.Control
                                type="text"
                                disabled={ updateLoading || createLoading }
                                { ...register('label') }
                            />
                            { errors.label && <Form.Text className="text-danger">{ errors.label.message }</Form.Text> }
                        </FloatingLabel>
                        <FloatingLabel
                            controlId="entity"
                            label="Сущность"
                            className={ `mb-3 ${ errors.entity ? 'is-invalid' : '' }` }
                        >
                            <Form.Control
                                type="text"
                                disabled={ updateLoading || createLoading }
                                { ...register('entity') }
                            />
                            { errors.entity &&
                                <Form.Text className="text-danger">{ errors.entity.message }</Form.Text> }
                        </FloatingLabel>
                        <FloatingLabel
                            controlId="permission"
                            label="Разрешение"
                            className={ `mb-3 ${ errors.permission ? 'is-invalid' : '' }` }
                        >
                            <Form.Control
                                type="text"
                                disabled={ updateLoading || createLoading }
                                placeholder="app_name.permission_name"
                                { ...register('permission') }
                            />
                            { errors.permission &&
                                <Form.Text className="text-danger">{ errors.permission.message }</Form.Text> }
                        </FloatingLabel>
                        <FloatingLabel
                            controlId="code"
                            label="Код"
                            className={ `mb-3 ${ errors.code ? 'is-invalid' : '' }` }
                        >
                            <Form.Control
                                type="text"
                                disabled={ updateLoading || createLoading || modal === 'update' }
                                { ...register('code', { valueAsNumber: true }) }
                            />
                            { errors.code && <Form.Text className="text-danger">{ errors.code.message }</Form.Text> }
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
                        Удалить разрешение
                    </h5>
                </Modal.Header>
                <Modal.Body>
                    Вы уверены, что хотите удалить разрешение?
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
                        <h5>Все правы</h5>
                        <div className="d-flex gap-2">
                            <Button
                                variant="success"
                                className="btn-icon"
                                onClick={ actionCreate }
                            >
                                <FaPlus/>
                            </Button>
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
                            data={ permissions }
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

export default PermissionsListPage;