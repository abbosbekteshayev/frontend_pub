import {AxiosError} from "axios";
import {ErrorResponse} from "@/types";
import {toast} from "react-toastify";
import {FieldValues, UseFormSetError} from "react-hook-form";

export function axiosZodErrorHandler(error: AxiosError<ErrorResponse>, setError: UseFormSetError<FieldValues>): void {
    if (Array.isArray(error.response?.data.errors)) {
        error.response?.data.errors.forEach((error) => {
            setError(error.path[error.path.length - 1] as keyof FieldValues, {message: error.message})
        });
    } else {
        toast.error(error.response?.data.message || error.message);
    }
}
