import { useCallback, useEffect, useMemo, useState } from "react";
import useStateContext from "@/hooks/useStateContext.tsx";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { useMutation, useQuery } from "@tanstack/react-query";
import { toast } from "react-toastify";
import { AxiosError } from "axios";
import { ErrorResponse, GenericResponse } from "@/types";
import { Button, Card, Col, Container, FloatingLabel, Form, Modal, Row, Table } from "react-bootstrap";
import { FaPlus, FaRepeat, FaTrash, FaX } from "react-icons/fa6";
import { FaEdit, FaInfoCircle } from "react-icons/fa";
import { ScaleLoader } from "react-spinners";
import { StaffInput, staffSchema } from "@/schemas/Staff.schema.ts";
import defaultPhoto from "@/assets/images/default.jpg";
import { useNavigate } from "react-router-dom";
import { ACTIONS } from "@/utils/constants.ts";
import useAxios from "@/hooks/useAxios.ts";
import { axiosZodErrorHandler } from "@/utils/handlerError.ts";
import { Staff } from "@/types/entities.ts";
import { GENDER } from "@/schemas/Human.schema.ts";
import authAxios from "@/utils/axios.ts";
import useCheckPermission from "@/hooks/useCheckPermission.tsx";
import DataTable from "@/components/ui/DataTable.tsx";

type Permission = {
    code: number,
    permission: string,
    entity: string,
    label: string,
}

export const StaffListPage = () => {
    const { dispatch } = useStateContext();
    const navigate = useNavigate();
    const axios = useAxios();
    const checkPermission = useCheckPermission();

    const [modal, setModal] = useState<"" | "delete" | "update" | 'create'>("");
    const [selectedIdx, setSelectedIdx] = useState<null | string>(null);

    const {
        data: permissionsData,
        refetch: permissionRefetch
    } = useQuery({
        queryKey: ['permissions'],
        enabled: false,
        queryFn: async () => {
            const { data } = await axios.get('/cabinet/permissions/all')
            return data
        },
        select: (data) => data.data.permissions
    })


    useEffect(() => {
        dispatch({
            type: ACTIONS.SET_BREADCRUMBS,
            payload: [
                { label: 'Сотрудники', path: '/staff' }
            ]
        })
    }, [dispatch]);

    const {
        register,
        watch,
        setValue,
        setError,
        setFocus,
        handleSubmit,
        reset,
        formState: { errors }
    } = useForm({
        resolver: zodResolver(staffSchema),
        defaultValues: {
            identifier: "",
            first_name: "",
            last_name: "",
            middle_name: "",
            email: "",
            photo: "",
            passport_number: "",
            birth_date: "",
            pinfl: "",
            gender: GENDER.MALE,
            branch_ids: [],
            permissions: {}
        }
    })

    const {
        data: branches,
        refetch: branchesRefetch,
    } = useQuery({
        queryKey: ['branches-faculty'],
        enabled: false,
        queryFn: async () => {
            const { data } = await authAxios.get('/core/branches/all')
            return data
        },
        select: (data) => data.data.branches
    })

    const { data: staff, isFetching, isLoading, isError, refetch, error } = useQuery({
        queryKey: ['staff'],
        queryFn: async () => {
            const { data } = await axios.get('/core/staff')
            return data
        },
        select: (data) => data.data.staff
    })

    const {
        mutate: createMutation,
        isLoading: createLoading
    } = useMutation({
        mutationFn: async (data: StaffInput) => {
            const response = await axios.post(`/core/staff`, data)
            return response.data
        },
        onSuccess: () => {
            setModal("")
            reset()
            toast.success("Сотрудник успешно создан")
            refetch()
        },
        onError: (error: AxiosError<ErrorResponse>) => axiosZodErrorHandler(error, setError)
    })


    const {
        mutate: updateMutation,
        isLoading: updateLoading
    } = useMutation({
        mutationFn: async (data: StaffInput) => {
            const response = await axios.patch(`/core/staff/${ selectedIdx }`, data)
            return response.data
        },
        onSuccess: () => {
            setModal("")
            reset()
            setSelectedIdx(null)
            toast.success("Сотрудник успешно обновлен")
            refetch()
        },
        onError: (error: AxiosError<ErrorResponse>) => axiosZodErrorHandler(error, setError)
    })

    const {
        mutate: deleteMutation,
        isLoading: deleteLoading
    } = useMutation({
        mutationFn: async () => {
            await axios.delete(`/core/staff/${ selectedIdx }`)
        },
        onSuccess: () => {
            setModal("")
            setSelectedIdx(null)
            refetch()
            toast.success("Сотрудник успешно удален")
        },
        onError: (error: AxiosError<GenericResponse>) => {
            toast.error(error.response?.data.message || error.message)
        }
    })

    const actionUpdate = useCallback((idx: string) => {
        setSelectedIdx(idx)
        setModal("update")
        const user = staff?.find((i: Staff) => i.id === idx)
        if (user) {
            branchesRefetch().then(async () => await permissionRefetch()).then(() => {
                setValue('identifier', user.identifier)
                setValue('first_name', user.first_name)
                setValue('last_name', user.last_name)
                setValue('middle_name', user.middle_name)
                setValue('email', user.email)
                setValue('passport_number', user.passport_number)
                setValue('pinfl', user.pinfl)
                setValue('birth_date', user.birth_date)
                setValue('gender', user.gender)
                setValue('photo', user.photo)
                setTimeout(() => {
                    setValue('branch_ids', user.branch_ids)
                }, 100)

                const permissions = {}

                user.permissions.forEach((i: number) => {
                    permissions[i] = true
                })

                setValue('permissions', permissions)

                setTimeout(() => {
                    setValue('birth_date', user.birth_date)
                }, 100)
            })
        }
    }, [branchesRefetch, permissionRefetch, setValue, staff])

    const actionCreate = useCallback(() => {
        branchesRefetch().then(async () => await permissionRefetch()).then(() => {
            setModal("create")
            setFocus('identifier')
        })
    }, [branchesRefetch, setFocus])

    const actionDelete = useCallback((idx: string) => {
        setSelectedIdx(idx)
        setModal("delete")
    }, [])

    const modalClose = useCallback(() => {
        setModal("")
        setSelectedIdx(null)
        reset()
    }, [setModal, setSelectedIdx, reset])

    const onSubmit = handleSubmit((formData) => {
        const transformedData = {
            ...formData,
            // Transform permissions into an array of selected values
            permissions: Object.entries(formData.permissions)
                .filter(([, value]) => value)
                .map(([key]) => parseInt(key))
        };
        if (modal === 'create') {
            createMutation(transformedData);
        } else {
            updateMutation(transformedData);
        }
    });

    const tableHeaders = useMemo(() => {
        return [
            {
                key: 'identifier',
                label: 'Идентификатор',
                render: (row) => (
                    <div className="d-flex align-items-center gap-2">
                        <img
                            src={ row.photo ? row.photo : defaultPhoto }
                            width={ 40 }
                            height={ 40 }
                            className="rounded-circle shadow"
                            alt=""
                        />
                        { row.identifier }
                    </div>
                )
            },
            {
                key: 'last_name',
                label: 'ФИО',
                render: (row) => `${ row.last_name } ${ row.first_name } ${ row.middle_name }`
            },
            {
                key: 'actions',
                label: 'Действия',
                className: 'text-end',
                render: (row) => (
                    <div className="d-flex align-items-center justify-content-end gap-2">
                        <Button
                            variant="secondary"
                            onClick={ () => navigate(`/staff/${ row.id }`) }
                            disabled={ updateLoading }
                            className="btn-icon"
                        >
                            <FaInfoCircle/>
                        </Button>
                        { checkPermission(603) &&
                            <Button
                                variant="info"
                                onClick={ () => actionUpdate(row.id) }
                                disabled={ updateLoading }
                                className="btn-icon"
                            >
                                <FaEdit/>
                            </Button> }
                        { checkPermission(604) &&
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
    }, [actionDelete, actionUpdate, checkPermission, deleteLoading, navigate, updateLoading]);

    return (
        <>
            <Modal
                show={ ['update', 'create'].includes(modal) }
                size={ modal === 'delete' ? 'sm' : 'xl' }
                onHide={ modalClose }
                centered
                animation
                statiс="true"
                backdrop
            >
                <Modal.Header closeButton>
                    <h5>
                        { modal === 'create' ? 'Создать' : 'Изменить' } сотрудника
                    </h5>
                </Modal.Header>
                <Form
                    onSubmit={ onSubmit }
                >
                    <Modal.Body>
                        <Row>
                            <Col className="col-md-3">
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
                                    controlId="passport_number"
                                    label="Номер паспорта"
                                    className={ `mb-3 ${ errors.passport_number ? 'is-invalid' : '' }` }
                                >
                                    <Form.Control
                                        type="text"
                                        disabled={ updateLoading || createLoading }
                                        { ...register('passport_number') }
                                    />
                                    { errors.passport_number &&
                                        <Form.Text className="text-danger">{ errors.passport_number.message }</Form.Text> }
                                </FloatingLabel>
                                <FloatingLabel
                                    controlId="pinfl"
                                    label="ПИНФЛ"
                                    className={ `mb-3 ${ errors.pinfl ? 'is-invalid' : '' }` }
                                >
                                    <Form.Control
                                        type="text"
                                        disabled={ updateLoading || createLoading }
                                        { ...register('pinfl') }
                                    />
                                    { errors.pinfl &&
                                        <Form.Text className="text-danger">{ errors.pinfl.message }</Form.Text> }
                                </FloatingLabel>
                                <FloatingLabel
                                    controlId="email"
                                    label="Электронная почта"
                                    className={ `mb-3 ${ errors.email ? 'is-invalid' : '' }` }
                                >
                                    <Form.Control
                                        type="email"
                                        disabled={ updateLoading || createLoading }
                                        { ...register('email') }
                                    />
                                    { errors.email &&
                                        <Form.Text className="text-danger">{ errors.email.message }</Form.Text> }
                                </FloatingLabel>
                                <FloatingLabel
                                    controlId="birth_date"
                                    label="Дата рождения"
                                    className={ `mb-3 ${ errors.birth_date ? 'is-invalid' : '' }` }
                                >
                                    <Form.Control
                                        type="date"
                                        disabled={ updateLoading || createLoading }
                                        { ...register('birth_date', { valueAsDate: true }) }
                                    />
                                    { errors.birth_date &&
                                        <Form.Text className="text-danger">{ errors.birth_date.message }</Form.Text> }
                                </FloatingLabel>
                                <FloatingLabel
                                    label="Пол"
                                    controlId="gender"
                                >
                                    <Form.Select
                                        disabled={ updateLoading || createLoading }
                                        { ...register("gender") }
                                    >
                                        <option value={ GENDER.MALE }>
                                            Мужской
                                        </option>
                                        <option value={ GENDER.FEMALE }>
                                            Женский
                                        </option>
                                    </Form.Select>
                                    { errors.gender &&
                                        <Form.Text className="text-danger">{ errors.gender.message }</Form.Text> }
                                </FloatingLabel>

                                <FloatingLabel
                                    controlId="branch_ids"
                                    label="Филиал"
                                    className={ `mt-3 ${ errors.branch_ids ? 'is-invalid' : '' }` }
                                >
                                    <Form.Select
                                        className="h-100"
                                        disabled={ updateLoading || createLoading }
                                        multiple
                                        { ...register('branch_ids') }>
                                        { branches && branches.length > 0 ? branches?.map((branch) => (
                                            <option
                                                key={ branch.id }
                                                value={ branch.id }
                                            >{ branch.name.ru }</option>
                                        )) : (
                                            <option disabled>Нет филиалов</option>
                                        ) }
                                    </Form.Select>
                                    { errors.branch_ids &&
                                        <Form.Text className="text-danger">{ errors.branch_ids.message }</Form.Text> }
                                </FloatingLabel>

                            </Col>
                            <Col>
                                { permissionsData && permissionsData.length > 0 && (
                                    <div className="border p-2 checkbox-container">
                                        { permissionsData.map((permission: Permission) => (
                                            <Form.Group key={ permission.code }>
                                                <Form.Check
                                                    className="form-check form-switch"
                                                    type="checkbox"
                                                    label={ permission.label }
                                                    disabled={ updateLoading || createLoading }
                                                    { ...register(`permissions.${ permission.code }`, { valueAsNumber: true }) }
                                                />
                                            </Form.Group>
                                        )) }
                                    </div>
                                ) }
                            </Col>
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
                        Удалить соотрудника
                    </h5>
                </Modal.Header>
                <Modal.Body>
                    Вы уверены, что хотите удалить соотрудника?
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
                        <h5>Все соотрудники
                        </h5>
                        <div className="d-flex gap-2">
                            { checkPermission(601) &&
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
                            data={ staff }
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

export default StaffListPage;