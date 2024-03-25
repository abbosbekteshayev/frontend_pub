import {number, object, string, TypeOf} from "zod";

export const permissionsCreateSchema = object({
    label: string({required_error: 'Название обязательно'}),
    permission: string({required_error: 'Право обязательно'}),
    code: number({required_error: 'Код обязателен'}),
    entity: string({required_error: 'Сущность обязательна'}),
})

export const permissionsUpdateSchema = object({
    label: string({required_error: 'Название обязательно'}),
    permission: string({required_error: 'Право обязательно'}),
    code: number({required_error: 'Код обязателен'}),
    entity: string({required_error: 'Сущность обязательна'}),
}).partial()

export type PermissionsCreateInput = TypeOf<typeof permissionsCreateSchema>
export type PermissionsUpdateInput = TypeOf<typeof permissionsUpdateSchema>