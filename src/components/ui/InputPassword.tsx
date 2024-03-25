import { useState } from "react";
import { FaEye, FaEyeSlash, FaLock } from "react-icons/fa6";
import Input from "@/components/ui/Input.tsx";
import { FieldErrors, FieldValues } from "react-hook-form";

type InputPasswordProps = {
    register: FieldValues;
    errors: FieldErrors;
    isLoading: boolean;
    id: string;
}

const InputPassword = (props: InputPasswordProps) => {
    const { register, errors, isLoading, id } = props;
    const [show, setShow] = useState(false);
    const toggle = (e) => {
        e.preventDefault();
        setShow(!show)
    };

    return (
        <div className="input-password">
            <Input
                label="Password"
                id={id}
                register={register}
                Icon={FaLock}
                disabled={isLoading}
                placeholder="Пароль"
                errors={errors}
                type={show ? "text" : "password"}
                append={(
                    <button
                        className="btn"
                        onClick={toggle}
                    >
                        {show ? <FaEyeSlash/> : <FaEye/>}
                    </button>
                )}
            />
        </div>
    );
}

export default InputPassword;