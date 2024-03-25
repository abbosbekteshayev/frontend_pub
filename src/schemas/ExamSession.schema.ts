import { any, array, boolean, nativeEnum, number, object, string, TypeOf } from "zod";
import { ExamType } from "@/types/ExamType.ts";

export const examSessionCreateSchema = object({
    name: string({required_error: 'Название обязательно'})
        .min(3, 'Название должно быть не менее 3 символов')
        .max(255, 'Название должно быть не более 255 символов'),
    branch: string().uuid().nullable(),
    examType: nativeEnum(ExamType),
    only_exam_room: boolean(),
    rooms: array(string().uuid()).optional(),
    duration: any().nullish(),
    amountOfQuestions: any().nullish()
})

export const examSessionUpdateSchema = examSessionCreateSchema.partial()

export const examSessionBulkUploadSchema = object({
    groups: array(string().uuid()),
    testBanks: array(string().uuid()),
    date: string().min(10, 'Дата должна быть в формате DD-MM-YYYY').max(10, 'Дата должна быть в формате DD-MM-YYYY'),
    time: string().min(5, 'Время должно быть в формате HH:mm').max(5, 'Время должно быть в формате HH:mm'),
    duration: any().nullish(),
    amountOfQuestions: any(),
    difficulty_level: number().default(1),
})

export type ExamSessionCreateInput = TypeOf<typeof examSessionCreateSchema>;
export type ExamSessionUpdateInput = TypeOf<typeof examSessionUpdateSchema>;