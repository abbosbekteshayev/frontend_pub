import {useForm} from "react-hook-form";
import useStateContext from "@/hooks/useStateContext.tsx";
import {useCallback, useEffect, useState} from "react";
import {FaLock, FaPhone, FaRightFromBracket} from "react-icons/fa6";
import {useNavigate} from "react-router-dom";
import Input from "@/components/ui/Input.tsx";
import {Button, Col, Form, Image, Row, Spinner} from "react-bootstrap";
import logo from '@/assets/images/logo-auth.png'
import {ErrorResponse} from "@/types";
import {AxiosError} from "axios";
import useAxios from "@/hooks/useAxios.ts";
import {SignUpInput, VerifyInput} from "@/schemas/Auth.schema.ts";
import {useMutation, useQueryClient} from "@tanstack/react-query";
import {ACTIONS, MESSAGES} from "@/utils/constants.ts";
import CircleTimer from "@/components/ui/CircleTimer.tsx";
import {useTimer} from "@/hooks/useTimer.tsx";
import {logoutUserFn} from "@/api/Auth.api.ts";

const SignUpPage = () => {
    const [timer, setTimer] = useState<number>(0);
    const [codeInput, setCodeInput] = useState<boolean>(false);
    const [isCodeInputDisabled, setIsCodeInputDisabled] = useState<boolean>(false);

    const {state, dispatch} = useStateContext();
    const navigate = useNavigate()
    const axios = useAxios()

    const queryClient = useQueryClient()

    const {isRunning, time, runCountDown} = useTimer();

    useEffect(() => {
        if (!state.access_token || !state.authUser) {
            navigate('/auth/login');
        } else if (state.authUser && state.authUser.verified) {
            navigate('/');
        }
    }, [state.access_token, state.authUser, navigate]);

    useEffect(() => {
        if (isRunning && time === 0) {
            setIsCodeInputDisabled(true);
        }
    }, [isRunning, time]);

    const {
        register,
        setFocus,
        setValue,
        getValues,
        setError,
        handleSubmit,
        formState: {errors},
    } = useForm<SignUpInput>({
        // resolver: zodResolver(signUpSchema),
        defaultValues: {
            phone: ''
        }
    });

    const {mutate: verify, isLoading: isVerifyLoading} = useMutation({
        mutationFn: async ({code}: VerifyInput) => {
            const response = await axios.patch('cabinet/auth/verify', {code});
            return response.data;
        },
        onSuccess: () => {
            queryClient.refetchQueries(['me']).then(() => {
                navigate('/')
            })
        },
        onError: (error: AxiosError<ErrorResponse>) => {
            if (Array.isArray(error.response?.data.errors)) {
                error.response?.data.errors.forEach((error) => {
                    setError(error.path[error.path.length - 1] as keyof SignUpInput, {message: error.message})
                });
            } else {
                setError('code', {message: error.response?.data.message})
            }
        }
    })

    const {mutate: signUp, isLoading} = useMutation({
        mutationFn: async (input: SignUpInput) => {
            const response = await axios.post('cabinet/auth/verify', input);
            return response.data;
        },
        onSuccess: data => {
            setValue('code', '');
            setTimer(data.data.expires);
            setCodeInput(true);
            runCountDown(data.data.expires);
        },
        onError: (error: AxiosError<ErrorResponse>) => {
            if (Array.isArray(error.response?.data.errors)) {
                error.response?.data.errors.forEach((error) => {
                    setError(error.path[error.path.length - 1] as keyof SignUpInput, {message: error.message})
                });
            } else {
                switch (error.response?.data.message) {
                    case 'ALREADY_EXIST':
                        setError('phone', {message: MESSAGES.ALREADY_EXIST})
                        break;
                    case 'ATTEMPT_LIMIT':
                        setError('phone', {message: MESSAGES.ATTEMPT_LIMIT})
                        break;
                    default:
                        setError('phone', {message: error.response?.data.message})
                }
            }
        }
    });

    const resendVerificationCode = useCallback(() => {
        signUp({phone: getValues('phone').replace(/\s/g, '')});
        setIsCodeInputDisabled(false);
    }, [getValues, signUp])

    const onSubmit = (input: { phone: string, code: string }) => {
        if (codeInput) {
            verify({code: input.code})
        } else {
            signUp({phone: input.phone.replace(/\s/g, '')})
        }
    }

    const logout = useCallback(async () => {
        dispatch({
            type: ACTIONS.LOGOUT
        });
        await logoutUserFn()
    }, [dispatch])

    useEffect(() => {
        setFocus('phone');
    }, [setFocus]);

    return (
        <div className="auth-layout min-vh-100 d-flex flex-row align-items-center">
            <div
                className="auth-container animate__animated animate__fast animate__fadeIn bg-white shadow p-4 position-relative">
                <Row>
                    <Col xs={12} md={6} className="d-none d-md-flex px-5 py-4">
                        <Image src={logo} width={300} fluid/>
                    </Col>
                    <Col xs={12} md={6} className="p-3">
                        <Button variant="outline-danger" className="btn-icon gap-2 ms-auto mb-5" onClick={logout}>
                            <FaRightFromBracket/>
                            Выйти
                        </Button>
                        <div className="auth-layout-form">
                            <div className="auth-layout-header mb-5">
                                <h3 className="text-danger">KIUT CABINET</h3>
                                <p className="text-muted">
                                    Чтобы активировать свой аккаунт, введите номер телефона.
                                </p>
                            </div>
                            <Form onSubmit={handleSubmit(onSubmit)}>
                                <Input
                                    label="Номер телефона"
                                    id="phone"
                                    register={register}
                                    Icon={FaPhone}
                                    disabled={isLoading || codeInput}
                                    placeholder="Номер телефона"
                                    errors={errors}
                                />
                                <p className="text-muted">Пример: +998123456789</p>

                                {codeInput && (
                                    <>
                                        <div className="position-relative">
                                            <Input
                                                label="Код подтверждения"
                                                id="code"
                                                register={register}
                                                className="mb-0"
                                                Icon={FaLock}
                                                disabled={isLoading || isVerifyLoading || isCodeInputDisabled}
                                                placeholder="Код подтверждения"
                                                errors={errors}
                                            />
                                            {timer > 0 && (
                                                <div className="position-absolute top-0 end-0 mt-1 me-1">
                                                    <CircleTimer
                                                        duration={timer}
                                                        isRunning={isRunning}
                                                        time={time}
                                                    />
                                                </div>
                                            )}
                                        </div>
                                        <p className="text-muted small">
                                            Введите код подтверждения без девиз(тере), который был отправлен на номер
                                            телефона. Пример: 123456
                                        </p>
                                        {
                                            time === 0 &&
                                            <p>
                                                <span className="text-muted">Не получили код?</span>
                                                <Button variant="link" className="text-danger ms-2 p-0"
                                                        onClick={resendVerificationCode}>
                                                    Отправить заново
                                                </Button>
                                            </p>
                                        }
                                    </>
                                )}

                                <div className="d-grid">
                                    <button className="btn btn-primary text-white" type="submit"
                                            disabled={isLoading}>
                                        {isLoading ? (
                                            <>
                                                <Spinner animation="border" variant="white" size="sm" className="me-2"/>
                                                Загрузка...
                                            </>
                                        ) : (
                                            <>
                                                {codeInput ? 'Подтвердить' : 'Продолжить'}
                                            </>
                                        )}
                                    </button>
                                </div>
                            </Form>
                        </div>
                    </Col>
                </Row>
            </div>
        </div>
    );
};

export default SignUpPage;