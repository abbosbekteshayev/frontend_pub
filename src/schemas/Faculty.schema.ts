import {number, object, string, TypeOf} from "zod";

export const facultySchema = object({
    suffix: string({
        required_error: "Суффикс обязателен",
    }),
    name: object({
        uz: string({
            required_error: 'Название на узбекском обязательно',
        }),
        ru: string({
            required_error: 'Название на русском обязательно',
        }),
        en: string({
            required_error: 'Название на английском обязательно',
        })
    }),
    max_course: number({
        required_error: "Максимальный курс обязателен",
    }).min(1, {message: "Максимальный курс должен быть больше 0"}).max(6, {message: "Максимальный курс должен быть меньше 7"}),
    branch: string({
        required_error: "Филиал обязателен"
    }).uuid({message: "Филиал должен быть валидным UUID"}),
})

export type FacultyInput = TypeOf<typeof facultySchema>