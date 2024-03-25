import { Dispatch, SetStateAction, useCallback } from 'react';
import { Accordion } from "react-bootstrap";
import TestBankItem from "@/components/TestBankItem.tsx";
import { ITestBankSubjectsResponse } from "@/api/TestBank.api.ts";
import { AxiosError } from "axios";
import { GenericResponse } from "@/types";
import { Language } from "@/types/ExamType.ts";
import { useQuery } from "@tanstack/react-query";
import useAxios from "@/hooks/useAxios.ts";

type TOption = {
    option: string
    correct: boolean
}

type TQuestion = {
    difficulty_level: number
    question: string
    options: TOption[]
}

export type TTestBankFile = {
    name: string
    file: File
    language: Language
    subject: string
    error?: string
    saved?: boolean
    questions: TQuestion[]
    errors: {number: number, message: string}[]
}


const TestBankFiles = ({files, setFiles}: {
    files: TTestBankFile[],
    setFiles: Dispatch<SetStateAction<TTestBankFile[]>>
}) => {
    const axios = useAxios()

    const {data: subjects, isFetching, isError, error} = useQuery({
        queryKey: ['test-bank', 'subjects'],
        queryFn: async () => {
            const res = await axios.get<ITestBankSubjectsResponse>('/test/test-bank/subjects');
            return res.data;
        },
        select: (data) => Object.values(data.data.subjects)
    })

    const removeFile = useCallback((idx: number) => {
        setFiles((prev) => prev.filter((_, i) => i !== idx))
    }, [setFiles])

    const saveFile = useCallback((idx: number) => {
        setFiles((prev) => prev.map((file, i) => {
            if (i === idx) {
                file.saved = true
            }
            return file
        }))
    }, [setFiles])

    if (isFetching) return <div className="alert alert-primary"><p>Загрузка...</p></div>
    if (isError) return (
        <div className="alert alert-danger">
            <p>{(error as AxiosError<GenericResponse>).response?.data.message || (error as AxiosError).message}</p>
        </div>
    )

    return files.length > 0 && subjects &&
        <Accordion>
            {
                files.map((file, idx) => (
                    <TestBankItem
                        key={`${file.name}${idx}`}
                        file={file}
                        idx={idx}
                        saveFile={() => saveFile(idx)}
                        removeFile={() => removeFile(idx)}
                        hasAlreadySaved={subjects.includes(file.subject) || files.find((f, i) => i !== idx && f.subject === file.subject) !== undefined}
                    />
                ))
            }
        </Accordion>
};

export default TestBankFiles;