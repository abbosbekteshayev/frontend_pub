import {nativeEnum, number, object, string, TypeOf} from "zod";

export enum Language {
    UZ = "uz",
    RU = "ru",
    EN = "en"
}

export enum EducationType {
    FULL_TIME = "full_time",
    EVENING_TIME = "evening_time",
    EXTRAMURAL = "extramural"
}


export const groupSchema = object({
    name: string({required_error: 'Название обязательно'}),
    start_year: number({required_error: 'Год начала обязателен'})
        .min(2018, {
            message: 'Год начала должен быть больше или равен 2018',
        })
        .max(new Date().getFullYear(), {
            message: `Год начала должен быть меньше или равен ${new Date().getFullYear()}`,
        }),
    end_year: number({required_error: 'Год окончания обязателен'})
        .min(2018, {
            message: 'Год начала должен быть больше или равен 2018',
        }),
    faculty: string({
        required_error: "Факультет обязателен"
    }).uuid({
        message: "Выберите факультет"
    }),
    course: number({
        required_error: "Курс обязателен"
    }).min(1, {
        message: "Курс должен быть больше или равен 1"
    }).max(6, {
        message: "Курс должен быть меньше или равен 6"
    }),
    language: nativeEnum(Language, {
        required_error: "Язык обязателен"
    }),
    education_type: nativeEnum(EducationType, {
        required_error: "Тип обучения обязателен"
    }),
    timetable_id: string().optional(),
})

export type GroupInput = TypeOf<typeof groupSchema>