import {string, TypeOf} from "zod";
import {humanSchema} from "@/schemas/Human.schema.ts";

export const teacherSchema = humanSchema.extend({
    timetable_id: string().optional(),
})

export type TeacherInput = TypeOf<typeof teacherSchema>