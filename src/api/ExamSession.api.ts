import authAxios from "@/utils/axios.ts";
import {useMutation, useQuery} from "@tanstack/react-query";
import {ExamType} from "@/types/ExamType.ts";
import {AxiosError} from "axios";
import { ErrorResponse, ResponseWithData } from "@/types";
import {ExamSessionCreateInput, ExamSessionUpdateInput} from "@/schemas/ExamSession.schema.ts";
import { TestBank } from "@/api/TestBank.api.ts";

export interface ExamSessions {
    "id": string
    "created_at": string
    "updated_at": string
    "deleted_at": null,
    "name": string
    "examType": string
    "active": boolean,
    "only_exam_room": boolean,
    "rooms": {
            "id": string
            "created_at": string
            "updated_at": string
            "deleted_at": null,
            "name": string
            "capacity": number,
            "active": boolean,
            "is_exam_room": boolean,
            "timetable_id": string
        }[]
    "branch": {
        "id": string
        "created_at": string
        "updated_at": string
        "deleted_at": null,
        "name": {
            "uz": string
            "ru": string
            "en": string
        }
    }
}

interface ExamSession {
    id: string;
    name: string;
    examType: ExamType;
    examinees: IExamSessionExaminee[]
}

interface ExamSessionExamineeResponse {
    status: "success" | "fail";
    data: {
        examSession: ExamSession
    }
}

type TExamSessionMutation = {
    onSuccess?: (data: ExamSessionExamineeResponse) => void;
    onError?: (error: AxiosError<ErrorResponse>) => void;
}

export const createExamSessionFn = async (data: ExamSessionCreateInput) => {
    const res = await authAxios.post('/test/exam-sessions', data);
    return res.data;
}

// --------------------------- Update Exam Session ---------------------------
const updateExamSessionFn = async ({id, ...input}: { id: string } & ExamSessionUpdateInput) => {
    const res = await authAxios.patch<IExamSessionResponse>(`/test/exam-sessions/${id}`, input);
    return res.data;
}

export const useUpdateExamSessionMutation = ({onSuccess, onError}: TExamSessionMutation) => {
    return useMutation({
        mutationFn: updateExamSessionFn,
        onSuccess,
        onError
    })
}

export const getAllExamSessionsFn = async (): Promise<ResponseWithData<{examSessions: ExamSessions[]}>> => {
    const res = await authAxios.get('/test/exam-sessions');
    return res.data;
}

const deleteExamSessionFn = async (idx: string) => {
    const res = await authAxios.delete(`/test/exam-sessions/${idx}`);
    return res.data;
}

export const useDeleteExamSessionMutation = ({onSuccess, onError}: TExamSessionMutation) => {
    return useMutation({
        mutationFn: deleteExamSessionFn,
        onSuccess,
        onError
    })
}

export const activationExamSessionFn = async (idx: string) => {
    const res = await authAxios.patch(`/test/exam-sessions/${idx}/activation`);
    return res.data;
}

export interface IExamSessionExaminee {
    id: string;
    full_name: string;
    identifier: string
    username: string;
    password: string;
    date: string
    time: string
    answerSheet: null | {
        "id": string
        "created_at": string
        "updated_at": string
        "deleted_at": null,
        "startedAt": string
        "finishedAt": string
        "totalPoints": number,
        "isFinished": boolean,
        "duration": number,
        "subject": string
        "totalQuestions": number,
        "correctAnswers": string[],
        "wrongAnswers": string[],
        "visited": string[],
        "notVisited": [],
        "reviews": [],
        "status": string,
        "progress": string[]
    }
    questions: number
    subject: string;
    percentOfCorrectAnswers: number;
    totalQuestions: number;
    totalCorrectAnswers: number;
    duration: string;
    status: string;
    testBank: TestBank
    difficulty_level: number
}

export interface IExamSessionExamineesResponse {
    status: "success" | "fail";
    data: {
        examinees: IExamSessionExaminee[]
        total: number
    }
}

export interface IExamSessionResponse {
    status: "success" | "fail";
    data: {
        examSession: {
            id: string
            name: string
            active: boolean
        }
    }
}

const getExamSessionFn = async (idx: string) => {
    const res = await authAxios.get<IExamSessionResponse>(`/test/exam-sessions/${idx}`);
    return res.data;
}

export const useExamSessionQuery = (idx: string) => {
    return useQuery({
        queryKey: ['exam-session', idx],
        queryFn: () => getExamSessionFn(idx),
        select: (data) => data.data.examSession
    })
}

const resetExamineeFn = async (idx: string) => {
    const res = await authAxios.delete(`/test/exam-sessions/examinee/${idx}/reset`);
    return res.data;
}

export const useResetExamineeMutation = ({onSuccess, onError}: TExamSessionMutation) => {
    return useMutation({
        mutationFn: resetExamineeFn,
        onSuccess,
        onError
    })
}

export type ExamResult = {
    identifier: string
    full_name: string
    subject: string
    status: string
    total_questions: number
    correct_answers: number
    percentage: number
    duration: number
}

interface ExamResultsResponse {
    status: "success";
    data: {
        results: ExamResult[]
    }
}

const getExamResultsFn = async (idx: string) => {
    const res = await authAxios.get<ExamResultsResponse>(`/test/exam-sessions/${idx}/results`);
    return res.data;
}

export const useExamResultsQuery = (idx: string, options: object) => {
    return useQuery({
        queryKey: ['exam-results', idx],
        enabled: false,
        queryFn: () => getExamResultsFn(idx),
        select: (data) => data.data.results,
        ...options
    })
}

export type ExamCredentials = {
    identifier: string
    full_name: string
    subject: string
    date: string
    time: string
    username: string
    password: string
}


interface ExamCredentialsResponse {
    status: "success";
    data: {
        credentials: ExamCredentials[]
    }
}

const getExamCredentialsFn = async (idx: string) => {
    const res = await authAxios.get<ExamCredentialsResponse>(`/test/exam-sessions/${idx}/credentials`);
    return res.data;
}

export const useExamCredentialsQuery = (idx: string, options: object) => {
    return useQuery({
        queryKey: ['exam-credentials', idx],
        enabled: false,
        queryFn: () => getExamCredentialsFn(idx),
        select: (data) => data.data.credentials,
        ...options
    })
}