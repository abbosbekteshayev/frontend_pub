import { Breadcrumb as BSBreadcrumb } from 'react-bootstrap'
import useStateContext from "@/hooks/useStateContext.tsx";

const Breadcrumb = () => {
    const { state: { breadcrumbs } } = useStateContext()
    return (
        <BSBreadcrumb listProps={ { className: 'mb-0 align-items-center' } }>
            { breadcrumbs.map((breadcrumb, index, array) => (
                index === array.length - 1 ? (
                    <BSBreadcrumb.Item
                        active
                        key={ index }
                    >
                        <b>{ breadcrumb.label }</b>
                    </BSBreadcrumb.Item>
                ) : (
                    <BSBreadcrumb.Item
                        key={ index }
                        linkProps={ { className: 'text-decoration-none' } }
                        href={ breadcrumb.path }
                    >
                        { breadcrumb.label }
                    </BSBreadcrumb.Item>
                )
            ))
            }
        </BSBreadcrumb>
    )
}
export default Breadcrumb;