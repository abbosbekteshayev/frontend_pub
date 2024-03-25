// get duration from startat and finishat like HH:MM:SS format
export const getDuration = (startAt: string, finishAt: string) => {
    const startAtDate = new Date(startAt);
    const finishAtDate = new Date(finishAt);
    const duration = finishAtDate.getTime() - startAtDate.getTime();
    const hour = Math.floor(duration / 3600000);
    const minute = Math.floor((duration - (hour * 3600000)) / 60000);
    const second = Math.floor((duration - (hour * 3600000) - (minute * 60000)) / 1000);
    return `${hour > 9 ? hour : `0${hour}`}:${minute > 9 ? minute : `0${minute}`}:${second > 9 ? second : `0${second}`}`;
}
export const getDurationFromMinute = (minute: number) => {
    const hour = Math.floor(minute / 60);
    const minuteLeft = minute % 60;
    return `${hour > 9 ? hour : `0${hour}`}:${minuteLeft > 9 ? minuteLeft : `0${minuteLeft}`}:00`;
}

export const getDatetime = (date: string) => {
    const dateObj = new Date(date);
    const day = dateObj.getDate();
    const month = dateObj.getMonth() + 1;
    const year = dateObj.getFullYear();
    const hour = dateObj.getHours();
    const minute = dateObj.getMinutes();
    return `${day < 10 ? `0${day}` : day}.${
        month < 10 ? `0${month}` : month}.${year} ${hour < 10 ? `0${hour}` : hour
    }:${minute < 10 ? `0${minute}` : minute}`;
}