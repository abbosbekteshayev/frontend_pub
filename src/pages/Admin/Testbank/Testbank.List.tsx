import { useCallback, useEffect, useMemo, useState } from 'react';
import useStateContext from "@/hooks/useStateContext.tsx";
import { Button, Card, Container, FloatingLabel, Form, InputGroup, Modal } from "react-bootstrap";
import { FaRepeat, FaTrash, FaX } from "react-icons/fa6";
import {
    ITestBankResponse,
    TestBank,
    useDeleteTestBankMutation,
    useUpdateTestBankMutation
} from "@/api/TestBank.api.ts";
import { AxiosError } from "axios";
import { ErrorResponse, GenericResponse } from "@/types";
import { useNavigate } from "react-router-dom";
import { FaDownload, FaEdit, FaInfoCircle } from "react-icons/fa";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { testBankSchema } from "@/schemas/TestBank.schema.ts";
import { toast } from "react-toastify";
import { ACTIONS } from "@/utils/constants.ts";
import { axiosZodErrorHandler } from "@/utils/handlerError.ts";
import { useQuery } from "@tanstack/react-query";
import useAxios from "@/hooks/useAxios.ts";
import { getDatetime } from "@/utils/time.ts";
import { Language } from "@/types/ExamType.ts";
import useCheckPermission from "@/hooks/useCheckPermission.tsx";
import DataTable from "@/components/ui/DataTable.tsx";
import useInfinityRequest from "@/hooks/useInfinityRequest.ts";
import { DotLoader } from "react-spinners";
import InfiniteScroll from "react-infinite-scroll-component";

const LANGUAGE_MAP = {
    'ru': 'Русский',
    'uz': 'Узбекский',
    'en': 'Английский',
    'ko': 'Корейский'
}

enum ESearchBy {
    SUBJECT = 'subject',
}

const TestBankList = () => {
        const { dispatch } = useStateContext();
        const navigate = useNavigate();
        const axios = useAxios();
        const checkPermission = useCheckPermission();

        const [modal, setModal] = useState<"" | "delete" | "update">("");
        const [selectedIdx, setSelectedIdx] = useState<null | string>(null);

        useEffect(() => {
            dispatch({
                type: ACTIONS.SET_BREADCRUMBS,
                payload: [
                    { label: 'Тест-банк', path: '/test-bank' }
                ]
            })
        }, [dispatch]);

        const { register, setValue, setError, setFocus, handleSubmit, reset, formState: { errors } } = useForm({
            resolver: zodResolver(testBankSchema),
            defaultValues: {
                subject: '',
                language: '',
                code: 100000,
                questionsPerExam: 0,
                duration: 0,
                totalQuestions: 0,
                trial_available: false
            }
        })

        // const { data: testBanks, isFetching, isError, refetch, error } = useGetAllTestBankQuery();

        const {
            objects: testBanks,
            isFetching,
            isError,
            error,
            refetch,
            hasNextPage,
            fetchNextPage,
            onSearch,
            search,
            searchBy
        } = useInfinityRequest<ITestBankResponse>({
            url: '/test/test-bank',
            key: 'testBanks',
            queryKey: ['test-bank'],
            keepPreviousData: true
        })

        const {
            data: testBankFile,
            isFetching: downloadingFile,
            isError: isErrorTestBankFile,
            refetch: fetchTestBank,
            remove,
            error: errorTestBankFile
        } = useQuery({
            queryKey: ['testBankFile'],
            retry: 0,
            staleTime: 1,
            cacheTime: 1,
            queryFn: async () => {
                const response = await axios.get(`/test/test-bank/${ selectedIdx }/file`, {
                    responseType: 'blob'
                })
                return response.data
            },
            enabled: false
        })

        const downloadTestBank = useCallback((idx: string) => {
            setSelectedIdx(idx)
            if (selectedIdx === idx) {
                fetchTestBank()
            }
        }, [fetchTestBank, selectedIdx])

        useEffect(() => {
            if (isErrorTestBankFile) {
                toast.error((errorTestBankFile as AxiosError<GenericResponse>)?.response?.data.message || (errorTestBankFile as AxiosError)?.message)
            }
        }, [isErrorTestBankFile, errorTestBankFile])

        useEffect(() => {
            if (testBankFile) {
                const selectedTestBank = testBanks?.find((testBank) => testBank.id === selectedIdx)
                if (!selectedTestBank) return
                const url = window.URL.createObjectURL(new Blob([testBankFile]))
                const link = document.createElement('a')
                link.href = url
                link.setAttribute('download', selectedTestBank.filename)
                document.body.appendChild(link)
                link.click()
                remove()
            }
        }, [testBankFile, selectedIdx, testBanks, remove]);

        const {
            mutate: updateMutation,
            isLoading: updateLoading
        } = useUpdateTestBankMutation({
            onSuccess: () => {
                setModal("")
                reset()
                setSelectedIdx(null)
                toast.success("Тест-банк успешно обновлен")
                refetch()
            },
            onError: (error: AxiosError<ErrorResponse>) => axiosZodErrorHandler(error, setError)
        })

        const {
            mutate: deleteMutation,
            isLoading: deleteLoading
        } = useDeleteTestBankMutation({
            onSuccess: () => {
                setModal("")
                setSelectedIdx(null)
                refetch()
                toast.success("Тест-банк успешно удален")
            },
            onError: (error: AxiosError<GenericResponse>) => {
                toast.error(error.response?.data.message || error.message)
            }
        })

        const actionUpdate = useCallback((idx: string) => {
            setSelectedIdx(idx)
            setModal("update")
            const testBank = testBanks?.find((testBank) => testBank.id === idx)
            if (testBank) {
                setValue('subject', testBank.subject)
                setValue('code', testBank.code)
                setValue('language', testBank.language)
                setValue('questionsPerExam', testBank.questionsPerExam)
                setValue('duration', testBank.duration)
                setValue('totalQuestions', testBank.totalQuestions)
                setValue('trial_available', testBank.trial_available)
                setFocus('subject')
            }
        }, [testBanks, setValue, setFocus])

        const actionDelete = useCallback((idx: string) => {
            setSelectedIdx(idx)
            setModal("delete")
        }, [])

        const tableHeaders = useMemo(() => {
            return [
                {
                    key: 'code',
                    label: 'Шифр',
                },
                {
                    key: 'subject',
                    label: 'Название',
                    searchable: () => (
                        <InputGroup>
                            <Form.Control
                                type="text"
                                placeholder="Поиск по названию"
                                value={ searchBy === ESearchBy.SUBJECT ? search : "" }
                                onChange={ e => onSearch(ESearchBy.SUBJECT, e.target.value) }
                            />
                        </InputGroup>
                    ),
                },
                {
                    key: 'language',
                    label: 'Язык',
                    render: (row: TestBank) => row.language ? LANGUAGE_MAP[(row.language as keyof typeof LANGUAGE_MAP)] : "не выбран"
                },
                {
                    key: 'duration',
                    label: 'Продолжительность',
                    render: (row: TestBank) => `${ row.duration } минут`
                },
                {
                    key: 'questionsPerExam',
                    label: 'Вопросы для экзамена',
                },
                {
                    key: 'totalQuestions',
                    label: 'Количество вопросов'
                },
                {
                    key: 'created_at',
                    label: 'Создан',
                    render: (row) => getDatetime(row.created_at)
                },
                {
                    key: 'actions',
                    label: 'Действия',
                    className: 'text-end',
                    render: (row) => (
                        <div className="d-flex gap-2 justify-content-end align-items-center">
                            <Button
                                className="btn-icon text-black"
                                variant="warning"
                                disabled={ downloadingFile || !row.filename }
                                onClick={ () => downloadTestBank(row.id) }
                            >
                                <FaDownload/>
                            </Button>
                            { checkPermission(807) &&
                                <Button
                                    className="btn-icon"
                                    onClick={ () => navigate(`/test-bank/${ row.id }`) }
                                >
                                    <FaInfoCircle/>
                                </Button>
                            }
                            { checkPermission(804) &&
                                <Button
                                    variant="info"
                                    onClick={ () => actionUpdate(row.id) }
                                    disabled={ updateLoading }
                                    className="btn-icon"
                                >
                                    <FaEdit/>
                                </Button>
                            }
                            { checkPermission(805) &&
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
        }, [searchBy, search, onSearch, downloadingFile, checkPermission, updateLoading, deleteLoading, downloadTestBank, navigate, actionUpdate, actionDelete]);

        return (
            <>
                <Modal
                    show={ modal === "update" }
                    onHide={ () => setModal("") }
                    centered
                    animation
                    backdrop="static"
                >
                    <Modal.Header closeButton>
                        <h5>
                            Изменить тест-банк
                        </h5>
                    </Modal.Header>
                    <Form onSubmit={ handleSubmit(formData => updateMutation({ id: selectedIdx!, ...formData })) }>
                        <Modal.Body>
                            <FloatingLabel
                                controlId="subject"
                                label="Название"
                                className={ `mb-3 ${ errors.subject ? 'is-invalid' : '' }` }
                            >
                                <Form.Control
                                    type="text"
                                    { ...register('subject') }
                                />
                                { errors.subject &&
                                    <Form.Text className="text-danger">{ errors.subject.message }</Form.Text> }
                            </FloatingLabel>
                            <FloatingLabel
                                controlId="code"
                                label="Шифр"
                                className={ `mb-3 ${ errors.code ? 'is-invalid' : '' }` }
                            >
                                <Form.Control
                                    type="number"
                                    disabled={ true }
                                    { ...register('code', { valueAsNumber: true }) }
                                />
                                { errors.code && <Form.Text className="text-danger">{ errors.code.message }</Form.Text> }
                            </FloatingLabel>
                            <FloatingLabel
                                controlId="language"
                                label="Язык"
                                className={ `mb-3 ${ errors.language ? 'is-invalid' : '' }` }
                            >
                                <Form.Select
                                    { ...register('language') }
                                >
                                    { Object.entries(LANGUAGE_MAP).map(([key, value]) => (
                                        <option
                                            key={ key }
                                            value={ key as Language }
                                        >
                                            { value }
                                        </option>
                                    )) }
                                </Form.Select>
                                { errors.language &&
                                    <Form.Text className="text-danger">{ errors.language.message }</Form.Text> }
                            </FloatingLabel>

                            <FloatingLabel
                                controlId="questionsPerExam"
                                label="Количество вопросов на экзамен"
                                className={ `mb-3 ${ errors.questionsPerExam ? 'is-invalid' : '' }` }
                            >
                                <Form.Control
                                    type="number"
                                    { ...register('questionsPerExam', { valueAsNumber: true }) }
                                />
                                { errors.questionsPerExam &&
                                    <Form.Text className="text-danger">{ errors.questionsPerExam.message }</Form.Text> }
                            </FloatingLabel>

                            <FloatingLabel
                                controlId="duration"
                                label="Продолжительность"
                                className={ `mb-3 ${ errors.duration ? 'is-invalid' : '' }` }
                            >
                                <Form.Control
                                    type="number"
                                    { ...register('duration', { valueAsNumber: true }) }
                                />
                                { errors.duration &&
                                    <Form.Text className="text-danger">{ errors.duration.message }</Form.Text> }
                            </FloatingLabel>

                            <Form.Check
                                type="checkbox"
                                label="Доступен для тренажёра"
                                { ...register('trial_available') }
                            >
                            </Form.Check>
                        </Modal.Body>
                        <Modal.Footer>
                            <Button
                                variant="secondary"
                                type="button"
                                disabled={ updateLoading }
                                className="center gap-2 py-2 px-3"
                                onClick={ () => setModal("") }
                            >
                                <FaX/> Отменить
                            </Button>
                            <Button
                                variant="primary"
                                type="submit"
                                disabled={ updateLoading }
                                className="center gap-2 py-2 px-3"
                            >
                                <FaEdit/> Изменить
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
                            Удалить тест-банк
                        </h5>
                    </Modal.Header>
                    <Modal.Body>
                        Вы уверены, что хотите удалить тест-банк?
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
                <Container fluid>
                    <Card className="animate__animated animate__faster animate__fadeIn shadow">
                        <Card.Header className="d-flex justify-content-between align-items-center">
                            <h5>Все тесты</h5>
                            <Button
                                variant="info"
                                className="btn-icon"
                                onClick={ () => refetch() }
                            >
                                <FaRepeat/>
                            </Button>
                        </Card.Header>
                        <Card.Body>
                            <InfiniteScroll
                                dataLength={ testBanks.length }
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
                                <DataTable<TestBank>
                                    headers={ tableHeaders }
                                    data={ testBanks }
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
    }
;

export default TestBankList;