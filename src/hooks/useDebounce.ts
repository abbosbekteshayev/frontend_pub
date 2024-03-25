import {useState, useEffect} from 'react';

/**
 * Custom hook to debounce a value.
 *
 * @param value - The value to be debounced.
 * @param delay - The number of milliseconds to delay.
 * @returns The debounced value.
 */
export const useDebounce = <T>(value: T, delay: number): T => {
    // State and setters for debounced value
    const [debouncedValue, setDebouncedValue] = useState<T>(value);

    useEffect(() => {
        // Set debouncedValue to value (passed in) after the specified delay
        const handler = setTimeout(() => {
            setDebouncedValue(value);
        }, delay);

        // Return a cleanup function that will be called every time useEffect is re-called.
        // useEffect will only be re-called if value or delay changes (see the inputs array below).
        // This is how we prevent debouncedValue from changing if value is changed within the delay period.
        // Timeout gets cleared and restarted.
        return () => {
            clearTimeout(handler);
        };
    }, [value, delay]); // Only re-call effect if value or delay changes

    return debouncedValue;
};
