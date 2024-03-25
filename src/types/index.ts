import {UserRole} from "@/schemas/Users.schema.ts";
import { ReactNode } from "react";

export type Staff = {
    permissions: number[];
}
export type Teacher = {
    timetable_id: string | null;
}
export type Student = {

}

export interface IUser {
    id: string;
    username: string;
    first_name: string;
    last_name: string;
    middle_name: string;
    phone: string;
    roles: UserRole[];
    staff?: Staff | undefined;
    teacher?: Teacher | undefined;
    student?: Student | undefined;
    photo: string;
    verified: boolean;
}

export interface GenericResponse {
    status: string;
    message: string;
}

export type APIZodError = {
    code: string;
    minimum: number;
    type: string;
    message: string;
    path: (string | number)[];
}

export interface ErrorResponse {
    status: "fail";
    message?: string;
    errors?: APIZodError[];
}

export interface ILoginResponse {
    access_token: string;
}

export interface IUserResponse {
    status: string;
    data: {
        user: IUser;
    };
}

export interface ISessionExaminee {
    identifier: string;
    full_name: string;
    subject: string;
    date: string;
    time: string;
}

export type DataTableHeadersType<T> = {
    key: string
    label: string
    render?: (object: T) => ReactNode | string
    searchable?: () => ReactNode
    sortable?: () => ReactNode
    style?: { [key: string]: string | number }
    className?: string
}

export interface ResponseWithData<T> {
    status: string;
    data: T;
}