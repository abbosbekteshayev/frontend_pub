import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import useStateContext from "@/hooks/useStateContext.tsx";
import { toast } from "react-toastify";
import { useEffect } from "react";
import { FaRightToBracket, FaUser } from "react-icons/fa6";
import { useLocation, useNavigate } from "react-router-dom";
import Input from "@/components/ui/Input.tsx";
import { Col, Form, Image, Row, Spinner } from "react-bootstrap";
import logo from '@/assets/images/logo-auth.png'
import { GenericResponse, ILoginResponse } from "@/types";
import { AxiosError } from "axios";
import useRefreshToken from "@/hooks/useRefreshToken.ts";
import { LoginInput, loginSchema } from "@/schemas/Auth.schema.ts";
import { ACTIONS, MESSAGES } from "@/utils/constants.ts";
import { useMutation } from "@tanstack/react-query";
import authAxios from "@/utils/axios.ts";
import InputPassword from "@/components/ui/InputPassword.tsx";

const LoginPage = () => {
    const {state, dispatch} = useStateContext();
    const navigate = useNavigate();
    const location = useLocation();
    const refresh = useRefreshToken();

    const next = location.search.split('?next=')[1] ?? '/'

    useEffect(() => {
        refresh()
    }, []);

    useEffect( () => {
        if (state.access_token) {
            refresh()
                .then(() => {
                    navigate(next);
                })
        }
    }, [state.access_token, navigate, next]);


    const {
        register,
        setFocus,
        setError,
        reset,
        handleSubmit,
        formState: {isSubmitSuccessful, errors},
    } = useForm<LoginInput>({
        resolver: zodResolver(loginSchema),
        defaultValues: {
            username: '',
            password: ''
        }
    });

    const {mutate: login, isLoading} = useMutation({
        mutationFn: async (user: LoginInput) => {
            const response = await authAxios.post<ILoginResponse>('cabinet/auth/login', user);
            return response.data;
        },
        onSuccess: data => {
            dispatch({
                type: ACTIONS.LOGIN,
                payload: data
            })
            navigate(next)
        },
        onError: (error: AxiosError<GenericResponse>) => {
            if (error.response) {
                if (error.response.data.message === MESSAGES.INVALID_CREDENTIALS) {
                    setError('username', {
                        type: 'custom',
                        message: ''
                    })
                    setError('password', {
                        type: 'custom',
                        message: 'Неверное имя пользователя или пароль'
                    })
                    setTimeout(() => {
                        setFocus('username')
                    }, 100)
                    return
                }
                toast.error(error.response.data.message)
            } else {
                toast.error(error.message === 'Network Error' ? 'Ошибка сети' : error.message)
            }
        }
    });

    useEffect(() => {
        setFocus('username');
    }, [setFocus]);

    useEffect(() => {
        if (isSubmitSuccessful) {
            reset();
        }
    }, [isSubmitSuccessful, reset]);

    return (
        <div className="auth-layout min-vh-100 d-flex flex-row align-items-center">
            <div
                className="auth-container animate__animated animate__fast animate__fadeIn bg-white shadow p-4 position-relative">
                <Row className="align-items-center">
                    <Col xs={12} md={6} className="d-none d-md-flex px-5 py-4">
                        <Image src={logo} width={300} fluid/>
                    </Col>
                    <Col xs={12} md={6} className="p-3">
                        <div className="auth-layout-form">
                            <div className="auth-layout-header mb-4">
                                <h3 className="text-danger">KIUT CABINET</h3>
                                <p className="text-muted">
                                    Войдите в свой аккаунт, чтобы продолжить
                                </p>
                            </div>
                            <Form onSubmit={handleSubmit((data) => login(data))}>
                                <Input
                                    label="Username"
                                    id="username"
                                    register={register}
                                    Icon={FaUser}
                                    disabled={isLoading}
                                    placeholder="Имя пользователя"
                                    errors={errors}
                                />

                                <InputPassword
                                    id={'password'}
                                    register={ register }
                                    errors={ errors }
                                    isLoading={ isLoading }
                                />

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
                                                <FaRightToBracket className="me-2"/>
                                                Войти
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

export default LoginPage;