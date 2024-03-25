import authAxios from "@/utils/axios.ts";
import {useQuery} from "@tanstack/react-query";

export type AnswerOption = {
    id: string;
    option: string;
    correct: boolean;
}

type Answer = {
    id: string;
    questionNumber: number;
    questionId: string;
    questionText: string;
    answer: string
    isCorrect: boolean;
    startedAt: string;
    answeredAt: string;
    answerOptions: AnswerOption[];
}

type AnswerSheet = {
    id: string;
    startedAt: string;
    finishedAt: string | null;
    totalPoints: number | null;
    correctAnswers: string[];
    duration: number;
    totalQuestions: number;
    subject: string;
    examinee: {
        id: string;
        full_name: string;
        examSession: {
            id: string;
            name: string;
        }
    },
    answers: Answer[]
}

interface IAnswerSheetResponse {
    status: "success";
    data: {
        answerSheet: AnswerSheet;
    }
}

const getAnswerSheetFn = async (id: string) => {
    const res = await authAxios.get<IAnswerSheetResponse>(`/test/answer-sheets/${id}`);
    return res.data;
}

export const useGetAnswerSheetQuery = (id: string) => {
    return useQuery({
        queryKey: ['answerSheet', id],
        queryFn: () => getAnswerSheetFn(id),
        select: data => data.data.answerSheet,
    });
}