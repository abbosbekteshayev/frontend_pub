import { useCallback, useEffect, useState } from "react";
import { Outlet } from "react-router-dom";
import { useResizeDetector } from "react-resize-detector";
import { Sidebar, SidebarOverlay } from "@/components/layout/Sidebar.tsx";
import Header from "@/components/layout/Header.tsx";
import { RightSidebar } from "@/components/layout/RightSidebar.tsx";
import { useQuery } from "@tanstack/react-query";
import useAxios from "@/hooks/useAxios.ts";
import { Badge, Button, Image } from "react-bootstrap";
import AvatarImage from "@/assets/images/default.jpg";
import HeaderProfileNav from "@/components/layout/HeaderProfileNav.tsx";

enum EDUCATION_TYPE {
    full_time = 'Очное',
    extramural = 'Заочное',
    evening_time = 'Вечернее'
}

const StudentLayout = () => {
    const axios = useAxios();

    // Show status for xs screen
    const [isShowSidebar, setIsShowSidebar] = useState(false);
    const [isShowRightSidebar, setIsShowRightSidebar] = useState(false);

    // Show status for md screen and above
    const [isShowSidebarMd, setIsShowSidebarMd] = useState(true)
    const [isShowRightSidebarMd, setIsShowRightSidebarMd] = useState(true)

    const toggleIsShowSidebar = () => {
        setIsShowSidebar(!isShowSidebar)
    }

    const toggleIsShowSidebarMd = () => {
        const newValue = !isShowSidebarMd
        localStorage.setItem('isShowSidebarMd', newValue ? 'true' : 'false')
        setIsShowSidebarMd(newValue)
    }

    const toggleIsShowRightSidebar = () => {
        if(window.innerWidth > 768) {
            const newValue = !isShowRightSidebarMd
            localStorage.setItem('isShowRightSidebarMd', newValue ? 'true' : 'false')
            setIsShowRightSidebarMd(newValue)
        }
        else {
            setIsShowRightSidebar(!isShowRightSidebar)
        }
    }
    // Clear and reset sidebar
    const resetIsShowSidebar = () => {
        setIsShowSidebar(false);
        setIsShowRightSidebar(false)
    }

    const onResize = useCallback(() => {
        resetIsShowSidebar();
    }, [])

    const { ref } = useResizeDetector({ onResize })

    // On first time load only
    useEffect(() => {
        if (localStorage.getItem('isShowSidebarMd')) {
            setIsShowSidebarMd(localStorage.getItem('isShowSidebarMd') === 'true')
        }
        if (localStorage.getItem('isShowRightSidebarMd')) {
            setIsShowRightSidebarMd(localStorage.getItem('isShowRightSidebarMd') === 'true')
        }
    }, [setIsShowSidebarMd]);

    const { data } = useQuery({
        queryKey: ['student'],
        queryFn: async () => {
            const { data } = await axios.get('/cabinet/students/me');
            return data;
        },
        retry: 3,
        staleTime: 0,
        cacheTime: 0,
        select: ({ data }) => data.student
    });

    return (
        <>
            <div
                ref={ ref }
                className="position-absolute w-100"
            />

            <Sidebar
                isShow={ isShowSidebar }
                isShowMd={ isShowSidebarMd }
            />

            <RightSidebar
                isShow={isShowRightSidebar}
                isShowMd={isShowRightSidebarMd}
            >
                <div className="sidebar-brand d-flex align-items-center justify-content-center shadow">
                    <HeaderProfileNav />
                </div>

                <div className="p-2 d-flex flex-column align-items-center">
                    <Image
                        src={ data?.photo ? `https://cabinet.kiut.uz/${data.photo}` : AvatarImage }
                        roundedCircle
                        width="150px"
                        height="150px"
                        className="mx-auto mb-2 object-fit-cover"
                    />

                    <h5 className="text-center">
                        { `${ data?.last_name } ${ data?.first_name } ${ data?.middle_name }` }
                    </h5>

                    <h4 className="d-flex text-center">
                        <Badge bg="secondary">{ data?.group.faculty.branch.name.ru }</Badge>

                        <Badge bg="secondary" className="ms-2">Студент</Badge>
                    </h4>

                    <h4 className="text-center">
                        <Badge bg="secondary">{ data?.passport_number }</Badge>
                    </h4>

                    <h4 className="text-center">
                        <Badge bg="secondary" className="text-wrap">{ data?.group.name }: {data?.group.faculty.name.ru}</Badge>
                    </h4>

                    <h4 className="d-flex text-center">
                        <Badge bg="secondary">{ data?.group.course }-курс</Badge>

                        <Badge bg="secondary" className="ms-2">{ EDUCATION_TYPE[data?.group.education_type] }</Badge>
                    </h4>

                    {/*<h4 className="text-center">*/}
                    {/*    <Badge bg="secondary">Fails: 5</Badge>*/}
                    {/*</h4>*/}

                    {/*<h4 className="text-center">*/}
                    {/*    <Badge bg="secondary">GPA: 3</Badge>*/}
                    {/*</h4>*/}
                </div>
            </RightSidebar>

            <div className="wrapper student-wrapper d-flex flex-column min-vh-100 bg-light">
                <Header
                    toggleSidebar={ toggleIsShowSidebar }
                    toggleSidebarMd={ toggleIsShowSidebarMd }
                >
                    <Button
                        variant="link"
                        className="p-0 d-flex rounded-circle border"
                    >
                        <Image
                            src={ data?.photo ? `https://cabinet.kiut.uz/${data.photo}` : AvatarImage }
                            roundedCircle
                            width="45px"
                            height="45px"
                            className="object-fit-cover"
                            onClick={ toggleIsShowRightSidebar }
                        />
                    </Button>
                </Header>
                <div className="body flex-grow-1 px-sm-2 mb-4">
                    <Outlet/>
                </div>
            </div>

            <SidebarOverlay
                isShowSidebar={ isShowSidebar || isShowRightSidebar }
                toggleSidebar={ resetIsShowSidebar }
            />
        </>
    )
}

export default StudentLayout;