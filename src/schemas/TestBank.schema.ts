import {nativeEnum, number, object, string, TypeOf, array, boolean} from "zod";
import {Language} from "@/types/ExamType.ts";

export const testBankSchema = object({
    subject: string({
        required_error: 'Название предмета обязательно для заполнения',
    }).max(255, 'Название предмета не должно превышать 255 символов'),
    questionsPerExam: number({required_error: 'Количество вопросов на экзамен обязательно'}).min(1, 'Количество вопросов на экзамен не должно быть меньше 1'),
    duration: number({required_error: 'Продолжительность обязательна'}).min(1, 'Продолжительность не должна быть меньше 1 минуты'),
    language: nativeEnum(Language, {required_error: 'Язык обязателен'}),
    totalQuestions: number({required_error: 'Общее количество вопросов обязательно'}),
    trial_available: boolean().default(true)
}).refine(data => data.questionsPerExam <= data.totalQuestions, {
    path: ['questionsPerExam'],
    message: 'Количество вопросов на экзамен не может быть больше общего количества вопросов',
})

export const testBankUpdateSchema = object({
    question: string({
        required_error: 'Вопрос обязателен для заполнения',
    }),
    options: array(
        object({
            id: string().nullish(),
            option: string({
                required_error: 'Вариант ответа обязателен для заполнения',
            }),
            correct: boolean({
                required_error: 'Правильность ответа обязательна для заполнения',
            })
        })
    ),
    difficulty_level: number().default(1)
})

export type TestBankInput = TypeOf<typeof testBankSchema>;