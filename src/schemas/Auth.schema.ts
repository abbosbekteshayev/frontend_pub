import {object, string, TypeOf} from "zod";

export const loginSchema = object({
    username: string({
        required_error: 'Имя пользователя обязательно',
    }).max(64, 'Имя пользователя должно быть менее 64 символов'),
    password: string({
        required_error: 'Пароль обязателен',
    }).min(8, 'Пароль должен содержать не менее 8 символов')
        .max(64, 'Пароль должен быть менее 64 символов'),
})

export const signUpSchema = object({
    phone: string({
        required_error: 'Номер телефона обязателен',
    }).length(13, 'Номер телефона должен содержать 13 символов'),
})

export const verifySchema = object({
    code: string({
        required_error: 'Код обязателен',
    }).length(6, 'Код должен содержать 6 символов')
})

export type SignUpInput = TypeOf<typeof signUpSchema>;
export type VerifyInput = TypeOf<typeof verifySchema>;
export type LoginInput = TypeOf<typeof loginSchema>;