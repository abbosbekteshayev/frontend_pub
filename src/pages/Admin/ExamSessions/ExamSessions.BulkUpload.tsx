import { Button, Container, FloatingLabel, Form, ListGroup } from "react-bootstrap";
import { useNavigate, useParams } from "react-router-dom";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useCallback, useEffect, useMemo, useState } from "react";
import useAxios from "@/hooks/useAxios.ts";
import authAxios from "@/utils/axios.ts";
import { FaTrash } from "react-icons/fa6";
import { FieldValues, useForm } from "react-hook-form";
import { toast } from "react-toastify";
import { Typeahead } from "react-bootstrap-typeahead";
import FloatingSelect from "@/components/ui/FloatingSelect.tsx";
import { zodResolver } from "@hookform/resolvers/zod";
import { examSessionBulkUploadSchema } from "@/schemas/ExamSession.schema.ts";
import { ACTIONS } from "@/utils/constants.ts";
import useStateContext from "@/hooks/useStateContext.tsx";

const BulkUpload = () => {
    const navigate = useNavigate();
    const { idx } = useParams<{ idx: string }>();
    const axios = useAxios();
    const {dispatch} = useStateContext();

    const [branch, setBranch] = useState<string>("");
    const [faculty, setFaculty] = useState<string>("");
    const [collectedSubjectsID, setCollectedSubjectsID] = useState<string[]>([]);
    const [selectedTypeahead, setSelectedTypeahead] = useState<string[]>([]);

    const { register, handleSubmit, watch, formState: { errors } } = useForm<FieldValues>({
        resolver: zodResolver(examSessionBulkUploadSchema),
        defaultValues: {
            groups: [],
            testBanks: [],
            date: '',
            time: '',
            duration: 60,
            amountOfQuestions: 35,
            difficulty_level: 1
        }
    })

    const { data: examingSession } = useQuery({
        queryKey: ['examing-session', `${ idx }`],
        queryFn: async () => {
            const { data } = await axios.get(`/test/exam-sessions/${ idx }`);
            return data;
        },
        select: (data) => data.data.examSession
    });

    useEffect(() => {
        dispatch({
            type: ACTIONS.SET_BREADCRUMBS,
            payload: [
                { label: 'Экзаменационные сессии', path: '/exam-sessions' },
                { label: examingSession?.name, path: `/exam-sessions/${ idx }` },
                { label: 'Массовая загрузка', path: `/exam-sessions/${ idx }/bulk-upload` }
            ]
        })
    }, [dispatch, examingSession?.name, idx]);

    useEffect(() => {
        if (examingSession) setBranch(examingSession.branch.id);
    }, [examingSession])

    const { data: faculties } = useQuery({
        queryKey: ['faculties', `${ branch }`],
        enabled: !!branch,
        queryFn: async () => {
            const { data } = await axios.get(`/core/faculties/branch/${ branch }/`)
            return data;
        },
        select: (data) => data.data.faculties.map(faculty => {
            return {
                ...faculty,
                name: faculty.name.ru
            }
        })
    })

    const { data: groups } = useQuery({
        enabled: !!faculty,
        queryKey: ['groups', `${ faculty }`],
        queryFn: async () => {
            const url = `/core/groups/faculty/${ faculty }/`
            const { data } = await authAxios.get(url)
            return data
        },
        select: (data) => data.data.groups
    })

    const { data: testBanks } = useQuery({
        queryKey: ['test-bank'],
        queryFn: async () => {
            const { data } = await authAxios.get('/test/test-bank/active');
            return data;
        },
        select: (data) => data.data.testBanks
    })

    const filteredTestBanks = useMemo(() => {
        return testBanks?.filter((test) => !collectedSubjectsID.includes(test.id)).map((test) => ({
            id: test.id,
            subject: `${ test.code } - ${ test.subject }`
        }))
    }, [testBanks, collectedSubjectsID])

    const collectedSubjects = useMemo(() => {
        if (collectedSubjectsID.length === 0) return [];

        return testBanks?.filter((test) => collectedSubjectsID.includes(test.id));
    }, [collectedSubjectsID, testBanks])

    const deleteSubjectFromCollection = useCallback((id: string) => () => {
        setCollectedSubjectsID(collectedSubjectsID.filter((subject) => subject !== id))
    }, [collectedSubjectsID])

    const { mutate: uploadDataToExamingSession } = useMutation({
        mutationFn: async (data) => {
            const response = await authAxios.post(`/test/exam-sessions/${ idx }/bulk-create/`, {
                ...data,
                testBanks: collectedSubjectsID
            })
            return response.data;
        },
        onSuccess: () => {
            toast.success('Успешно загружено');
            navigate(`/exam-sessions/${ idx }`);
        },
        onError: () => {
            toast.error('Ошибка загрузки');
        }
    })

    return (
        <Container fluid="lg">
            <Form
                className="row"
                onSubmit={ handleSubmit(formData => uploadDataToExamingSession(formData)) }
            >
                <Form.Group
                    controlId="formFaculty"
                    className="col-6"
                >
                    <FloatingSelect
                        label="Выберите факультет"
                        labelKey="name"
                        valueKey="id"
                        id="faculty"
                        valueAsNumber
                        watch={ watch }
                        register={ register }
                        errors={ errors }
                        options={ faculties }
                        onChange={ (e) => setFaculty(e.target.value) }
                    />
                    <hr/>
                    <Form.Label>
                        Выберите группу <i className="text-info">(можно выбрать несколько с помощью CTRL)</i>
                    </Form.Label>
                    <Form.Control
                        type="select"
                        className="h-50"
                        placeholder="Select Group"
                        required
                        multiple
                        { ...register("groups") }
                        as="select"
                    >
                        { groups > 1 && <option>Выберите группу</option> }
                        {
                            groups?.map((group) => (
                                <option
                                    key={ group.id }
                                    value={ group.id }
                                >
                                    { group.name }
                                </option>
                            ))
                        }
                    </Form.Control>
                    { errors.groups &&
                        <Form.Text className="text-danger">{ errors.groups.message }</Form.Text>
                    }
                </Form.Group>
                <Form.Group className="col-6">
                    <FloatingLabel
                        controlId="duration"
                        label="Продолжительность экзамена (min)"
                        className={ `mb-3 ${ errors.duration ? 'is-invalid' : '' }` }
                    >
                        <Form.Control
                            type="number"
                            placeholder="Enter duration"
                            required
                            { ...register("duration", { valueAsNumber: true }) }
                        />
                        { errors.duration &&
                            <Form.Text className="text-danger">{ errors.duration.message }</Form.Text> }
                    </FloatingLabel>
                    <hr/>

                    <FloatingLabel
                        controlId="amountOfQuestions"
                        label="Количество вопросов"
                        className={ `mb-3 ${ errors.amountOfQuestions ? 'is-invalid' : '' }` }
                    >
                        <Form.Control
                            type="number"
                            placeholder="Enter amount"
                            required
                            { ...register("amountOfQuestions", { valueAsNumber: true }) }
                        />
                        { errors.amountOfQuestions &&
                            <Form.Text className="text-danger">{ errors.amountOfQuestions.message }</Form.Text> }
                    </FloatingLabel>
                    <hr/>
                    <Form.Label>Дата и время экзамена</Form.Label>
                    <Form.Control
                        type="date"
                        { ...register("date") }
                    />
                    { errors.date &&
                        <Form.Text className="text-danger">
                            { errors.date.message }
                        </Form.Text> }

                    <Form.Control
                        type="time"
                        { ...register("time") }
                    />
                    { errors.time &&
                        <Form.Text className="text-danger">
                            { errors.time.message }
                        </Form.Text> }
                </Form.Group>

                <Form.Group className="col-12 mb-3">
                    <hr/>
                    <Form.Label>TEST BANK</Form.Label>
                    <Typeahead
                        id="testBanksID"
                        labelKey="subject"
                        onChange={ (e) => {
                            setCollectedSubjectsID([...collectedSubjectsID, e[0].id]);
                            setSelectedTypeahead([])
                        } }
                        options={ filteredTestBanks }
                        placeholder="Choose several states..."
                        selected={ selectedTypeahead }
                    />
                    <hr/>
                    <Form.Label>Предметы которые выбраны</Form.Label>
                    <ListGroup>
                        { collectedSubjects.length > 0 ? collectedSubjects.map((subject) => (
                                <ListGroup.Item
                                    className="d-flex align-items-center"
                                    key={ subject.id }
                                >
                                    { subject.code } - { subject.subject }
                                    <Button
                                        className="btn-danger ms-auto d-flex align-items-center"
                                        onClick={ deleteSubjectFromCollection(subject.id) }
                                    >
                                        <FaTrash/>
                                    </Button>
                                </ListGroup.Item>
                            )) :
                            <p className="text-danger">Предметы не выбраны</p>
                        }

                    </ListGroup>
                </Form.Group>

                <Form.Group className="col-12">
                    <FloatingSelect
                        label="Уровень сложности"
                        id="difficulty_level"
                        valueAsNumber
                        watch={ watch }
                        register={ register }
                        errors={ errors }
                        placeholder="Difficulty level"
                        options={ [
                            { label: 'Легкий', value: 1 },
                            { label: 'Средний', value: 2 },
                            { label: 'Сложный', value: 3 },
                        ] }
                        defaultValue={ 3 }
                    />
                </Form.Group>

                <Form.Group className="col-12">
                    <Button
                        className="btn-success w-100"
                        type="submit"
                    >
                        Загрузить
                    </Button>
                </Form.Group>
            </Form>
        </Container>
    )
};

export default BulkUpload;