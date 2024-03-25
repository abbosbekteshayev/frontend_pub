import {useCallback, useEffect, useRef, useState} from 'react';
import {useParams} from "react-router-dom";
import {AnswerOption, useGetAnswerSheetQuery} from "@/api/AnswerSheet.api.ts";
import {Alert, Button, Card, Container} from "react-bootstrap";
import {ClipLoader, ScaleLoader} from "react-spinners";
import {AxiosError} from "axios";
import {GenericResponse} from "@/types";
import useStateContext from "@/hooks/useStateContext.tsx";
import {FaFilePdf} from "react-icons/fa6";
import {getDuration, getDurationFromMinute} from "@/utils/time.ts";
import classNames from "classnames";
import {downloadAsPDF} from "@/utils/renderPDF.ts";
import {toast} from "react-toastify";
import {ACTIONS} from "@/utils/constants.ts";

const variants = ['A', 'B', 'C', 'D', "(не отвечено)", "(нет ответа)"]

const AnswerSheetPage = () => {
    const {answerSheetIdx} = useParams<{ answerSheetIdx: string }>();
    const {dispatch} = useStateContext();
    const [isDownloadingPDF, setIsDownloadingPDF] = useState<boolean>(false);
    const htmlContent = useRef<HTMLElement | null>(null);

    const {data: answerSheet, isFetching, isError, error} = useGetAnswerSheetQuery(answerSheetIdx!);

    useEffect(() => {
        dispatch({
            type: ACTIONS.SET_BREADCRUMBS,
            payload: [
                {label: 'Dashboard', path: '/'},
                {label: 'Exam Sessions', path: '/exam-sessions'},
                {
                    label: answerSheet?.examinee?.examSession.name,
                    path: `/exam-sessions/${answerSheet?.examinee?.examSession.id}`
                },
                {
                    label: answerSheet?.examinee.full_name,
                    path: `/answer-sheets/${answerSheetIdx}`
                }
            ]
        })
    }, [answerSheet?.examinee?.examSession.id, answerSheet?.examinee?.examSession.name, answerSheet?.examinee.full_name, dispatch, answerSheetIdx]);

    const handlePDFDownload = useCallback(() => {
        if (isDownloadingPDF) return
        setIsDownloadingPDF(true)
        const element = htmlContent.current
        if (element) {
            downloadAsPDF(element, `answer-sheet-${answerSheetIdx}.pdf`).then(() => {
                setIsDownloadingPDF(false)
            }).catch(err => {
                setIsDownloadingPDF(false)
                toast.error(err.message)
            })
        }
    }, [isDownloadingPDF, answerSheetIdx])

    const givenAnswer = useCallback((answer) => {
        const ans = answer.answerOptions.indexOf(answer.answerOptions.find(o => o.id === answer.answer))
        if (ans === -1) {
            return variants[4]
        } else {
            return ans + 1
        }
    }, [])
    const correctAnswer = useCallback((answer) => {
        const ans = answer.answerOptions.indexOf(answer.answerOptions.find(o => o.correct))
        if (ans === -1) {
            return variants[5]
        } else {
            return ans + 1
        }
    }, [])

    return (
        <Container>
            <Card className="animate__animated animate__faster animate__fadeIn shadow">
                <Card.Header className="d-flex justify-content-between align-items-center">
                    <p className="fs-5 mb-0">Протокол тестирования <b> {answerSheet?.examinee.full_name}</b></p>
                    <Button className="btn-icon" variant="danger" disabled={isDownloadingPDF}
                            onClick={handlePDFDownload}>
                        {isDownloadingPDF ?
                            <div className="d-flex align-items-center">
                                <ClipLoader color="#fff" size={15}/>
                            </div>
                            : <FaFilePdf/>}
                    </Button>
                </Card.Header>
                <Card.Body>
                    {isFetching && (
                        <div className="d-flex justify-content-center">
                            <ScaleLoader color="#0096DB" height={15}/>
                        </div>
                    )}

                    {isError && (
                        <Alert variant="danger">
                            <p className="mb-0">
                                <b>Error: </b>
                                {(error as AxiosError<GenericResponse>).response?.data.message || (error as AxiosError).message}
                            </p>
                        </Alert>
                    )}

                    {answerSheet && (
                        <div className="d-flex flex-column" ref={htmlContent}>
                            <h4 className="mb-3">1. Общие сведения</h4>
                            <table>
                                <tbody>
                                <tr>
                                    <th style={{width: '300px'}}>Дата и время тестирования:</th>
                                    <td className="fw-medium">{new Date(answerSheet.startedAt).toLocaleString()}</td>
                                </tr>
                                <tr>
                                    <th>Тест:</th>
                                    <td className="fw-medium">{answerSheet.subject}</td>
                                </tr>
                                <tr>
                                    <th>Выполнил:</th>
                                    <td className="fw-medium">{answerSheet.examinee.full_name}</td>
                                </tr>
                                <tr>
                                    <th>Компьютер экзаменуемего:</th>
                                    <td className="fw-medium">{answerSheet.examinee.ip_address}</td>
                                </tr>
                                </tbody>
                            </table>
                            <hr/>
                            <h4 className="mb-3">2. Результаты тестирования</h4>
                            <table>
                                <tbody>
                                <tr>
                                    <th style={{width: '300px'}}>Пройдено вопросов:</th>
                                    <td className="fw-medium">{answerSheet.correctAnswers.length} из {answerSheet.totalQuestions}</td>
                                </tr>
                                <tr>
                                    <th>Затрачено времени:</th>
                                    <td className="fw-medium">
                                        {answerSheet.startedAt !== null && answerSheet.finishedAt !== null ?
                                            `${getDuration(answerSheet.startedAt, answerSheet.finishedAt)} из ${getDurationFromMinute(answerSheet.duration)}` :
                                            <span className="text-danger">Время не указано</span>
                                        }
                                    </td>
                                </tr>
                                <tr>
                                    <th>Оценка:</th>
                                    <td className="fw-medium">
                                        {answerSheet.finishedAt ? (
                                            <>{answerSheet.totalPoints}%</>
                                        ) : (
                                            <span className="text-danger">
                                            Не завершено
                                        </span>
                                        )}
                                    </td>
                                </tr>
                                </tbody>
                            </table>
                            <hr/>

                            <h4 className="mb-3">3. Протокол тестирования</h4>
                            <div className="test-protocol">
                                {answerSheet.answers.sort((a, b) => a.questionNumber - b.questionNumber).map((answer, index) => (
                                    <div className="test-protocol-answer" key={index}>
                                        <div className="bg-gray fs-4 py-1 px-2 m-0 fw-medium">Вопрос
                                            №{answer.questionNumber}</div>
                                        <p className="fs-5 p-3 fw-bold"
                                           dangerouslySetInnerHTML={{__html: answer.questionText}}></p>
                                        <ul className="list-unstyled ms-3">
                                            {answer.answerOptions.map((option, index) => (
                                                <li className="test-protocol-answer-option mb-2" key={index}>
                                                    <div className="key">
                                                        <span className="text">{index + 1}</span>
                                                        <div className="angle-shadow left-top top-section"></div>
                                                        <div className="angle-shadow right-top top-section"></div>
                                                        <div className="angle-shadow left-bottom bottom-section"></div>
                                                        <div className="angle-shadow right-bottom bottom-section"></div>
                                                    </div>
                                                    <input type="checkbox" checked={answer.answer === option.id}/>
                                                    <p dangerouslySetInnerHTML={{__html: option.option}} className="mb-0"></p>
                                                </li>
                                            ))}
                                        </ul>
                                        {answer.answer && (
                                            <div className={classNames("d-flex flex-column fs-5 mb-3", {
                                                'text-success': answer.answer === (answer.answerOptions.find(o => o.correct) as AnswerOption)?.id,
                                                'text-danger': answer.answer !== (answer.answerOptions.find(o => o.correct) as AnswerOption)?.id
                                            })}>
                                                <span><i>Дан ответ:</i> <b>{givenAnswer(answer)}</b></span>
                                                <span><i>Правильный ответ:</i> <b>{correctAnswer(answer)}</b></span>
                                            </div>
                                        )}

                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </Card.Body>
            </Card>
        </Container>
    );
};

export default AnswerSheetPage;