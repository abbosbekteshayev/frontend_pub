import {array, nativeEnum, object, string, TypeOf} from "zod";

export enum UserRole {
    ADMIN = 'admin',
    STAFF = 'staff',
    TEACHER = 'teacher',
    STUDENT = 'student'
}

export const UserRoles = {
    [UserRole.STAFF]: 'Сотрудник',
    [UserRole.ADMIN]: 'Администратор',
    [UserRole.TEACHER]: 'Преподаватель',
    [UserRole.STUDENT]: 'Студент',
}

export const userSchema = object({
    identifier: string().min(3).max(128),
    first_name: string().min(3).max(128),
    last_name: string().min(3).max(128),
    middle_name: string().min(3).max(128),
    email: string().email().min(3).max(128),
    passport_number: string().min(3).max(128),
    pinfl: string().length(14),
    role: array(nativeEnum(UserRole)),
    password: string().min(6).max(128),
    confirm_password: string().min(6).max(128),
    permissions: array(string().min(3).max(7))
})

export type UserInput = TypeOf<typeof userSchema>;