import { string, TypeOf } from "zod";
import {humanSchema} from "@/schemas/Human.schema.ts";

export const studentSchema = humanSchema.extend({
    group: string({
        required_error: "Группа обязательна"
    }).uuid({message: "Выберите группу"})
})

export type StudentInput = TypeOf<typeof studentSchema>