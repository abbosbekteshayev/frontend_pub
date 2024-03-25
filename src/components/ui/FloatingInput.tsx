import React from 'react';
import classNames from "classnames";
import {FloatingLabel, Form} from "react-bootstrap";
import {
    FieldErrors,
    FieldValues,
    UseFormRegister,
    UseFormWatch,
    UseFormStateProps
} from "react-hook-form";

type FloatingInputProps = {
    register: UseFormRegister<FieldValues>;
    watch: UseFormWatch<FieldValues>;
    id: string;
    label: string;
    errors: UseFormStateProps<FieldErrors>;
    type?: string;
    disabled?: boolean;
    placeholder?: string;
    readonly?: boolean;
    maxLength?: number;
    required?: boolean;
} & React.DetailedHTMLProps<React.InputHTMLAttributes<HTMLInputElement>, HTMLInputElement>;

const FloatingInput = ({
                           register,
                           watch,
                           id,
                           errors,
                           label,
                           placeholder = "",
                           disabled = false,
                           readonly = false,
                           maxLength = 128,
                           type = "text",
                           required = true
                       }: FloatingInputProps) => {
    const error = errors[id] || null;
    return (
        <FloatingLabel
            label={label}
            className={classNames("mb-3", {
                "is-invalid": error,
                "is-valid": !error && watch(id),
            })}
        >
            <Form.Control
                type={type}
                className={classNames({
                    "is-invalid": error,
                    "is-valid": !error && watch(id),
                })}
                maxLength={maxLength}
                readOnly={readonly}
                placeholder={placeholder}
                disabled={disabled}
                {...register(id, {
                    valueAsDate: type === "date",
                    valueAsNumber: type === "number",
                })}
                required={required}
            />
            {error && (
                <Form.Control.Feedback type="invalid">{error.message}</Form.Control.Feedback>
            )}
        </FloatingLabel>
    );
};

export default FloatingInput;
