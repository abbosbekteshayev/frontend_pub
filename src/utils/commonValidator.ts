export const validateDate = (date: string) => /^\d{4}-\d{2}-\d{2}$/.test(date);

export const validateTime = (time: string) => /^\d{2}:\d{2}$/.test(time);