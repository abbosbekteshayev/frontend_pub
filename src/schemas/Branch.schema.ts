import {object, string, TypeOf} from "zod";

export const branchSchema = object({
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
    })
})

export type BranchInput = TypeOf<typeof branchSchema>