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
import { FaEdit } from "react-icons/fa";
import { TeacherInput, teacherSchema } from "@/schemas/Teacher.schema.ts";
import { GENDER } from "@/schemas/Human.schema.ts";
import defaultPhoto from "@/assets/images/default.jpg";
import { ACTIONS } from "@/utils/constants.ts";
import useCheckPermission from "@/hooks/useCheckPermission.tsx";
import DataTable from "@/components/ui/DataTable.tsx";

export const TeachersListPage = () => {
    const { dispatch } = useStateContext();
    const checkPermission = useCheckPermission();

    const [modal, setModal] = useState<"" | "delete" | "update" | 'create'>("");
    const [selectedIdx, setSelectedIdx] = useState<null | string>(null);

    useEffect(() => {
        dispatch({
            type: ACTIONS.SET_BREADCRUMBS,
            payload: [
                { label: 'Преподаватели', path: '/teachers' }
            ]
        })
    }, [dispatch]);

    const { register, setValue, setError, setFocus, handleSubmit, reset, formState: { errors } } = useForm({
        resolver: zodResolver(teacherSchema),
        defaultValues: {
            identifier: "",
            first_name: "",
            last_name: "",
            middle_name: "",
            passport_number: "",
            pinfl: "",
            birth_date: "",
            gender: GENDER.MALE,
            timetable_id: "",
        }
    })

    const { data: teachers, isFetching, isError, error, refetch } = useQuery({
        queryKey: ['teachers'],
        queryFn: async () => {
            const { data } = await authAxios.get('/core/teachers')
            return data
        },
        select: (data) => data.data.teachers
    })

    const {
        mutate: createMutation,
        isLoading: createLoading
    } = useMutation({
        mutationFn: async (data: TeacherInput) => {
            const response = await authAxios.post(`/core/teachers`, data)
            return response.data
        },
        onSuccess: () => {
            setModal("")
            reset()
            toast.success("Преподавател успешно создан")
            refetch()
        },
        onError: (error: AxiosError<ErrorResponse>) => {
            if (Array.isArray(error.response?.data.errors)) {
                error.response?.data.errors.forEach((error) => {
                    setError((error.path[error.path.length - 1] as keyof TeacherInput), { message: error.message })
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
        mutationFn: async (data: TeacherInput) => {
            const response = await authAxios.patch(`/core/teachers/${ selectedIdx }`, data)
            return response.data
        },
        onSuccess: () => {
            setModal("")
            reset()
            setSelectedIdx(null)
            toast.success("Преподавател успешно обновлен")
            refetch()
        },
        onError: (error: AxiosError<ErrorResponse>) => {
            if (Array.isArray(error.response?.data.errors)) {
                error.response?.data.errors.forEach((error) => {
                    setError((error.path[error.path.length - 1] as keyof TeacherInput), { message: error.message })
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
            await authAxios.delete(`/core/teachers/${ selectedIdx }`)
        },
        onSuccess: () => {
            setModal("")
            setSelectedIdx(null)
            refetch()
            toast.success("Преподавател успешна удален")
        },
        onError: (error: AxiosError<GenericResponse>) => {
            toast.error(error.response?.data.message || error.message)
        }
    })

    const actionUpdate = useCallback((idx: string) => {
        setSelectedIdx(idx)
        const teacher = teachers?.find((teacher) => teacher.id === idx)
        if (teacher) {
            setModal("update")
            setValue('identifier', teacher.identifier)
            setValue('first_name', teacher.first_name)
            setValue('last_name', teacher.last_name)
            setValue('middle_name', teacher.middle_name)
            setValue('passport_number', teacher.passport_number)
            setValue('pinfl', teacher.pinfl)
            setValue('birth_date', teacher.birth_date?.toISOString().split('T')[0])
            setValue('gender', teacher.gender)
            setValue('timetable_id', teacher.timetable_id)
            setFocus('first_name')

        }
    }, [setModal, setValue, setFocus, teachers])

    const actionCreate = useCallback(() => {
        setModal("create")
        setFocus('last_name')
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
                key: 'identifier',
                label: 'ID',
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
                render: (row) => (
                    <div className="d-flex align-items-center">
                        { row.last_name } { row.first_name } { row.middle_name }
                    </div>
                )
            },
            {
                key: 'actions',
                label: 'Действия',
                className: 'text-end',
                render: (row) => (
                    <div className="d-flex align-items-center justify-content-end gap-2">
                        { checkPermission(503) &&
                            <Button
                                variant="info"
                                onClick={ () => actionUpdate(row.id) }
                                disabled={ updateLoading }
                                className="btn-icon"
                            >
                                <FaEdit/>
                            </Button>
                        }
                        { checkPermission(504) &&
                            <Button
                                variant="danger"
                                disabled={ deleteLoading }
                                onClick={ () => actionDelete(row.id) }
                                className="btn-icon"
                            >
                                <FaTrash/>
                            </Button>
                        }
                    </div>
                )
            }
        ]
    }, [actionUpdate, actionDelete, updateLoading, deleteLoading, checkPermission]);

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
                        { modal === 'create' ? 'Создать' : 'Изменить' } преподавателя
                    </h5>
                </Modal.Header>
                <Form
                    onSubmit={ handleSubmit(formData => modal === 'create' ? createMutation(formData) : updateMutation(formData)) }
                >
                    <Modal.Body>
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
                                maxLength={ 14 }
                                disabled={ updateLoading || createLoading }
                                { ...register('pinfl') }
                            />
                            { errors.pinfl &&
                                <Form.Text className="text-danger">{ errors.pinfl.message }</Form.Text> }
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
                            controlId="timetable_id"
                            label="ID расписания"
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
                        Удалить преподавателя
                    </h5>
                </Modal.Header>
                <Modal.Body>
                    Вы уверены, что хотите удалить преподавателя?
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
                        <h5>Преподаватели</h5>
                        <div className="d-flex gap-2">
                            { checkPermission(501) &&
                                <Button
                                    variant="success"
                                    className="btn-icon"
                                    onClick={ actionCreate }
                                >
                                    <FaPlus/>
                                </Button>
                            }
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
                            data={ teachers }
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

export default TeachersListPage;