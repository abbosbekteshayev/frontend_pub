import classNames from "classnames";

export const RightSidebar = ({children, isShow, isShowMd}) => {
    return (
        <div className={classNames('sidebar right-sidebar position-fixed h-100 end-0 top-0 d-flex flex-column shadow', {
            show: isShow,
            'md-hide': !isShowMd,
        })}>
            {children}
        </div>
    )
}