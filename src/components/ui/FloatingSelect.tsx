import React from 'react';
import classNames from "classnames";
import { FloatingLabel, Form } from "react-bootstrap";
import { FieldErrors, UseFormRegister, FieldValues } from "react-hook-form";

type FloatingSelectProps = {
    register: UseFormRegister<FieldValues>;
    watch: (name: string) => unknown;
    id: string;
    label: string;
    labelKey?: string;
    valueKey?: string;
    options: { label: string, value: string | number, selected?: boolean }[] | undefined;
    defaultValue: string | number;
    errors: FieldErrors;
    disabled?: boolean;
    placeholder?: string;
    valueAsNumber?: boolean;
    required?: boolean;
    onChange?: (event: React.ChangeEvent<HTMLSelectElement>) => void;
} & React.DetailedHTMLProps<React.InputHTMLAttributes<HTMLInputElement>, HTMLInputElement>;

const FloatingSelect = ({
    register,
    watch,
    id,
    errors,
    label,
    labelKey,
    valueKey,
    defaultValue,
    disabled,
    placeholder = "",
    options,
    valueAsNumber = false,
    required = true,
    onChange = () => {},
}: FloatingSelectProps) => {
    const error = errors[id] || null;

    return (
        <FloatingLabel
            label={ label }
            className={ classNames("mb-3", {
                "is-invalid": error,
                "is-valid": !error && watch(id),
            }) }
        >
            <Form.Select
                className={ classNames({
                    "is-invalid": error,
                    "is-valid": !error && watch(id),
                }) }
                disabled={ disabled }
                { ...register(id, { required, valueAsNumber }) }
                placeholder={ placeholder }
                required={ required }
                defaultValue={ defaultValue }
                onChange={ (e) => onChange(e) }
            >
                <option value=""></option>
                { options?.length && options?.map((option, index) => (
                    <option
                        key={ index }
                        value={ valueKey ? option[valueKey] : option.value }
                        selected={ option.selected }
                    >
                        { labelKey ? option[labelKey] : option.label }
                    </option>
                )) }
            </Form.Select>
            { error && (
                <Form.Control.Feedback type="invalid">{ error[id]?.message }</Form.Control.Feedback>
            ) }
        </FloatingLabel>
    );
};

export default FloatingSelect;
