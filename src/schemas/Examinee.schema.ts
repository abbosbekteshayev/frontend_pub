import {number, object, string, TypeOf} from "zod";

export const examineeSchema = object({
    identifier: string({
        required_error: "ID обязателен",
    }),
    full_name: string({
        required_error: "ФИО обязательно",
    }),
    subject: string({
        required_error: "Предмет обязателен",
    }).uuid({message: "Выберите предмет из списка"}),
    date: string({
        required_error: "Дата обязательна",
    }).regex(/^\d{4}-\d{2}-\d{2}$/, {message: "Неверный формат даты"}),
    time: string({
        required_error: "Время обязательно",
    }).regex(/^\d{2}:\d{2}$/, {message: "Неверный формат времени"}),
    duration: number({
        required_error: "Длительность обязательна",
    }).nullable(),
    questions: number({
        required_error: "Вопросы обязательны",
    }).nullable(),
})

export type ExamineeInput = TypeOf<typeof examineeSchema>