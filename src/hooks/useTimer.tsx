import { useCallback, useEffect, useState } from "react";

export const useTimer = (initialTime = 0) => {
    const [time, setTime] = useState(initialTime);
    const [isRunning, setIsRunning] = useState(false);

    const runCountDown = useCallback((time?: number) => {
        if(time) setTime(time);
        setIsRunning(true);
    }, []);

    const restart = useCallback(() => {
        setTime(initialTime);
    }, [initialTime]);

    const clear = useCallback(() => {
        setIsRunning(false);
        setTime(initialTime);
    }, [initialTime]);

    useEffect(() => {
        let intervalId: any;

        if (isRunning) {
            intervalId = setInterval(() => {
                setTime((prevTime) => Math.max(prevTime - 1, 0));
            }, 1000);
        }

        return () => {
            clearInterval(intervalId);
        };
    }, [isRunning]);

    return {
        time,
        isRunning,
        runCountDown,
        restart,
        clear,
    };
};