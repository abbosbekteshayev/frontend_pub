import {array, boolean, record, string, TypeOf} from "zod";
import {humanSchema} from "@/schemas/Human.schema.ts";

export const staffSchema = humanSchema.extend({
    permissions: record(string(), boolean()),
    branch_ids: array(string().uuid()).optional(),
})

export type StaffInput = TypeOf<typeof staffSchema>