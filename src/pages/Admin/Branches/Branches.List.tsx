import { useCallback, useEffect, useMemo, useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import useStateContext from "@/hooks/useStateContext.tsx";
import authAxios from "@/utils/axios.ts";
import { toast } from "react-toastify";
import { AxiosError } from "axios";
import { ErrorResponse, GenericResponse } from "@/types";
import { Button, Card, Container, FloatingLabel, Form, Modal } from "react-bootstrap";
import { FaPlus, FaRepeat, FaTrash, FaX } from "react-icons/fa6";
import { FaEdit, FaSearch } from "react-icons/fa";
import { BranchInput, branchSchema } from "@/schemas/Branch.schema.ts";
import { ACTIONS } from "@/utils/constants.ts";
import { axiosZodErrorHandler } from "@/utils/handlerError.ts";
import { useNavigate } from "react-router-dom";
import DataTable from "@/components/ui/DataTable.tsx";
import { Branch } from "@/types/entities.ts";
import useCheckPermission from "@/hooks/useCheckPermission.tsx";

export const BranchesListPage = () => {
    const { dispatch } = useStateContext();
    const checkPermission = useCheckPermission();
    const navigate = useNavigate();

    const [modal, setModal] = useState<"" | "delete" | "update" | 'create'>("");
    const [selectedIdx, setSelectedIdx] = useState<null | string>(null);

    useEffect(() => {
        dispatch({
            type: ACTIONS.SET_BREADCRUMBS,
            payload: [
                { label: 'Филиалы', path: '/branches' }
            ]
        })
    }, [dispatch]);

    const {
        register,
        setValue,
        setError,
        setFocus,
        handleSubmit,
        reset,
        formState: { errors }
    } = useForm({
        resolver: zodResolver(branchSchema),
        defaultValues: {
            name: {
                ru: '',
                uz: '',
                en: ''
            },
        }
    })

    const { data: branches, isFetching, isError, refetch, error } = useQuery({
        queryKey: ['branches'],
        keepPreviousData: true,
        queryFn: async () => {
            const { data } = await authAxios.get('/core/branches')
            return data
        },
        select: (data) => data.data.branches
    })

    const {
        mutate: createMutation,
        isLoading: createLoading
    } = useMutation({
        mutationFn: async (data: BranchInput) => {
            const response = await authAxios.post(`/core/branches`, data)
            return response.data
        },
        onSuccess: () => {
            setModal("")
            reset()
            toast.success("Филиал успешно создан")
            refetch()
        },
        onError: (error: AxiosError<ErrorResponse>) => axiosZodErrorHandler(error, setError)
    })

    const {
        mutate: updateMutation,
        isLoading: updateLoading
    } = useMutation({
        mutationFn: async (data: BranchInput) => {
            const response = await authAxios.patch(`/core/branches/${ selectedIdx }`, data)
            return response.data
        },
        onSuccess: () => {
            setModal("")
            reset()
            setSelectedIdx(null)
            toast.success("Филиал успешно обновлен")
            refetch()
        },
        onError: (error: AxiosError<ErrorResponse>) => {
            if (Array.isArray(error.response?.data.errors)) {
                error.response?.data.errors.forEach((error) => {
                    setError((error.path[error.path.length - 1] as keyof BranchInput), { message: error.message })
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
            await authAxios.delete(`/core/branches/${ idx }`)
        },
        onSuccess: () => {
            setModal("")
            setSelectedIdx(null)
            refetch()
            toast.success("Филиал успешно удален")
        },
        onError: (error: AxiosError<GenericResponse>) => {
            toast.error(error.response?.data.message || error.message)
        }
    })

    const actionUpdate = useCallback((branch: Branch) => {
        setSelectedIdx(branch.id);
        setModal("update");
        setValue('name', branch.name);
    }, [setModal, setValue, branches]);

    const actionCreate = useCallback(() => {
        setModal("create");
        setFocus('name.en');
    }, [setModal, setFocus]);

    const actionDelete = useCallback((idx: string) => {
        setSelectedIdx(idx);
        setModal("delete");
    }, []);

    const modalClose = useCallback(() => {
        setModal("");
        setSelectedIdx(null);
        reset();
    }, [setModal, setSelectedIdx, reset]);

    const tableHeaders = useMemo(() => {
        return [
            {
                key: 'name',
                label: 'Название',
                render: (row: Branch) => (
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
                style: { width: '15%' }
            },
            {
                key: 'actions',
                label: 'Действия',
                style: { width: '15%' },
                className: "text-end",
                render: (row: Branch) => (
                    <div className="d-flex align-items-center justify-content-end gap-2">
                        <Button
                            variant="success"
                            onClick={ () => navigate(`/branches/${ row.id }`) }
                            className="btn-icon"
                        >
                            <FaSearch/>
                        </Button>
                        { checkPermission(103) &&
                            <Button
                                variant="info"
                                onClick={ () => actionUpdate(row) }
                                disabled={ updateLoading }
                                className="btn-icon"
                            >
                                <FaEdit/>
                            </Button> }
                        { checkPermission(104) &&
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
    }, [actionUpdate, actionDelete, updateLoading, deleteLoading, checkPermission, navigate]);

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
                        { modal === 'create' ? 'Создать' : 'Изменить' } филиал
                    </h5>
                </Modal.Header>
                <Form
                    onSubmit={
                        handleSubmit(formData => modal === 'create' ? createMutation(formData) : updateMutation(formData))
                    }
                >
                    <Modal.Body>
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
                                <Form.Text className="text-danger">{ errors.name.en.message }</Form.Text>
                            }
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
                                <Form.Text className="text-danger">{ errors.name.ru.message }</Form.Text>
                            }
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
                                <Form.Text className="text-danger">{ errors.name.uz.message }</Form.Text>
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
                            {
                                modal === 'create' ?
                                    <><FaPlus/> Создать</> :
                                    <><FaEdit/> Изменить</>
                            }
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
                        Удалить филиал
                    </h5>
                </Modal.Header>
                <Modal.Body>
                    Вы уверены, что хотите удалить филиал?
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
                        <h5>Все филиалы</h5>
                        <div className="d-flex gap-2">
                            { checkPermission(101) &&
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
                        <DataTable<Branch>
                            headers={ tableHeaders }
                            data={ branches }
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

export default BranchesListPage;