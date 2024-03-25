import {boolean, number, object, string, TypeOf} from "zod";

export const roomSchema = object({
    name: string({
        required_error: "Название обязательно"
    }),
    capacity: number({required_error: 'Вместимость обязательна'}),
    is_exam_room: boolean().optional(),
    branch: string({
        required_error: "Филиал обязателен"
    }).uuid({message: "Филиал должен быть валидным UUID"}),
    timetable_id: string().optional(),
})

export type RoomInput = TypeOf<typeof roomSchema>