import { useCallback, useEffect, useState } from 'react';
import { useNavigate, useParams } from "react-router-dom";
import useStateContext from "@/hooks/useStateContext.tsx";
import { Alert, Badge, Button, Card, Container, FloatingLabel, Form, FormCheck, Modal, Spinner } from "react-bootstrap";
import { Question, useDeleteTestBankMutation, useGetTestBankQuery, } from "@/api/TestBank.api.ts";
import { ScaleLoader } from "react-spinners";
import { AxiosError } from "axios";
import { GenericResponse } from "@/types";
import { FaPlus, FaTrash, FaX } from "react-icons/fa6";
import { toast } from "react-toastify";
import { ACTIONS } from "@/utils/constants.ts";
import { FaEdit } from "react-icons/fa";
import { zodResolver } from "@hookform/resolvers/zod";
import { FieldValues, useFieldArray, useForm } from "react-hook-form";
import { testBankUpdateSchema } from "@/schemas/TestBank.schema.ts";
import FloatingSelect from "@/components/ui/FloatingSelect.tsx";
import { useMutation } from "@tanstack/react-query";
import useAxios from "@/hooks/useAxios.ts";

const TestBankDetailPage = () => {
    const { idx } = useParams<{ idx: string }>();
    const { dispatch } = useStateContext();
    const navigate = useNavigate();
    const axios = useAxios();

    const [modal, setModal] = useState<"" | "delete" | "update">("");
    const [selectedIdx, setSelectedIdx] = useState<null | string>(null);

    const {
        data: testBank,
        isLoading,
        isFetching,
        isError,
        error,
        refetch
    } = useGetTestBankQuery(idx!);

    useEffect(() => {
        dispatch({
            type: ACTIONS.SET_BREADCRUMBS,
            payload: [
                { label: 'Тест-банк', path: '/test-bank' },
                { label: testBank?.subject, path: `/test-bank/${ idx }` }
            ]
        })
    }, [dispatch, idx, testBank?.subject]);

    const {
        mutate: updateTestBankQuestion,
        isLoading: isUpdatingQuestion
    } = useMutation({
        mutationFn: async (payload: Question) => {
            const { data } = await axios.put(`/test/test-bank/${ idx }/questions/${ selectedIdx }`, payload);
            return data;
        },
        onSuccess: () => {
            setSelectedIdx(null);
            toast.success('Тест-банк успешно обновлен');
            modalClose();
            refetch();
        }, onError: (err: AxiosError<GenericResponse>) => {
            toast.error(err.response?.data.message || err.message)
        }
    })

    const {
        mutate: deleteTestBankQuestion,
        isLoading: isDeletingTestBankQuestion
    } = useMutation({
        mutationFn: async () => {
            await axios.delete(`/test/test-bank/${ idx }/questions/${ selectedIdx }`);
        },
        onSuccess: () => {
            toast.success('Вопрос успешно удален');
            modalClose();
            refetch();
        }, onError: (err: AxiosError<GenericResponse>) => {
            toast.error(err.response?.data.message || err.message);
        }
    })

    const {
        mutate: deleteTestBank,
        isLoading: isDeletingTestBank
    } = useDeleteTestBankMutation({
        onSuccess: () => {
            toast.success('Тест-банк успешно удален')
            navigate(-1)
        }, onError: (err: AxiosError<GenericResponse>) => {
            toast.error(err.response?.data.message || err.message)
        }
    })

    const {
        control,
        watch,
        register,
        setValue,
        handleSubmit,
        reset,
        formState: { errors }
    } = useForm<FieldValues>({
        resolver: zodResolver(testBankUpdateSchema),
        defaultValues: {
            question: '',
            options: [],
            difficulty_level: 1
        }
    });
    const { fields, append, remove } = useFieldArray({
        control,
        name: "options",
    });

    const handleCorrectChange = (optionIdx: number) => {
        fields.forEach((field, idx: number) => {
            if (idx !== optionIdx) {
                setValue(`options.${idx}.correct`, false);
            }
        });
    };

    const modalClose = useCallback(() => {
        setModal("");
        setSelectedIdx(null);
        reset();
    }, [setModal, reset]);

    const actionUpdate = useCallback((id: string, questionIdx: number) => {
        setSelectedIdx(id);
        const question = testBank?.questions?.[questionIdx];

        if (question) {
            setModal('update');
            setValue('question', question.question.replace(/<[^>]+>/g, ''));
            append(question.options.map((option) => {
                return {
                    id: option.id,
                    option: option.option.replace(/<[^>]+>/g, ''),
                    correct: option.correct
                };
            }));
            setValue('difficulty_level', question.difficulty_level);
        }
    }, [testBank, setValue, append]);

    const actionDelete = useCallback((id: string) => {
        setSelectedIdx(id);
        setModal('delete');
    }, []);

    const questionDifficulties = useCallback((degree: number) => {
        if (degree === 1) return 'Легкий';
        if (degree === 2) return 'Средний';
        if (degree === 3) return 'Сложный';
    }, []);

    return (
        <>
            <Modal
                show={ modal === 'update' }
                onHide={ modalClose }
                size="lg"
                centered
                animation
                backdrop="static"
            >
                <Modal.Header closeButton>
                    <h5>Редактирование вопроса</h5>
                </Modal.Header>

                <Form onSubmit={ handleSubmit((formData) => updateTestBankQuestion(formData)) }>
                    <Modal.Body>
                        <FloatingLabel
                            controlId="question"
                            label="Вопрос"
                            className={ `mb-3 ${ errors.question ? 'is-invalid' : '' }` }
                        >
                            <Form.Control
                                as="textarea"
                                type="text"
                                style={ { minHeight: '100px' } }
                                { ...register('question') }
                            />
                            { errors.question &&
                                <Form.Text className="text-danger">{ errors.question.message }</Form.Text> }
                        </FloatingLabel>

                        <FloatingSelect
                            label="Уровень сложности"
                            id="difficulty_level"
                            watch={ watch }
                            register={ register }
                            valueAsNumber
                            errors={ errors }
                            placeholder="Сложный"
                            disabled={ isLoading }
                            options={ [
                                { label: 'Легкий', value: 1 },
                                { label: 'Средний', value: 2 },
                                { label: 'Сложный', value: 3 },
                            ] }
                            defaultValue={ 3 }
                        />

                        <Form.Group className="mb-3">
                            <div className="d-flex mb-3">
                                <Form.Label>Варианты ответов</Form.Label>

                                <Button
                                    variant="success"
                                    className="btn-icon ms-auto"
                                    onClick={ () => append({
                                        option: '',
                                        correct: false
                                    }) }
                                >
                                    <FaPlus/>
                                </Button>
                            </div>

                            { fields.map((option, optionIdx) => (
                                <div
                                    className="d-flex align-items-start mb-3"
                                    key={ optionIdx }
                                >
                                    <FormCheck
                                        type="checkbox"
                                        id={ `options.${ optionIdx }.correct` }
                                        { ...register(`options.${ optionIdx }.correct`) }
                                        defaultChecked={ option.correct }
                                        className="mt-1 me-2"
                                        onChange={() => handleCorrectChange(optionIdx)}
                                    />
                                    <FloatingLabel
                                        label={ `Вариант ${ optionIdx + 1 }` }
                                        className={ `${ errors.options?.[optionIdx] ? 'is-invalid' : '' } flex-grow-1` }
                                    >
                                        <Form.Control
                                            as="textarea"
                                            { ...register(`options.${ optionIdx }.option`) }
                                            isInvalid={ !!errors.options?.[optionIdx] }
                                        />
                                        { errors.options?.[optionIdx] &&
                                            <Form.Text className="text-danger">{ errors.options?.[optionIdx].message }</Form.Text> }
                                    </FloatingLabel>

                                    <Button
                                        variant="danger"
                                        className="btn-icon ms-4"
                                        onClick={ () => remove(optionIdx) }
                                    >
                                        <FaTrash/>
                                    </Button>
                                </div>
                            )) }
                        </Form.Group>
                    </Modal.Body>

                    <Modal.Footer>
                        <Button
                            type="submit"
                            variant="primary"
                            disabled={ isUpdatingQuestion }
                        >
                            { isUpdatingQuestion ? <Spinner
                                animation="border"
                                variant="light"
                            /> : 'Сохранить' }
                        </Button>
                    </Modal.Footer>
                </Form>
            </Modal>

            <Modal
                show={ modal === "delete" }
                onHide={ modalClose }
                centered
                animation
                backdrop="static"
            >
                <Modal.Header closeButton>
                    <h5>
                        Удалить вопрос
                    </h5>
                </Modal.Header>
                <Modal.Body>
                    Вы уверены, что хотите удалить вопрос?
                </Modal.Body>
                <Modal.Footer>
                    <Button
                        variant="secondary"
                        type="button"
                        disabled={ isDeletingTestBankQuestion }
                        className="center gap-2 py-2 px-3"
                        onClick={ () => setModal("") }
                    >
                        <FaX/> Отменить
                    </Button>
                    <Button
                        variant="danger"
                        type="button"
                        disabled={ isDeletingTestBankQuestion }
                        className="center gap-2 py-2 px-3"
                        onClick={ () => deleteTestBankQuestion() }
                    >
                        <FaTrash/> Удалить
                    </Button>
                </Modal.Footer>
            </Modal>

            <Container fluid="lg">
                <Card className="animate__animated animate__faster animate__fadeIn shadow">
                    <Card.Header className="d-flex justify-content-between align-items-center">
                        <h5 className="mb-0">{ testBank?.subject }</h5>
                        <Button
                            className="btn-icon"
                            variant="danger"
                            disabled={ isDeletingTestBank }
                            onClick={ () => deleteTestBank(idx!) }
                        >
                            <FaTrash/>
                        </Button>
                    </Card.Header>
                    <Card.Body>
                        { isFetching || isLoading ? (
                            <div className="d-flex justify-content-center align-items-center">
                                <div>
                                    <ScaleLoader
                                        height={ 15 }
                                        color="#0096DB"
                                    />
                                </div>
                            </div>
                        ) : isError ? (
                            <Alert variant="danger">
                                <p className="text-danger">
                                    { (error as AxiosError<GenericResponse>).response?.data.message || (error as AxiosError).message }
                                </p>
                            </Alert>
                        ) : (
                            <ol>
                                {
                                    testBank?.questions?.map((question, questionIdx) => (
                                        <li key={ questionIdx }>
                                            <div className="d-flex">
                                                <div>
                                                    <Badge bg={ question.difficulty_level === 3 ? 'danger' : question.difficulty_level === 2 ? 'warning' : 'primary' }>
                                                        { questionDifficulties(question.difficulty_level) }
                                                    </Badge>
                                                    <h6 dangerouslySetInnerHTML={ { __html: question.question } }></h6>
                                                    <ul>
                                                        {
                                                            question.options.map((option, optionIdx) => (
                                                                <li
                                                                    key={ `${ questionIdx }${ optionIdx }` }
                                                                    style={ { listStyleType: option.correct ? 'disc' : 'circle' } }
                                                                >
                                                                    <p dangerouslySetInnerHTML={ { __html: option.option } }></p>
                                                                </li>
                                                            ))
                                                        }
                                                    </ul>
                                                </div>

                                                <div className="d-flex align-self-start ms-auto">
                                                    <Button
                                                        variant="info"
                                                        className="btn-icon"
                                                        onClick={ () => actionUpdate(question.id, questionIdx) }
                                                    >
                                                        <FaEdit/>
                                                    </Button>
                                                    <Button
                                                        variant="danger"
                                                        className="btn-icon ms-2"
                                                        onClick={ () => actionDelete(question.id) }
                                                    >
                                                        <FaTrash/>
                                                    </Button>
                                                </div>
                                            </div>
                                            <hr/>
                                        </li>
                                    ))
                                }
                            </ol>
                        ) }
                    </Card.Body>
                </Card>
            </Container>
        </>
    );
};

export default TestBankDetailPage;