import {object, string, TypeOf} from "zod";

export const computerSchema = object({
    ip: string({
        required_error: "IP обязателен"
    }),
    room: string({
        required_error: "Аудитория обязателен"
    }).uuid({message: "Выберите аудиторию"}),
})

export type ComputerInput = TypeOf<typeof computerSchema>