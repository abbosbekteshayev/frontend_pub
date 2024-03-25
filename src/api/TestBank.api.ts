import authAxios from "@/utils/axios.ts";
import {GenericResponse, ErrorResponse} from "@/types";
import {useMutation, useQuery} from "@tanstack/react-query";
import {AxiosError} from "axios";
import {TestBankInput} from "@/schemas/TestBank.schema.ts";

export type QuestionOption = {
    id: string;
    option: string;
    correct: boolean;
}

export type Question = {
    id: string;
    question: string;
    options: QuestionOption[];
    difficulty_level: number;
}

export interface TestBank {
    id: string;
    subject: string;
    language: string;
    code: number;
    filename: string;
    created_at: string;
    duration: number;
    totalQuestions: number;
    questionsPerExam: number;
    questions: Question[];
}

export interface ISingleTestBankResponse {
    status: string;
    data: {
        testBank: TestBank
    }
}

export interface ITestBankResponse {
    status: string;
    data: {
        testBanks: TestBank[]
    }
}

// ---------------------------------------------- Create Update Test Bank ----------------------------------------------
type TCreateUpdateTestBankMutation = {
    onSuccess: (data: ISingleTestBankResponse) => void;
    onError: (error: AxiosError<ErrorResponse>) => void;
}

// --------------------------- Create Test Bank ---------------------------
const createTestBankFn = async (data: TestBankInput & { questions: Question[] }) => {
    const res = await authAxios.post<ISingleTestBankResponse>('/test/test-bank', data);
    return res.data;
}

export const useCreateTestBankMutation = ({onSuccess, onError}: TCreateUpdateTestBankMutation) => {
    return useMutation({
        mutationFn: createTestBankFn,
        onSuccess,
        onError
    })
}

// --------------------------- Update Test Bank ---------------------------
const updateTestBankFn = async ({id, ...input}: { id: string } & TestBankInput) => {
    const res = await authAxios.patch<ISingleTestBankResponse>(`/test/test-bank/${id}`, input);
    return res.data;
}

export const useUpdateTestBankMutation = ({onSuccess, onError}: TCreateUpdateTestBankMutation) => {
    return useMutation({
        mutationFn: updateTestBankFn,
        onSuccess,
        onError
    })
}

// ---------------------------------------------- Get Test Bank ----------------------------------------------

const getTestBankFn = async (id: string) => {
    const res = await authAxios.get<ISingleTestBankResponse>(`/test/test-bank/${id}`);
    return res.data;
}

export const useGetTestBankQuery = (id: string) => {
    return useQuery({
        queryKey: ['test-bank', id],
        queryFn: () => getTestBankFn(id),
        select: (data) => data.data.testBank
    })
}

// ------------------------------------- Get All Test Bank -------------------------------------
const getAllTestBankFn = async () => {
    const res = await authAxios.get<ITestBankResponse>('/test/test-bank');
    return res.data;
}

export const useGetAllTestBankQuery = () => {
    return useQuery({
        queryKey: ['test-bank'],
        queryFn: getAllTestBankFn,
        select: (data) => data.data.testBanks
    })
}

// ------------------------------------- Test Bank Subjects -------------------------------------
export interface ITestBankSubjectsResponse {
    status: string;
    data: {
        codes: number[];
        subjects: { [key: number]: string };
    }
}

// ------------------------------------- Delete Test Bank -------------------------------------
interface ITestBankDeleteResponse {
    status: string;
}

const deleteTestBankFn = async (id: string) => {
    const res = await authAxios.delete<ITestBankDeleteResponse>(`/test/test-bank/${id}`)
    return res.data
}

type TDeleteTestBankMutation = {
    onSuccess: (data: ITestBankDeleteResponse) => void;
    onError: (error: AxiosError<GenericResponse>) => void;
}

export const useDeleteTestBankMutation = ({onSuccess, onError}: TDeleteTestBankMutation) => {
    return useMutation({
        mutationFn: deleteTestBankFn,
        onSuccess,
        onError
    })
}


