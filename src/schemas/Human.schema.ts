import { date, literal, z } from 'zod';

export enum GENDER {
    MALE = "m",
    FEMALE = "f",
}

export const humanSchema = z.object({
    identifier: z.string({
        required_error: "Идентификатор обязателен",
    }),
    last_name: z.string({
        required_error: "Фамилия обязательна",
    }),
    first_name: z.string({
        required_error: "Имя обязательно",
    }),
    middle_name: z.string().optional(),
    pinfl: z.string().trim().length(14, {
        message: "Пинфл должен состоять из 14 символов"
    }).nullish().optional().or(z.literal("")),
    passport_number: z.string({
        required_error: "Номер паспорта обязателен",
    }).min(7, {
        message: "Номер паспорта должен состоять из 7 символов"
    }).max(14, {
        message: "Номер паспорта должен состоять из 14 символов"
    }),
    email: z.string().email().nullable().optional().or(literal('')),
    birth_date: date().nullable().nullish().optional(),
    gender: z.nativeEnum(GENDER).optional(),
});
