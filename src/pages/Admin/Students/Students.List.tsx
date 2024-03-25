import { useCallback, useEffect, useMemo, useState } from "react";
import useStateContext from "@/hooks/useStateContext.tsx";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { useMutation, useQuery } from "@tanstack/react-query";
import authAxios from "@/utils/axios.ts";
import { toast } from "react-toastify";
import { AxiosError } from "axios";
import { ErrorResponse, GenericResponse } from "@/types";
import { Button, Card, Container, FloatingLabel, Form, InputGroup, Modal } from "react-bootstrap";
import { FaPlus, FaRepeat, FaTrash, FaX } from "react-icons/fa6";
import { FaEdit } from "react-icons/fa";
import { DotLoader } from "react-spinners";
import { StudentInput, studentSchema } from "@/schemas/Student.schema.ts";
import { GENDER } from "@/schemas/Human.schema.ts";
import defaultPhoto from "@/assets/images/default.jpg";
import { ACTIONS } from "@/utils/constants.ts";
import InfiniteScroll from "react-infinite-scroll-component";
import TableOrderButton from "@/components/ui/TableOrderButton.tsx";
import useInfinityRequest from "@/hooks/useInfinityRequest.ts";
import useCheckPermission from "@/hooks/useCheckPermission.tsx";
import DataTable from "@/components/ui/DataTable.tsx";

enum ESearchBy {
    IDENTIFIER = "identifier",
    FIRST_NAME = "first_name",
    LAST_NAME = "last_name",
    MIDDLE_NAME = "middle_name",
    GROUP_NAME = "group.name",
    PASSPORT_NUMBER = "passport_number",
}

enum ESortBy {
    FIRST_NAME = "first_name",
    LAST_NAME = "last_name",
    MIDDLE_NAME = "middle_name",
    GROUP_NAME = "group.name",
    PASSPORT_NUMBER = "passport_number",
}

export const StudentsListPage = () => {
    const { dispatch } = useStateContext();
    const checkPermission = useCheckPermission();

    const [modal, setModal] = useState<"" | "delete" | "update" | 'create'>("");
    const [selectedIdx, setSelectedIdx] = useState<null | string>(null);

    useEffect(() => {
        dispatch({
            type: ACTIONS.SET_BREADCRUMBS,
            payload: [
                { label: 'Студенты', path: '/students' }
            ]
        })
    }, [dispatch]);

    const { register, setValue, setError, setFocus, handleSubmit, reset, formState: { errors } } = useForm({
        resolver: zodResolver(studentSchema),
        defaultValues: {
            identifier: "",
            first_name: "",
            last_name: "",
            middle_name: "",
            passport_number: "",
            pinfl: null,
            birth_date: null,
            email: null,
            gender: GENDER.MALE,
            group: "",
        }
    })

    const {
        data: groups,
        isError: groupsHasError,
        refetch: groupsRefetch,
        error: groupsError
    } = useQuery({
        queryKey: ['groups-room'],
        enabled: false,
        queryFn: async () => {
            const { data } = await authAxios.get('/core/groups/all')
            return data
        },
        select: (data) => data.data.groups
    })

    useEffect(() => {
        if (groupsHasError) {
            toast.error((groupsError as AxiosError<GenericResponse>)?.response?.data.message || (groupsError as AxiosError)?.message)
        }
    }, [groupsHasError, groupsError]);

    const {
        objects,
        isFetching,
        isError,
        error,
        refetch,
        hasNextPage,
        fetchNextPage,
        onSearch,
        onSort,
        sortBy,
        order,
        search,
        searchBy
    } = useInfinityRequest({
        url: '/core/students',
        key: 'students'
    });

    const {
        mutate: createMutation,
        isLoading: createLoading
    } = useMutation({
        mutationFn: async (data: StudentInput) => {
            const response = await authAxios.post(`/core/students`, data)
            return response.data
        },
        onSuccess: () => {
            setModal("")
            reset()
            toast.success("Студент успешно создан")
            refetch()
        },
        onError: (error: AxiosError<ErrorResponse>) => {
            if (Array.isArray(error.response?.data.errors)) {
                error.response?.data.errors.forEach((error) => {
                    setError((error.path[error.path.length - 1] as keyof StudentInput), { message: error.message })
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
        mutationFn: async (data: StudentInput) => {
            const response = await authAxios.patch(`/core/students/${ selectedIdx }`, data)
            return response.data
        },
        onSuccess: () => {
            setModal("")
            reset()
            setSelectedIdx(null)
            toast.success("Студент успешно обновлен")
            refetch()
        },
        onError: (error: AxiosError<ErrorResponse>) => {
            if (Array.isArray(error.response?.data.errors)) {
                error.response?.data.errors.forEach((error) => {
                    setError((error.path[error.path.length - 1] as keyof StudentInput), { message: error.message })
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
            await authAxios.delete(`/core/students/${ selectedIdx }`)
        },
        onSuccess: () => {
            setModal("")
            setSelectedIdx(null)
            refetch()
            toast.success("Студент успешно удален")
        },
        onError: (error: AxiosError<GenericResponse>) => {
            toast.error(error.response?.data.message || error.message)
        }
    })

    const actionUpdate = useCallback((idx: string) => {
        setSelectedIdx(idx)
        const student = objects?.find((student) => student.id === idx)
        if (student) {
            groupsRefetch().then(() => {
                setModal("update")
                setValue('identifier', student.identifier)
                setValue('first_name', student.first_name)
                setValue('last_name', student.last_name)
                setValue('middle_name', student.middle_name)
                setValue('passport_number', student.passport_number)
                setValue('pinfl', student.pinfl)
                setValue('gender', student.gender)
                setValue('email', student.email)
                setFocus('first_name')
                setTimeout(() => {
                    setValue('birth_date', student.birth_date)
                    setValue('group', student.group.id)
                }, 100)
            })
        }
    }, [objects, groupsRefetch, setValue, setFocus])

    const actionCreate = useCallback(() => {
        groupsRefetch().then(() => {
            setModal("create")
            setFocus('last_name')
        })
    }, [setModal, setFocus, groupsRefetch])

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
                key: "identifier",
                label: "ID",
                searchable: () => (
                    <InputGroup>
                        <Form.Control
                            type="text"
                            placeholder="Поиск по ID"
                            value={ searchBy === ESearchBy.IDENTIFIER ? search : "" }
                            onChange={ e => onSearch(ESearchBy.IDENTIFIER, e.target.value) }
                        />
                    </InputGroup>
                ),
                render: (row) => (
                    <div className="d-flex align-items-center gap-2">
                        <img
                            src={ row.photo ? `https://cabinet.kiut.uz${ row.photo }` : defaultPhoto }
                            width={ 50 }
                            height={ 50 }
                            className="rounded-circle shadow object-fit-cover"
                            alt=""
                        />
                        { row.identifier }
                    </div>
                )
            },
            {
                key: 'last_name',
                sortable: () => (
                    <TableOrderButton
                        label="Фамилия"
                        sortBy={ sortBy }
                        order={ order }
                        field={ ESortBy.LAST_NAME }
                        onClick={ () => onSort(ESortBy.LAST_NAME) }
                    />
                ),
                searchable: () => (
                    <InputGroup>
                        <Form.Control
                            type="text"
                            placeholder="Поиск по фамилию"
                            value={ searchBy === ESearchBy.LAST_NAME ? search : "" }
                            onChange={ e => onSearch(ESearchBy.LAST_NAME, e.target.value) }
                        />
                    </InputGroup>
                )
            },
            {
                key: 'first_name',
                sortable: () => (
                    <TableOrderButton
                        label="Имя"
                        sortBy={ sortBy }
                        order={ order }
                        field={ ESortBy.FIRST_NAME }
                        onClick={ () => onSort(ESortBy.FIRST_NAME) }
                    />
                ),
                searchable: () => (
                    <InputGroup>
                        <Form.Control
                            type="text"
                            placeholder="Поиск по имени"
                            value={ searchBy === ESearchBy.FIRST_NAME ? search : "" }
                            onChange={ e => onSearch(ESearchBy.FIRST_NAME, e.target.value) }
                        />
                    </InputGroup>
                )
            },
            {
                key: 'middle_name',
                sortable: () => (
                    <TableOrderButton
                        label="Отчество"
                        sortBy={ sortBy }
                        order={ order }
                        field={ ESortBy.MIDDLE_NAME }
                        onClick={ () => onSort(ESortBy.MIDDLE_NAME) }
                    />
                ),
                searchable: () => (
                    <InputGroup>
                        <Form.Control
                            type="text"
                            placeholder="Поиск по отчеству"
                            value={ searchBy === ESearchBy.MIDDLE_NAME ? search : "" }
                            onChange={ e => onSearch(ESearchBy.MIDDLE_NAME, e.target.value) }
                        />
                    </InputGroup>
                )
            },
            {
                key: 'group',
                sortable: () => (
                    <TableOrderButton
                        label="Группа"
                        sortBy={ sortBy }
                        order={ order }
                        field={ ESortBy.GROUP_NAME }
                        onClick={ () => onSort(ESortBy.GROUP_NAME) }
                    />
                ),
                render: (row) => (
                    <div className="d-flex align-items-center justify-content-center text-nowrap">
                        { row.group?.name }
                    </div>
                ),
                searchable: () => (
                    <InputGroup>
                        <Form.Control
                            type="text"
                            placeholder="Поиск по группе"
                            value={ searchBy === ESearchBy.GROUP_NAME ? search : "" }
                            onChange={ e => onSearch(ESearchBy.GROUP_NAME, e.target.value) }
                        />
                    </InputGroup>
                )
            },
            {
                key: 'passport_number',
                sortable: () => (
                    <TableOrderButton
                        label="Паспорт серия"
                        sortBy={ sortBy }
                        order={ order }
                        field={ ESortBy.PASSPORT_NUMBER }
                        onClick={ () => onSort(ESortBy.PASSPORT_NUMBER) }
                    />
                ),
                searchable: () => (
                    <InputGroup>
                        <Form.Control
                            type="text"
                            placeholder="Поиск по паспорт серии"
                            value={ searchBy === ESearchBy.PASSPORT_NUMBER ? search : "" }
                            onChange={ e => onSearch(ESearchBy.PASSPORT_NUMBER, e.target.value) }
                        />
                    </InputGroup>
                )
            },
            {
                key: 'actions',
                label: "Действия",
                className: "text-end",
                render: (row) => (
                    <div className="d-flex align-items-center justify-content-end gap-2">
                        { checkPermission(403) &&
                            <Button
                                variant="info"
                                onClick={ () => actionUpdate(row.id) }
                                disabled={ updateLoading }
                                className="btn-icon"
                            >
                                <FaEdit/>
                            </Button> }
                        { checkPermission(404) &&
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
    }, [sortBy, order, onSort, onSearch, searchBy, search, actionUpdate, actionDelete, updateLoading, deleteLoading, checkPermission]);

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
                        { modal === 'create' ? 'Создать' : 'Изменить' } студента
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
                            controlId="group"
                            label="Группа"
                            className={ `mb-3 ${ errors.group ? 'is-invalid' : '' }` }
                        >
                            <Form.Select
                                disabled={ updateLoading || createLoading }
                                { ...register('group') }
                            >
                                { Array.isArray(groups) && groups.map((group, idx) => (
                                    <option
                                        key={ idx }
                                        value={ group.id }
                                    >{ group?.name }</option>
                                )) }
                            </Form.Select>
                            { errors.group &&
                                <Form.Text className="text-danger">{ errors.group.message }</Form.Text> }
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
                        Удалить студента
                    </h5>
                </Modal.Header>
                <Modal.Body>
                    Вы уверены, что хотите удалить студента?
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
                        <h5>Студенты</h5>
                        <div className="d-flex gap-2">
                            { checkPermission(401) &&
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
                            <DataTable
                                headers={ tableHeaders }
                                data={ objects }
                                isFetching={ isFetching }
                                isError={ isError }
                                error={ error }
                            />
                        </InfiniteScroll>
                    </Card.Body>
                </Card>
            </Container>
        </>
    );
};

export default StudentsListPage;