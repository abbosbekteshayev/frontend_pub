import { Outlet } from "react-router-dom";
import { useCallback, useEffect, useState } from "react";
import { useResizeDetector } from "react-resize-detector";
import { Sidebar, SidebarOverlay } from "@/components/layout/Sidebar.tsx";
import Header from "@/components/layout/Header.tsx";
import HeaderProfileNav from "@/components/layout/HeaderProfileNav.tsx";

const AdminLayout = () => {
    // Show status for xs screen
    const [isShowSidebar, setIsShowSidebar] = useState(false)

    // Show status for md screen and above
    const [isShowSidebarMd, setIsShowSidebarMd] = useState(true)

    const toggleIsShowSidebar = () => {
        setIsShowSidebar(!isShowSidebar)
    }

    const toggleIsShowSidebarMd = () => {
        const newValue = !isShowSidebarMd
        localStorage.setItem('isShowSidebarMd', newValue ? 'true' : 'false')
        setIsShowSidebarMd(newValue)
    }

    // Clear and reset sidebar
    const resetIsShowSidebar = () => {
        setIsShowSidebar(false)
    }

    const onResize = useCallback(() => {
        resetIsShowSidebar()
    }, [])

    const { ref } = useResizeDetector({ onResize })

    // On first time load only
    useEffect(() => {
        if (localStorage.getItem('isShowSidebarMd')) {
            setIsShowSidebarMd(localStorage.getItem('isShowSidebarMd') === 'true')
        }
    }, [setIsShowSidebarMd])

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

            <div className="wrapper d-flex flex-column min-vh-100 bg-light">
                <Header
                    toggleSidebar={ toggleIsShowSidebar }
                    toggleSidebarMd={ toggleIsShowSidebarMd }
                >
                    <HeaderProfileNav/>
                </Header>
                <div className="body flex-grow-1 px-sm-2 mb-4">
                    <Outlet/>
                </div>
            </div>

            <SidebarOverlay
                isShowSidebar={ isShowSidebar }
                toggleSidebar={ toggleIsShowSidebar }
            />
        </>
    )
};

export default AdminLayout;