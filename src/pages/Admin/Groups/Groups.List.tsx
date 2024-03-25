import { useCallback, useEffect, useMemo, useState } from "react";
import useStateContext from "@/hooks/useStateContext.tsx";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { useInfiniteQuery, useMutation, useQuery } from "@tanstack/react-query";
import authAxios from "@/utils/axios.ts";
import { toast } from "react-toastify";
import { AxiosError } from "axios";
import { ErrorResponse, GenericResponse } from "@/types";
import { Button, Card, Container, FloatingLabel, Form, InputGroup, Modal, Table } from "react-bootstrap";
import { FaPlus, FaRepeat, FaTrash, FaUserTie, FaX } from "react-icons/fa6";
import { FaEdit } from "react-icons/fa";
import { EducationType, GroupInput, groupSchema, Language } from "@/schemas/Group.schema.ts";
import { ACTIONS } from "@/utils/constants.ts";
import { useNavigate } from "react-router-dom";
import InfiniteScroll from "react-infinite-scroll-component";
import { DotLoader, ScaleLoader } from "react-spinners";
import { useDebounce } from "@/hooks/useDebounce.ts";
import ProgressLinearAnimation from "@/components/ui/ProgressLinearAnimation.tsx";
import TableOrderButton from "@/components/ui/TableOrderButton.tsx";
import { Order } from "@/types/enums.ts";
import classNames from "classnames";
import useCheckPermission from "@/hooks/useCheckPermission.tsx";
import DataTable from "@/components/ui/DataTable.tsx";
import useInfinityRequest from "@/hooks/useInfinityRequest.ts";

enum ESearchBy {
    GROUP_NAME = "name",
    FACULTY_NAME = "faculty.name"
}

enum ESortBy {
    GROUP_NAME = "name",
    COURSE = "course",
    FACULTY_NAME = "faculty.name",
    STUDENTS_COUNT = "students_count",
    EDUCATION_TYPE = "education_type",
    LANGUAGE = "language",
}

export const GroupsListPage = () => {
    const { dispatch } = useStateContext();
    const navigate = useNavigate();
    const checkPermission = useCheckPermission();

    const [modal, setModal] = useState<"" | "delete" | "update" | 'create'>("");
    const [selectedIdx, setSelectedIdx] = useState<null | string>(null);

    useEffect(() => {
        dispatch({
            type: ACTIONS.SET_BREADCRUMBS,
            payload: [
                { label: 'Группы', path: '/groups' }
            ]
        })
    }, [dispatch]);

    const { register, setValue, setError, setFocus, handleSubmit, reset, formState: { errors } } = useForm({
        resolver: zodResolver(groupSchema),
        defaultValues: {
            name: '',
            start_year: new Date().getFullYear(),
            end_year: new Date().getFullYear() + 4,
            faculty: '',
            course: 1,
            language: Language.RU,
            education_type: EducationType.FULL_TIME,
            timetable_id: '',
        }
    })

    const {
        data: faculties,
        isError: facultiesHasError,
        refetch: facultiesRefetch,
        error: facultiesError
    } = useQuery({
        queryKey: ['faculties-group'],
        enabled: false,
        queryFn: async () => {
            const { data } = await authAxios.get('/core/faculties/all')
            return data
        },
        select: (data) => data.data.faculties
    })

    useEffect(() => {
        if (facultiesHasError) {
            toast.error((facultiesError as AxiosError<GenericResponse>)?.response?.data.message || (facultiesError as AxiosError)?.message)
        }
    }, [facultiesHasError, facultiesError]);

    const {
        objects,
        isFetching,
        isError,
        error,
        refetch,
        hasNextPage,
        fetchNextPage,
        search,
        searchBy,
        order,
        sortBy,
        onSearch,
        onSort
    } = useInfinityRequest({
        url: `/core/groups`,
        key: 'groups',
        queryKey: 'groups'
    })

    const {
        mutate: createMutation,
        isLoading: createLoading
    } = useMutation({
        mutationFn: async (data: GroupInput) => {
            const response = await authAxios.post(`/core/groups`, data)
            return response.data
        },
        onSuccess: () => {
            setModal("")
            reset()
            toast.success("Группа успешно создана")
            refetch()
        },
        onError: (error: AxiosError<ErrorResponse>) => {
            if (Array.isArray(error.response?.data.errors)) {
                error.response?.data.errors.forEach((error) => {
                    setError((error.path[error.path.length - 1] as keyof GroupInput), { message: error.message })
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
        mutationFn: async (data: GroupInput) => {
            const response = await authAxios.patch(`/core/groups/${ selectedIdx }`, data)
            return response.data
        },
        onSuccess: () => {
            setModal("")
            reset()
            setSelectedIdx(null)
            toast.success("Группа успешно обновлена")
            refetch()
        },
        onError: (error: AxiosError<ErrorResponse>) => {
            if (Array.isArray(error.response?.data.errors)) {
                error.response?.data.errors.forEach((error) => {
                    setError((error.path[error.path.length - 1] as keyof GroupInput), { message: error.message })
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
            await authAxios.delete(`/core/groups/${ selectedIdx }`)
        },
        onSuccess: () => {
            setModal("")
            setSelectedIdx(null)
            refetch()
            toast.success("Группа успешно удален")
        },
        onError: (error: AxiosError<GenericResponse>) => {
            toast.error(error.response?.data.message || error.message)
        }
    })

    const actionUpdate = useCallback((idx: string) => {
        setSelectedIdx(idx);
        const group = objects?.find((group) => group.id === idx)
        if (group) {
            facultiesRefetch().then(() => {
                setModal("update")
                setValue('name', group.name)
                setValue('start_year', group.start_year)
                setValue('end_year', group.end_year)
                setValue('course', group.course)
                setValue('language', group.language)
                setValue('education_type', group.education_type)
                setValue('timetable_id', group.timetable_id)
                setFocus('name')
                setTimeout(() => {
                    setValue('faculty', group.faculty.id)
                    setFocus('name')
                }, 100)
            })
        }
    }, [facultiesRefetch, objects, setFocus, setValue])

    const actionCreate = useCallback(() => {
        facultiesRefetch().then(() => {
            setModal("create")
            setFocus('name')
        })
    }, [setModal, setFocus, facultiesRefetch])

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
                key: 'name',
                sortable: () => (
                    <TableOrderButton
                        label="Группа"
                        sortBy={ sortBy }
                        order={ order }
                        field={ ESortBy.GROUP_NAME }
                        onClick={ () => onSort(ESortBy.GROUP_NAME) }
                    />
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
                ),
                render: (row) => (
                    <div className="d-flex align-items-center text-nowrap">{ row.name }</div>
                )
            },
            {
                key: 'course',
                sortable: () => (
                    <TableOrderButton
                        label="Курс"
                        sortBy={ sortBy }
                        order={ order }
                        field={ ESortBy.COURSE }
                        onClick={ () => onSort(ESortBy.COURSE) }
                    />
                ),
                render: (row) => (
                    <div className="d-flex align-items-center justify-content-center">{ row.course }</div>
                )
            },
            {
                key: 'faculty',
                sortable: () => (
                    <TableOrderButton
                        label="Факультет"
                        sortBy={ sortBy }
                        order={ order }
                        field={ ESortBy.FACULTY_NAME }
                        onClick={ () => onSort(ESortBy.FACULTY_NAME) }
                    />
                ),
                searchable: () => (
                    <InputGroup>
                        <Form.Control
                            type="text"
                            placeholder="Поиск по факультету"
                            value={ searchBy === ESearchBy.FACULTY_NAME ? search : "" }
                            onChange={ e => onSearch(ESearchBy.FACULTY_NAME, e.target.value) }
                        />
                    </InputGroup>
                ),
                render: (row) => (
                    <div className="d-flex align-items-center">
                        { row.faculty?.name.ru }
                    </div>
                )
            },
            {
                key: 'students_count',
                sortable: () => (
                    <TableOrderButton
                        label="Количество студентов"
                        sortBy={ sortBy }
                        order={ order }
                        field={ ESortBy.STUDENTS_COUNT }
                        onClick={ () => onSort(ESortBy.STUDENTS_COUNT) }
                    />
                )
            },
            {
                key: 'language',
                sortable: () => (
                    <TableOrderButton
                        label="Язык"
                        sortBy={ sortBy }
                        order={ order }
                        field={ ESortBy.LANGUAGE }
                        onClick={ () => onSort(ESortBy.LANGUAGE) }
                    />
                )
            },
            {
                key: 'actions',
                label: 'Действия',
                className: 'text-end',
                render: (row) => (
                    <div className="d-flex align-items-center justify-content-end gap-2">
                        <Button
                            variant="success"
                            onClick={ () => navigate(`/groups/${ row.id }`) }
                            className="btn-icon"
                        >
                            <FaUserTie/>
                        </Button>
                        { checkPermission(303) &&
                            <Button
                                variant="info"
                                onClick={ () => actionUpdate(row.id) }
                                disabled={ updateLoading }
                                className="btn-icon"
                            >
                                <FaEdit/>
                            </Button> }
                        { checkPermission(304) &&
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
    }, [search, searchBy, sortBy, order, onSearch, onSort, actionUpdate, actionDelete, updateLoading, deleteLoading, navigate, checkPermission]);

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
                        { modal === 'create' ? 'Создать' : 'Изменить' } группу
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
                            controlId="faculty"
                            label="Факультет"
                            className={ `mb-3 ${ errors.faculty ? 'is-invalid' : '' }` }
                        >
                            <Form.Select
                                disabled={ updateLoading || createLoading }
                                { ...register('faculty') }>
                                <option value="">Выберите факультет</option>
                                { Array.isArray(faculties) && faculties?.map((faculty) => (
                                    <option
                                        key={ faculty.id }
                                        value={ faculty.id }
                                    >{ faculty.name.ru }</option>
                                )) }
                            </Form.Select>
                            { errors.faculty &&
                                <Form.Text className="text-danger">{ errors.faculty.message }</Form.Text> }
                        </FloatingLabel>

                        <FloatingLabel
                            controlId="start_year"
                            label="Год начала"
                            className={ `mb-3 ${ errors.start_year ? 'is-invalid' : '' }` }
                        >
                            <Form.Control
                                type="number"
                                disabled={ updateLoading || createLoading }
                                { ...register('start_year', { valueAsNumber: true }) }
                            />
                            { errors.start_year &&
                                <Form.Text className="text-danger">{ errors.start_year.message }</Form.Text> }
                        </FloatingLabel>

                        <FloatingLabel
                            controlId="end_year"
                            label="Год окончания"
                            className={ `mb-3 ${ errors.end_year ? 'is-invalid' : '' }` }
                        >
                            <Form.Control
                                type="number"
                                disabled={ updateLoading || createLoading }
                                { ...register('end_year', { valueAsNumber: true }) }
                            />
                            { errors.end_year &&
                                <Form.Text className="text-danger">{ errors.end_year.message }</Form.Text> }
                        </FloatingLabel>

                        <FloatingLabel
                            controlId="course"
                            label="Курс"
                            className={ `mb-3 ${ errors.course ? 'is-invalid' : '' }` }
                        >
                            <Form.Control
                                type="number"
                                disabled={ updateLoading || createLoading }
                                { ...register('course', { min: 1, max: 6, valueAsNumber: true }) }
                            />
                            { errors.course &&
                                <Form.Text className="text-danger">{ errors.course.message }</Form.Text> }
                        </FloatingLabel>
                        <FloatingLabel
                            controlId="language"
                            label="Язык"
                            className={ `mb-3 ${ errors.language ? 'is-invalid' : '' }` }
                        >
                            <Form.Select
                                disabled={ updateLoading || createLoading }
                                { ...register('language') }>
                                <option value="">Выберите язык</option>
                                { Object.entries(Language).map(([key, value]) => (
                                    <option
                                        key={ value }
                                        value={ value }
                                    >{ key }</option>
                                )) }
                            </Form.Select>
                            { errors.language &&
                                <Form.Text className="text-danger">{ errors.language.message }</Form.Text> }
                        </FloatingLabel>
                        <FloatingLabel
                            controlId="education_type"
                            label="Тип обучения"
                            className={ `mb-3 ${ errors.education_type ? 'is-invalid' : '' }` }
                        >
                            <Form.Select
                                disabled={ updateLoading || createLoading }
                                { ...register('education_type') }>
                                <option value="">Выберите тип обучения</option>
                                { Object.entries(EducationType).map(([key, value]) => (
                                    <option
                                        key={ value }
                                        value={ value }
                                    >{ key }</option>
                                )) }
                            </Form.Select>
                            { errors.education_type &&
                                <Form.Text className="text-danger">{ errors.education_type.message }</Form.Text> }
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
                        Удалить группу
                    </h5>
                </Modal.Header>
                <Modal.Body>
                    Вы уверены, что хотите удалить группу?
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
                        <h5>Все группы</h5>
                        <div className="d-flex gap-2">
                            { checkPermission(301) &&
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

export default GroupsListPage;