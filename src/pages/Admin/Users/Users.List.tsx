import { useCallback, useEffect, useMemo, useState } from "react";
import useStateContext from "@/hooks/useStateContext.tsx";
import { zodResolver } from "@hookform/resolvers/zod";
import { useFieldArray, useForm } from "react-hook-form";
import { useMutation, useQuery } from "@tanstack/react-query";
import authAxios from "@/utils/axios.ts";
import { toast } from "react-toastify";
import { AxiosError } from "axios";
import { ErrorResponse, GenericResponse } from "@/types";
import { Badge, Button, Card, Col, Container, FloatingLabel, Form, Modal, Row } from "react-bootstrap";
import { FaPlus, FaRepeat, FaTrash, FaX } from "react-icons/fa6";
import { FaEdit, FaInfoCircle } from "react-icons/fa";
import { UserInput, UserRole, UserRoles, userSchema } from "@/schemas/Users.schema.ts";
import defaultPhoto from "@/assets/images/default.jpg";
import { useNavigate } from "react-router-dom";
import { ACTIONS } from "@/utils/constants.ts";
import useCheckPermission from "@/hooks/useCheckPermission.tsx";
import DataTable from "@/components/ui/DataTable.tsx";

const RoleColor = {
    [UserRole.ADMIN]: 'danger',
    [UserRole.STAFF]: 'primary',
    [UserRole.STUDENT]: 'success',
    [UserRole.TEACHER]: 'warning',
}

export const UsersListPage = () => {
    const { dispatch } = useStateContext();
    const navigate = useNavigate();
    const checkPermission = useCheckPermission();

    const [modal, setModal] = useState<"" | "delete" | "update" | 'create'>("");
    const [selectedIdx, setSelectedIdx] = useState<null | string>(null);

    useEffect(() => {
        dispatch({
            type: ACTIONS.SET_BREADCRUMBS,
            payload: [
                { label: 'Пользователи', path: '/users' }
            ]
        })
    }, [dispatch]);

    const { register, control, setValue, setError, setFocus, handleSubmit, reset, formState: { errors } } = useForm({
        resolver: zodResolver(userSchema),
        defaultValues: {
            identifier: "",
            first_name: "",
            last_name: "",
            middle_name: "",
            email: "",
            passport_number: "",
            pinfl: "",
            gender: "",
            role: [UserRole.STAFF],
            password: "",
            confirm_password: "",
            permissions: []
        }
    })

    const { append, remove } = useFieldArray({
        control,
        name: 'permissions'
    })

    const { data: users, isFetching, isError, refetch, error } = useQuery({
        queryKey: ['users'],
        queryFn: async () => {
            const { data } = await authAxios.get('/cabinet/users')
            return data
        },
        select: (data) => data.data.users
    })

    const { data: permissions } = useQuery({
        queryKey: ['permissions'],
        queryFn: async () => {
            const { data } = await authAxios.get('/cabinet/permissions')
            return data
        },
        select: (data) => data.data.permissions
    })

    const {
        mutate: createMutation,
        isLoading: createLoading
    } = useMutation({
        mutationFn: async (data: UserInput) => {
            const response = await authAxios.post(`/cabinet/users`, data)
            return response.data
        },
        onSuccess: () => {
            setModal("")
            reset()
            toast.success("Пользователь успешно создан")
            refetch()
        },
        onError: (error: AxiosError<ErrorResponse>) => {
            if (Array.isArray(error.response?.data.errors)) {
                error.response?.data.errors.forEach((error) => {
                    setError((error.path[error.path.length - 1] as keyof UserInput), { message: error.message })
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
        mutationFn: async (data: UserInput) => {
            const response = await authAxios.patch(`/cabinet/users/${ selectedIdx }`, data)
            return response.data
        },
        onSuccess: () => {
            setModal("")
            reset()
            setSelectedIdx(null)
            toast.success("Пользователь успешно обновлен")
            refetch()
        },
        onError: (error: AxiosError<ErrorResponse>) => {
            if (Array.isArray(error.response?.data.errors)) {
                error.response?.data.errors.forEach((error) => {
                    setError((error.path[error.path.length - 1] as keyof UserInput), { message: error.message })
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
            await authAxios.delete(`/cabinet/users/${ selectedIdx }`)
        },
        onSuccess: () => {
            setModal("")
            setSelectedIdx(null)
            refetch()
            toast.success("Пользователь успешно удален")
        },
        onError: (error: AxiosError<GenericResponse>) => {
            toast.error(error.response?.data.message || error.message)
        }
    })

    const actionUpdate = useCallback((idx: string) => {
        setSelectedIdx(idx)
        setModal("update")
        const user = users?.find((user) => user.id === idx)
        if (user) {
            setValue('identifier', user.identifier)
            setValue('first_name', user.first_name)
        }
    }, [users, setValue])

    const actionCreate = useCallback(() => {
        setModal("create")
        setFocus('identifier')
    }, [setModal, setFocus])

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
                key: 'username',
                label: 'Пользователь',
                render: (row) => (
                    <div className="d-flex align-items-center gap-2">
                        <img
                            src={ row.photo ? row.photo : defaultPhoto }
                            width={ 40 }
                            height={ 40 }
                            className="rounded-circle shadow"
                            alt=""
                        />
                        { row.username }
                    </div>
                )
            },
            {
                key: 'last_name',
                label: 'ФИО'
            },
            {
                key: 'roles',
                label: 'Роли',
                render: (row) => (
                    row.roles && row.roles.map((role, index) => (
                        <Badge
                            key={ index }
                            bg={ RoleColor[role as keyof typeof RoleColor] }
                            className="me-1"
                        >
                            { UserRoles[role as keyof typeof UserRoles] }
                        </Badge>
                    ))
                )
            },
            {
                key: 'actions',
                label: 'Действия',
                className: 'text-end',
                render: (row) => (
                    <div className="d-flex align-items-center justify-content-end gap-2">
                        <Button
                            variant="secondary"
                            onClick={ () => navigate(`/users/${ row.id }`) }
                            disabled={ updateLoading }
                            className="btn-icon"
                        >
                            <FaInfoCircle/>
                        </Button>
                        { checkPermission(703) &&
                            <Button
                                variant="info"
                                onClick={ () => actionUpdate(row.id) }
                                disabled={ updateLoading }
                                className="btn-icon"
                            >
                                <FaEdit/>
                            </Button> }
                        { checkPermission(704) &&
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
        ]
    }, [updateLoading, deleteLoading, actionUpdate, actionDelete, navigate, checkPermission]);

    return (
        <>
            <Modal
                show={ ['update', 'create'].includes(modal) }
                size={ modal === 'delete' ? 'sm' : 'xl' }
                onHide={ modalClose }
                centered
                animation
                backdrop="static"
            >
                <Modal.Header closeButton>
                    <h5>
                        { modal === 'create' ? 'Создать' : 'Изменить' } пользователя
                    </h5>
                </Modal.Header>
                <Form
                    onSubmit={ handleSubmit(formData => modal === 'create' ? createMutation(formData) : updateMutation(formData)) }
                >
                    <Modal.Body>
                        <Row>
                            <Col>
                                <FloatingLabel
                                    controlId="identifier"
                                    label="Идентификатор"
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
                                    controlId="last_name"
                                    label="Фамилия"
                                    className={ `mb-3 ${ errors.last_name ? 'is-invalid' : '' }` }
                                >
                                    <Form.Control
                                        type="text"
                                        disabled={ updateLoading || createLoading }
                                        { ...register('last_name') }
                                    />
                                    { errors.last_name &&
                                        <Form.Text className="text-danger">{ errors.last_name.message }</Form.Text> }
                                </FloatingLabel>
                                <FloatingLabel
                                    controlId="first_name"
                                    label="Имя"
                                    className={ `mb-3 ${ errors.first_name ? 'is-invalid' : '' }` }
                                >
                                    <Form.Control
                                        type="text"
                                        disabled={ updateLoading || createLoading }
                                        { ...register('first_name') }
                                    />
                                    { errors.first_name &&
                                        <Form.Text className="text-danger">{ errors.first_name.message }</Form.Text> }
                                </FloatingLabel>
                                <FloatingLabel
                                    controlId="middle_name"
                                    label="Отчество"
                                    className={ `mb-3 ${ errors.middle_name ? 'is-invalid' : '' }` }
                                >
                                    <Form.Control
                                        type="text"
                                        disabled={ updateLoading || createLoading }
                                        { ...register('middle_name') }
                                    />
                                    { errors.middle_name &&
                                        <Form.Text className="text-danger">{ errors.middle_name.message }</Form.Text> }
                                </FloatingLabel>
                                <FloatingLabel
                                    controlId="role"
                                    label="Роль"
                                    className={ `mb-3 ${ errors.role ? 'is-invalid' : '' }` }
                                >
                                    <Form.Select
                                        disabled={ updateLoading || createLoading }
                                        multiple
                                        style={ { height: '100px' } }
                                        { ...register('role') }
                                    >
                                        <option value={ UserRole.ADMIN }>Администратор</option>
                                        <option value={ UserRole.STAFF }>Сотрудник</option>
                                    </Form.Select>
                                    { errors.role &&
                                        <Form.Text className="text-danger">{ errors.role.message }</Form.Text> }
                                </FloatingLabel>
                                <FloatingLabel
                                    controlId="password"
                                    label="Пароль"
                                    className={ `mb-3 ${ errors.password ? 'is-invalid' : '' }` }
                                >
                                    <Form.Control
                                        type="password"
                                        disabled={ updateLoading || createLoading }
                                        { ...register('password') }
                                    />
                                    { errors.password &&
                                        <Form.Text className="text-danger">{ errors.password.message }</Form.Text> }
                                </FloatingLabel>
                                <FloatingLabel
                                    controlId="confirm_password"
                                    label="Подтверждение пароля"
                                    className={ `mb-3 ${ errors.confirm_password ? 'is-invalid' : '' }` }
                                >
                                    <Form.Control
                                        type="password"
                                        disabled={ updateLoading || createLoading }
                                        { ...register('confirm_password') }
                                    />
                                    { errors.confirm_password &&
                                        <Form.Text
                                            className="text-danger"
                                        >{ errors.confirm_password.message }</Form.Text> }
                                </FloatingLabel>
                            </Col>
                            <Col>
                                <h2>Права доступа</h2>
                                { Array.isArray(permissions) && permissions.map((permission, key) => (
                                    <Form.Group>
                                        <Form.Check
                                            key={ key }
                                            type="checkbox"
                                            label={ permission.label }
                                            disabled={ updateLoading || createLoading }
                                            onChange={ (e) => {
                                                if (e.target.checked) {
                                                    append('permissions', permission.code)
                                                }
                                                else {
                                                    remove(permission.code)
                                                }
                                            } }
                                        />
                                    </Form.Group>
                                )) }
                            </Col>
                            <Col></Col>
                        </Row>
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
                        Удалить пользователя
                    </h5>
                </Modal.Header>
                <Modal.Body>
                    Вы уверены, что хотите удалить пользователя?
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
                        <h5>Все пользователя</h5>
                        <div className="d-flex gap-2">
                            { checkPermission(701) &&
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
                            data={ users }
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

export default UsersListPage;