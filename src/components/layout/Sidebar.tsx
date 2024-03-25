import { useEffect, useMemo, useState } from 'react'
import classNames from 'classnames'
import {Button, Image} from 'react-bootstrap'
import SidebarNav from '@/components/layout/SidebarNav.tsx'
import {
    FaAngleLeft,
    FaFileImport,
    FaGauge,
    FaLandmark,
    FaPaperclip,
    FaPeopleGroup,
    FaTableList, FaUserGear, FaUserGroup, FaUsers, FaUserTie, FaBrain, FaCalendarDays, FaCalendar
} from "react-icons/fa6";
import logo from "@/assets/images/white-logo.png";
import logoNarrow from "@/assets/images/white-logo-narrow.png";
import useStateContext from "@/hooks/useStateContext.tsx";
import { UserRole } from "@/schemas/Users.schema.ts";
import { FaDesktop, FaDoorClosed, FaExternalLinkAlt } from "react-icons/fa";
import useCheckPermission from "@/hooks/useCheckPermission.tsx";

export const Sidebar = ({isShow, isShowMd}: { isShow: boolean; isShowMd: boolean }) => {
    const {state: {authUser}} = useStateContext();
    const checkPermission = useCheckPermission();

    const [isNarrow, setIsNarrow] = useState(false);

    const toggleIsNarrow = () => {
        const newValue = !isNarrow
        localStorage.setItem('isNarrow', newValue ? 'true' : 'false')
        setIsNarrow(newValue)
    }

    // On first time load only
    useEffect(() => {
        if (localStorage.getItem('isNarrow')) {
            setIsNarrow(localStorage.getItem('isNarrow') === 'true')
        }
    }, [setIsNarrow])

    const navItems = useMemo(() => {
        if(!authUser) return [];

        return [
            {
                title: 'Панель управления',
                icon: FaGauge,
                href: '/',
                show: authUser.roles.includes(UserRole.ADMIN)
            },
            {
                title: 'Университет',
                icon: FaGauge,
                show: authUser?.roles.includes(UserRole.STAFF) || authUser?.roles.includes(UserRole.ADMIN)
            },
            {
                title: 'Филиалы',
                icon: FaLandmark,
                href: '/branches',
                show: checkPermission(102)
            },
            {
                title: 'Факультеты',
                icon: FaPaperclip,
                href: '/faculties',
                show: checkPermission(202)
            },
            {
                title: 'Группы',
                icon: FaPeopleGroup,
                href: '/groups',
                show: checkPermission(302)
            },
            {
                title: 'Аудитории',
                icon: FaDoorClosed,
                href: '/rooms',
                show: checkPermission(1202)
            },
            {
                title: 'Компьютеры',
                icon: FaDesktop,
                show: checkPermission(1102),
                children: [
                    {
                        title: 'Все компьютеры',
                        icon: FaTableList,
                        href: '/computers',
                        show: checkPermission(1102)
                    },
                    {
                        title: 'Импорт',
                        icon: FaFileImport,
                        href: '/computers/import',
                        show: checkPermission(1101)
                    }
                ]
            },
            {
                title: 'Сотрудники',
                icon: FaUserTie,
                show: checkPermission(602),
                children: [
                    {
                        title: 'Все сотрудники',
                        icon: FaUsers,
                        href: '/staff',
                        show: checkPermission(602)
                    },
                    {
                        title: 'Права доступа',
                        icon: FaUserGear,
                        href: '/staff/permissions',
                        show: checkPermission(1301)
                    },
                    {
                        title: 'Импорт',
                        icon: FaFileImport,
                        href: '/staff/import',
                        show: checkPermission(601)
                    }
                ]
            },
            {
                title: 'Преподаватели',
                icon: FaUserTie,
                show: checkPermission(502),
                children: [
                    {
                        title: 'Все преподаватели',
                        icon: FaUsers,
                        href: '/teachers',
                        show: checkPermission(502)
                    },
                    {
                        title: 'Импорт',
                        icon: FaFileImport,
                        href: '/teachers/import',
                        show: checkPermission(501)
                    }
                ]
            },
            {
                title: 'Студенты',
                icon: FaUserGroup,
                show: checkPermission(402),
                children: [
                    {
                        title: 'Все студенты',
                        icon: FaUsers,
                        href: '/students',
                        show: checkPermission(402)
                    },
                    {
                        title: 'Импорт студентов',
                        icon: FaFileImport,
                        href: '/students/import',
                        show: checkPermission(401)
                    },
                    {
                        title: 'Импорт результатов',
                        icon: FaFileImport,
                        href: '/students/import-results',
                        show: checkPermission(401)
                    }
                ]
            },
            {
                title: 'Платформа тестирования',
                icon: FaBrain,
                show: checkPermission(802),
            },
            {
                title: 'Тест-банк',
                icon: FaBrain,
                show: checkPermission(802),
                children: [
                    {
                        title: 'Все тесты',
                        icon: FaTableList,
                        href: '/test-bank',
                        show: checkPermission(802)
                    },
                    {
                        title: 'Загрузить',
                        icon: FaFileImport,
                        href: '/test-bank/upload',
                        show: checkPermission(803)
                    }
                ]
            },
            {
                title: 'Экзаменационные сессии',
                icon: FaCalendarDays,
                show: checkPermission(902),
                children: [
                    {
                        title: 'Все сессии',
                        icon: FaTableList,
                        href: '/exam-sessions',
                        show: checkPermission(902)
                    },
                    {
                        title: 'Создать сессию',
                        icon: FaFileImport,
                        href: '/exam-sessions/create',
                        show: checkPermission(901)
                    }
                ]
            },
            {
                title: 'Расписание экзаменов',
                icon: FaCalendar,
                show: checkPermission(902),
                children: [
                    {
                        title: 'Импорт',
                        icon: FaFileImport,
                        href: '/exam-schedule',
                        show: checkPermission(901)
                    }
                ]
            },
            {
                title: 'Кабинет',
                show: authUser?.roles.includes(UserRole.ADMIN)
            },
            {
                title: 'Пользователи',
                icon: FaUserGroup,
                show: checkPermission(702),
                children: [
                    {
                        title: 'Все пользователи',
                        icon: FaUsers,
                        href: '/users',
                        show: checkPermission(702)
                    }
                ]
            },

            // Student
            {
                title: 'Тренажёр',
                icon: FaBrain,
                show: authUser?.roles.includes(UserRole.STUDENT),
                children: [
                    {
                        title: 'Список тренажёров',
                        href: '/',
                        show: authUser?.roles.includes(UserRole.STUDENT),
                    },
                    {
                        title: 'Результаты',
                        href: '/trainer/results',
                        show: authUser?.roles.includes(UserRole.STUDENT),
                    }
                ]
            },
            // {
            //     title: 'Результаты',
            //     icon: FaCheckSquare,
            //     href: '/results',
            //     show: authUser?.roles.includes(UserRole.STUDENT),
            // },
            // {
            //     title: 'Fails',
            //     icon: FaHistory,
            //     href: '/fails',
            //     show: authUser?.roles.includes(UserRole.STUDENT),
            // },
            // {
            //     title: 'Расписание',
            //     icon: FaHistory,
            //     href: '/exam-schedule',
            //     show: authUser?.roles.includes(UserRole.STUDENT),
            // },
            // {
            //     title: 'Расписание',
            //     icon: FaCalendar,
            //     href: '/exam-schedule',
            //     show: authUser?.roles.includes(UserRole.STUDENT),
            // },
            {
                title: 'Быстрые ссылки',
                icon: FaExternalLinkAlt,
                show: authUser?.roles.includes(UserRole.STUDENT),
                children: [
                    {
                        title: 'Расписания',
                        href: 'https://contract.kiut.uz',
                        show: authUser?.roles.includes(UserRole.STUDENT),
                    },
                    {
                        title: 'Intranet',
                        href: 'https://intranet.kiut.uz',
                        show: authUser?.roles.includes(UserRole.STUDENT),
                    },
                    {
                        title: 'Intranet (заочное обучение)',
                        href: 'https://pt.kiut.uz',
                        show: authUser?.roles.includes(UserRole.STUDENT),
                    },
                    {
                        title: 'Библиотека',
                        href: 'https://intranet.kiut.uz',
                        show: authUser?.roles.includes(UserRole.STUDENT),
                    },
                    {
                        title: 'Восстановление ID карты',
                        href: 'https://id.kiut.uz',
                        show: authUser?.roles.includes(UserRole.STUDENT),
                    },
                    {
                        title: 'Получить договор',
                        href: 'https://contract.kiut.uz',
                        show: authUser?.roles.includes(UserRole.STUDENT),
                    },
                    {
                        title: 'Посещаемость',
                        href: 'https://attendance.kiut.uz',
                        show: authUser?.roles.includes(UserRole.STUDENT),
                    },
                    {
                        title: 'Контакты',
                        href: '/contacts',
                        show: authUser?.roles.includes(UserRole.STUDENT),
                    },
                ]
            },
        ]
    }, [authUser, checkPermission])

    return (
        <div
            className={classNames('sidebar d-flex flex-column position-fixed h-100 shadow', {
                'sidebar-narrow': isNarrow,
                show: isShow,
                'md-hide': !isShowMd,
            })}
        >
            <div className="sidebar-brand d-none d-md-flex align-items-center justify-content-center shadow">
                <Image src={logo} className="sidebar-brand-full" alt="KIUT Transfer" height={54}/>
                <Image src={logoNarrow} className="sidebar-brand-narrow d-none" alt="KIUT Transfer" height={54}/>
            </div>

            <div className="sidebar-nav flex-fill">
                <SidebarNav items={navItems}/>
            </div>

            <Button
                variant="link"
                className="sidebar-toggler d-none d-md-inline-block rounded-0 text-end pe-4 fw-bold shadow-none"
                onClick={toggleIsNarrow}
                type="button"
                aria-label="sidebar toggler"
            >
                <FaAngleLeft className="sidebar-toggler-chevron" size={24}/>
            </Button>
        </div>
    )
}

export const SidebarOverlay = (props: { isShowSidebar: boolean; toggleSidebar: () => void }) => {
    const {isShowSidebar, toggleSidebar} = props

    return (
        <div
            tabIndex={-1}
            aria-hidden
            className={classNames('sidebar-overlay position-fixed top-0 bg-dark w-100 h-100 opacity-50', {
                'd-none': !isShowSidebar,
            })}
            onClick={toggleSidebar}
        />
    )
}
