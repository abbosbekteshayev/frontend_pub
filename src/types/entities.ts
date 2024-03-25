export type Branch = {
    id: string;
    name: {
        en: string;
        ru: string;
        uz: string;
    }
}

export type Faculty = {
    id: string;
    name: {
        en: string;
        ru: string;
        uz: string;
    }
    branch: Branch;
    suffix: string;
    max_course: number;
}

export type Group = {
    id: string;
    name: string;
    faculty: Faculty;
    // finish
}

export type Room = {
    id: string;
    name: string;
    capacity: number;
    is_exam_room: boolean;
    timetable_id: string;
    branch: Branch;
}

export type Computer = {
    id: string;
    ip: string;
    room: Room;
}

export type Human = {
    id: string;
    identifier: string;
    first_name: string;
    last_name: string;
    middle_name: string;
    email: string | null;
    phone: string | null;
    pinfl: string | null;
    passport_number: string;
    birthDate: Date | null;
    gender: string | null;
    photo: string | null;
}

export type Staff = {
    permissions: number[]
} & Human