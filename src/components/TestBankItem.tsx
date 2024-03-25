import { Accordion, Badge, Button, Card, FloatingLabel, Form, Spinner } from "react-bootstrap";
import { FaSave } from "react-icons/fa";
import { FaAngleDown, FaCircleExclamation, FaTrash, FaTriangleExclamation } from "react-icons/fa6";
import { TTestBankFile } from "@/components/TestBankFiles.tsx";
import { useForm } from "react-hook-form";
import { Language } from "@/types/ExamType.ts";
import { ISingleTestBankResponse, Question } from "@/api/TestBank.api.ts";
import { zodResolver } from "@hookform/resolvers/zod";
import AccordionToggle from "@/components/ui/AccordionToggle.tsx";
import { useMemo } from "react";
import { TestBankInput, testBankSchema } from "@/schemas/TestBank.schema.ts";
import { AxiosError } from "axios";
import { ErrorResponse, GenericResponse } from "@/types";
import { axiosZodErrorHandler } from "@/utils/handlerError.ts";
import { useMutation } from "@tanstack/react-query";
import useAxios from "@/hooks/useAxios.ts";
import { toast } from "react-toastify";
import useCheckPermission from "@/hooks/useCheckPermission.tsx";

type TTestBankItem = {
    file: TTestBankFile,
    saveFile: () => void,
    removeFile: () => void,
    idx: number,
    hasAlreadySaved: boolean
}

enum DifficultyTypes {
    EASY = 'easy',
    MEDIUM = 'medium',
    HARD = 'hard'
}

type DifficultyCount = {
    [key in DifficultyTypes]: number
}

const TestBankItem = ({ file, saveFile, idx, removeFile, hasAlreadySaved }: TTestBankItem) => {
    const axios = useAxios();
    const checkPermission = useCheckPermission();

    const { handleSubmit, register, setError, formState: { errors } } = useForm({
        resolver: zodResolver(testBankSchema),
        mode: 'onBlur',
        defaultValues: {
            subject: file.subject,
            questionsPerExam: 0,
            duration: 0,
            totalQuestions: file.questions.length,
            language: file.language,
        }
    });

    const { mutate: uploadTestbank, isLoading: isUploading } = useMutation({
        mutationFn: async (id: string) => {
            const formData = new FormData()
            formData.append('file', file.file)
            const response = await axios.put<ISingleTestBankResponse>(`/test/test-bank/${ id }`, formData, {
                headers: {
                    'Content-Type': 'multipart/form-data'
                }
            })
            return response.data
        },
        onSuccess: () => {
            saveFile()
        },
        onError: (error: AxiosError<GenericResponse>) => {
            toast.error(error.response?.data.message || error.message)
        }
    });

    const { mutate: handleCreate, isLoading } = useMutation({
        mutationFn: async (data: TestBankInput & { questions: Question[] }) => {
            const response = await axios.post<ISingleTestBankResponse>('/test/test-bank', data)
            return response.data
        },
        onSuccess: (res) => {
            uploadTestbank(res.data.testBank.id)
        },
        onError: (error: AxiosError<ErrorResponse>) => axiosZodErrorHandler(error, setError)
    });

    const handleSave = handleSubmit((data) => {
        handleCreate({
            questions: file.questions,
            ...data
        })
    });

    const uniKey = useMemo(() => {
        return file.subject + file.questions.length
    }, [file]);

    const errorsLength = useMemo(() => {
        return file.errors.length
    }, [file]);

    const questionsDifficultyCount = useMemo(() => {
        return file.questions.reduce((acc: DifficultyCount, question) => {
            if(question.difficulty_level === 1) acc.easy = (acc.easy || 0) + 1;
            if(question.difficulty_level === 2) acc.medium = (acc.medium || 0) + 1;
            if(question.difficulty_level === 3) acc.hard = (acc.hard || 0) + 1;

            return acc;
        }, {} as DifficultyCount)
    }, [file]);

    return (
        <Card>
            { file?.saved ? (
                <>
                    <Card.Header className="d-flex justify-content-between align-items-center">
                        <div className="d-flex justify-content-between align-items-center">
                            <div className="d-flex align-items-center gap-2">
                                <h6 className="mb-0">
                                    { file.subject }
                                    <Badge
                                        bg="success"
                                        className="ms-2"
                                    >
                                        Сохранено
                                    </Badge>
                                </h6>
                            </div>
                        </div>
                        <AccordionToggle eventKey={ uniKey }/>
                    </Card.Header>
                    <Accordion.Collapse eventKey={ uniKey }>
                        <p className="text-success fst-italic mb-0">
                            Тест банк уже сохранен
                        </p>
                    </Accordion.Collapse>
                </>
            ) : file?.error ? (
                <>
                    <Card.Header className="d-flex justify-content-between align-items-center">
                        <div className="d-flex justify-content-between align-items-center">
                            <div className="d-flex align-items-center gap-2">
                                <FaTriangleExclamation className="text-danger"/>
                                <h6 className="mb-0">{ file.name }</h6>
                            </div>
                            <div className="ms-auto me-0 d-flex gap-3 justify-content-end">
                                <Button
                                    variant="outline-danger"
                                    onClick={ removeFile }
                                    type="button"
                                    disabled={ isLoading || isUploading }
                                    className="center p-2 rounded-circle"
                                >
                                    <FaTrash/>
                                </Button>
                            </div>
                        </div>
                        <AccordionToggle eventKey={ uniKey }>
                            <FaAngleDown/>
                        </AccordionToggle>
                    </Card.Header>
                    <Accordion.Collapse eventKey={ uniKey }>
                        <p className="text-danger fst-italic">{ file.error }</p>
                    </Accordion.Collapse>
                </>
            ) : (
                <>
                    <Card.Header className="d-flex justify-content-between align-items-center">
                        <Form
                            onSubmit={ handleSubmit((data) => handleSave(data)) }
                            className="d-flex flex-column justify-content-between align-items-start"
                        >
                            <div className="mb-2">
                                { isLoading &&
                                    <Spinner
                                        animation="border"
                                        variant="primary"
                                        size="sm"
                                        className="me-2"
                                    /> }
                                <h6 className="mb-2 d-inline-flex">
                                    Название предмета: { file.subject }
                                    { hasAlreadySaved && (
                                        <span className='text-warning d-flex align-items-center ms-2'>
                                            <FaCircleExclamation className="me-2"/>
                                            Тест банк c таким названием уже существует
                                        </span>
                                    ) }
                                </h6>
                                <p className="mb-0">
                                    Количество вопросов: { file.questions.length }
                                </p>
                                <p className="mb-0">
                                    Легкие: { questionsDifficultyCount[DifficultyTypes.EASY] || 0 }
                                </p>
                                <p className="mb-0">
                                    Средние: { questionsDifficultyCount[DifficultyTypes.MEDIUM] || 0 }
                                </p>
                                <p className="mb-0">
                                    Сложные: { questionsDifficultyCount[DifficultyTypes.HARD] || 0 }
                                </p>
                                { errorsLength > 0 && (
                                    <p>
                                        Количество ошибок: <span className="text-danger">{ errorsLength }</span>
                                    </p>
                                )}
                            </div>
                            <div className="d-flex align-items-start gap-2 justify-content-center">
                                <div
                                    className="d-flex flex-column"
                                    style={ { width: "250px" } }
                                >
                                    <FloatingLabel label="Количество вопросов в экзамене">
                                        <Form.Control
                                            type="number" { ...register('questionsPerExam', { valueAsNumber: true }) }/>
                                    </FloatingLabel>
                                    { errors['questionsPerExam'] && errors['questionsPerExam'].message && (
                                        <p className="text-danger fst-italic">{ errors['questionsPerExam'].message }</p>
                                    ) }
                                </div>
                                <div className="d-flex flex-column">
                                    <FloatingLabel label="Продолжителность (минут)">
                                        <Form.Control type="number" { ...register('duration', { valueAsNumber: true }) }/>
                                    </FloatingLabel>
                                    { errors['duration'] && errors['duration'].message && (
                                        <p className="text-danger fst-italic">{ errors['duration'].message }</p>
                                    ) }
                                </div>
                                <div className="d-flex flex-column">
                                    <FloatingLabel label="Язык">
                                        <Form.Select
                                            disabled={ isLoading || isUploading }
                                            { ...register('language') }
                                        >
                                            <option value={ Language.UZ }>
                                                Узбекский
                                            </option>
                                            <option value={ Language.RU }>
                                                Русский
                                            </option>
                                            <option value={ Language.EN }>
                                                Английский
                                            </option>
                                        </Form.Select>
                                    </FloatingLabel>
                                    { errors['language'] && errors['language'].message && (
                                        <p className="text-danger fst-italic">{ errors['language'].message }</p>
                                    ) }
                                </div>
                                <div className="ms-auto me-0 d-flex gap-3 align-self-start justify-self-end">
                                    { checkPermission(801) &&
                                        <Button
                                            variant="outline-success"
                                            type="submit"
                                            disabled={ isLoading || isUploading }
                                            className="center p-2 rounded-circle"
                                        >
                                            <FaSave/>
                                        </Button> }
                                    <Button
                                        variant="outline-danger"
                                        onClick={ removeFile }
                                        type="button"
                                        disabled={ isLoading || isUploading }
                                        className="center p-2 rounded-circle"
                                    >
                                        <FaTrash/>
                                    </Button>
                                </div>
                            </div>
                        </Form>
                        <AccordionToggle eventKey={ uniKey }>
                            <FaAngleDown/>
                        </AccordionToggle>
                    </Card.Header>
                    <Accordion.Collapse eventKey={ uniKey }>
                        <>
                            { errorsLength > 0 &&
                                <div
                                    className="alert alert-danger m-3"
                                    role="alert"
                                >
                                    <strong>Ошибки:</strong>
                                    <ul className="mb-0">
                                        {
                                            file.errors.map((error, errorIdx) => (
                                                <li key={ errorIdx }><a
                                                    href={ `#${ idx }-${ error.number }` }
                                                >{ error.message }</a></li>
                                            ))
                                        }
                                    </ul>
                                </div>
                            }
                            <ol>
                                {
                                    file.questions.map((question, questionIdx) => (
                                        <li
                                            key={ questionIdx }
                                            id={ `${ idx }-${ questionIdx }` }
                                        >
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
                                            <hr/>
                                        </li>
                                    ))
                                }
                            </ol>
                        </>
                    </Accordion.Collapse>
                </>
            ) }
        </Card>
    );
}

export default TestBankItem;