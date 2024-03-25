import {Card, Container} from "react-bootstrap";
import FileUpload from "@/components/ui/FileUpload.tsx";
import {useCallback, useEffect, useState} from "react";
import useStateContext from "@/hooks/useStateContext.tsx";
import TestBankFiles, {TTestBankFile} from "@/components/TestBankFiles.tsx";
import parseHTMLQuestions from "@/utils/questionParser.ts";
import validateQuestionFile from "@/utils/validateQuestionFile.ts";
import questionValidation from "@/utils/questionValidation.ts";
import {ACTIONS} from "@/utils/constants.ts";
import {Language} from "@/types/ExamType.ts";

const TestBankUpload = () => {
    const {dispatch} = useStateContext()

    const [files, setFiles] = useState<TTestBankFile[]>([])

    const onDrop = useCallback((acceptedFiles: File[]) => {
            for (const file of acceptedFiles) {
                validateQuestionFile(file).then((result) => {
                    if (result.valid) {
                        const subject = file.name.split(".")[0].toUpperCase()
                        const v = subject.split("_")
                        const v2 = v[v.length - 1].toLowerCase() as Language
                        const language = [Language.RU, Language.UZ, Language.EN].includes(v2) ? v2 : Language.RU

                        setFiles((prev) => [...prev, {
                            subject,
                            language,
                            name: file.name,
                            file,
                            ...questionValidation(parseHTMLQuestions(result.value))
                        }])
                    } else {
                        const p = document.createElement('p')
                        p.className = 'alert alert-danger'
                        p.innerText = result.value

                    }
                })
            }
        },
        []
    )

    useEffect(() => {
        dispatch({
            type: ACTIONS.SET_BREADCRUMBS,
            payload: [
                {label: 'Тест-банк', path: '/test-bank'},
                {label: 'Загрузить', path: '/test-bank/upload'}
            ]
        })
    }, [dispatch]);
    return (
        <Container fluid="lg">
            <Card className="animate__animated animate__faster animate__fadeIn shadow">
                <Card.Header>
                    <h5>
                        Загрузить тест-банк
                    </h5>
                </Card.Header>
                <Card.Body>
                    <FileUpload onDrop={onDrop}/>
                    <TestBankFiles files={files} setFiles={setFiles}/>
                </Card.Body>
            </Card>
        </Container>
    );
};

export default TestBankUpload;