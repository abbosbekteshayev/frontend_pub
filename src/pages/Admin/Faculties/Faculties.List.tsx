import { useCallback, useEffect, useMemo, useState } from "react";
import useStateContext from "@/hooks/useStateContext.tsx";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { useMutation, useQuery } from "@tanstack/react-query";
import authAxios from "@/utils/axios.ts";
import { toast } from "react-toastify";
import { AxiosError } from "axios";
import { ErrorResponse, GenericResponse } from "@/types";
import { Button, Card, Container, FloatingLabel, Form, Modal } from "react-bootstrap";
import { FaPlus, FaRepeat, FaTrash, FaUsers, FaX } from "react-icons/fa6";
import { FaEdit } from "react-icons/fa";
import { FacultyInput, facultySchema } from "@/schemas/Faculty.schema.ts";
import { ACTIONS } from "@/utils/constants.ts";
import { useNavigate, useParams } from "react-router-dom";
import useCheckPermission from "@/hooks/useCheckPermission.tsx";
import DataTable from "@/components/ui/DataTable.tsx";
import { Faculty } from "@/types/entities.ts";

export const FacultiesListPage = () => {
    const { dispatch } = useStateContext();
    const { idx } = useParams();
    const navigate = useNavigate();
    const checkPermission = useCheckPermission();

    const [modal, setModal] = useState<"" | "delete" | "update" | 'create'>("");
    const [selectedIdx, setSelectedIdx] = useState<null | string>(null);

    useEffect(() => {
        dispatch({
            type: ACTIONS.SET_BREADCRUMBS,
            payload: [
                { label: 'Факультеты', path: '/faculties' }
            ]
        })
    }, [dispatch]);

    const { register, setValue, setError, setFocus, handleSubmit, reset, formState: { errors } } = useForm({
        resolver: zodResolver(facultySchema),
        defaultValues: {
            name: {
                ru: '',
                uz: '',
                en: ''
            },
            suffix: '',
            max_course: 4,
            branch: ""
        }
    })

    const {
        data: branches,
        isError: branchesHasError,
        refetch: branchesRefetch,
        error: branchesError
    } = useQuery({
        queryKey: ['branches-faculty'],
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

    const { data: faculties, isFetching, isError, error, refetch } = useQuery({
        queryKey: ['faculties', `${ idx }`],
        queryFn: async () => {
            const url = idx ? `/core/branches/${ idx }/` : '/core/faculties'
            const { data } = await authAxios.get(url)
            return data
        },
        select: (data) => idx ? data.data.branch.faculties : data.data.faculties
    })

    const {
        mutate: createMutation,
        isLoading: createLoading
    } = useMutation({
        mutationFn: async (data: FacultyInput) => {
            const response = await authAxios.post(`/core/faculties`, data)
            return response.data
        },
        onSuccess: () => {
            setModal("")
            reset()
            toast.success("Факультет успешно создан")
            refetch()
        },
        onError: (error: AxiosError<ErrorResponse>) => {
            if (Array.isArray(error.response?.data.errors)) {
                error.response?.data.errors.forEach((error) => {
                    setError((error.path[error.path.length - 1] as keyof FacultyInput), { message: error.message })
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
        mutationFn: async (data: FacultyInput) => {
            const response = await authAxios.patch(`/core/faculties/${ selectedIdx }`, data)
            return response.data
        },
        onSuccess: () => {
            setModal("")
            reset()
            setSelectedIdx(null)
            toast.success("Факультет успешно обновлен")
            refetch()
        },
        onError: (error: AxiosError<ErrorResponse>) => {
            if (Array.isArray(error.response?.data.errors)) {
                error.response?.data.errors.forEach((error) => {
                    setError((error.path[error.path.length - 1] as keyof FacultyInput), { message: error.message })
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
            await authAxios.delete(`/core/faculties/${ selectedIdx }`)
        },
        onSuccess: () => {
            setModal("")
            setSelectedIdx(null)
            refetch()
            toast.success("Факультет успешно удален")
        },
        onError: (error: AxiosError<GenericResponse>) => {
            toast.error(error.response?.data.message || error.message)
        }
    })

    const actionUpdate = useCallback((faculty: Faculty) => {
        setSelectedIdx(faculty.id);
        branchesRefetch().then(() => {
            setModal("update")
            setValue('name', faculty.name)
            setValue('suffix', faculty.suffix)
            setValue('max_course', faculty.max_course)
            setValue('branch', faculty.branch.id)
        })
    }, [setSelectedIdx, setValue, setModal, faculties, branchesRefetch])

    const actionCreate = useCallback(() => {
        branchesRefetch().then(() => {
            setModal("create")
            setFocus('name.en')
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
        const faculties = [
            {
                key: 'suffix',
                label: 'Суффикс',
                render: (row: Faculty) => (
                    <div className="d-flex align-items-center justify-content-center">{ row.suffix }</div>
                )
            },
            {
                key: 'name',
                label: 'Название',
                render: (row: Faculty) => (
                    <ul className="list-unstyled mb-0">
                        <li><b>На английском:</b> { row.name.en }</li>
                        <li><b>На русском:</b> { row.name.ru }</li>
                        <li><b>На узбекском:</b> { row.name.uz }</li>
                    </ul>
                )
            },
            {
                key: 'students_count',
                label: 'Количество студентов',
            },
            {
                key: 'actions',
                label: 'Действия',
                className: 'text-end',
                render: (row: Faculty) => (
                    <div className="d-flex align-items-center justify-content-end gap-2">
                        <Button
                            variant="success"
                            onClick={ () => navigate(`/faculties/${ row.id }`) }
                            className="btn-icon"
                        >
                            <FaUsers/>
                        </Button>
                        { checkPermission(203) &&
                            <Button
                                variant="info"
                                onClick={ () => actionUpdate(row) }
                                disabled={ updateLoading }
                                className="btn-icon"
                            >
                                <FaEdit/>
                            </Button> }
                        { checkPermission(204) &&
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

        if(!idx) {
            faculties.unshift({
                key: 'branch',
                label: 'Филиал',
                render: (row: Faculty) => <div className="d-flex align-items-center justify-content-center">{ row.branch.name.ru }</div>
            })
        }

        return faculties;
    }, [faculties, idx, actionUpdate, actionDelete, updateLoading, deleteLoading, checkPermission, navigate]);

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
                        { modal === 'create' ? 'Создать' : 'Изменить' } факультет
                    </h5>
                </Modal.Header>
                <Form
                    onSubmit={ handleSubmit(formData => modal === 'create' ? createMutation(formData) : updateMutation(formData)) }
                >
                    <Modal.Body>
                        <FloatingLabel
                            controlId="branch"
                            label="Филиал"
                            className={ `mb-3 ${ errors.branch ? 'is-invalid' : '' }` }
                        >
                            <Form.Select
                                disabled={ updateLoading || createLoading }
                                { ...register('branch') }>
                                <option value="">Выберите филиал</option>
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
                            controlId="name.en"
                            label="Название на английском"
                            className={ `mb-3 ${ errors.name?.en ? 'is-invalid' : '' }` }
                        >
                            <Form.Control
                                type="text"
                                disabled={ updateLoading || createLoading }
                                { ...register('name.en') }
                            />
                            { errors.name?.en &&
                                <Form.Text className="text-danger">{ errors.name.en.message }</Form.Text> }
                        </FloatingLabel>
                        <FloatingLabel
                            controlId="name.ru"
                            label="Название на русском"
                            className={ `mb-3 ${ errors.name?.ru ? 'is-invalid' : '' }` }
                        >
                            <Form.Control
                                type="text"
                                disabled={ updateLoading || createLoading }
                                { ...register('name.ru') }
                            />
                            { errors.name?.ru &&
                                <Form.Text className="text-danger">{ errors.name.ru.message }</Form.Text> }
                        </FloatingLabel>
                        <FloatingLabel
                            controlId="name.uz"
                            label="Название на узбекском"
                            className={ `mb-3 ${ errors.name?.uz ? 'is-invalid' : '' }` }
                        >
                            <Form.Control
                                type="text"
                                disabled={ updateLoading || createLoading }
                                { ...register('name.uz') }
                            />
                            { errors.name?.uz &&
                                <Form.Text className="text-danger">{ errors.name.uz.message }</Form.Text> }
                        </FloatingLabel>
                        <FloatingLabel
                            controlId="suffix"
                            label="Суффикс"
                            className={ `mb-3 ${ errors.suffix ? 'is-invalid' : '' }` }
                        >
                            <Form.Control
                                type="text"
                                disabled={ updateLoading || createLoading }
                                { ...register('suffix') }
                            />
                            { errors.suffix &&
                                <Form.Text className="text-danger">{ errors.suffix.message }</Form.Text> }
                        </FloatingLabel>
                        <FloatingLabel
                            controlId="max_course"
                            label="Максимальный курс"
                            className={ `mb-3 ${ errors.max_course ? 'is-invalid' : '' }` }
                        >
                            <Form.Control
                                type="number"
                                disabled={ updateLoading || createLoading }
                                { ...register('max_course', { valueAsNumber: true }) }
                            />
                            { errors.max_course &&
                                <Form.Text className="text-danger">{ errors.max_course.message }</Form.Text> }
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
                        Удалить факультет
                    </h5>
                </Modal.Header>
                <Modal.Body>
                    Вы уверены, что хотите удалить факультет?
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
                        <h5>Все факультеты</h5>
                        <div className="d-flex gap-2">
                            { checkPermission(201) &&
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
                        <DataTable<Faculty>
                            headers={ tableHeaders }
                            data={ faculties }
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

export default FacultiesListPage;