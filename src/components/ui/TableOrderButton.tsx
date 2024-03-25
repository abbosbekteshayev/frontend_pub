import {FaSortDown, FaSortUp} from "react-icons/fa6";
import {Order} from "@/types/enums.ts";

type TableOrderButtonProps = {
    label: string
    field: string
    onClick: () => void
    order: Order
    sortBy: string
}

const TableOrderButton = ({label, order, sortBy, field, onClick}: TableOrderButtonProps) => {
    return (
        <div className="d-flex align-items-center justify-content-between">
            <span>{label}</span>
            <button
                className="btn btn-link d-flex flex-column p-0"
                onClick={onClick}
            >
                <FaSortUp className={`
                    ${sortBy === field && order === Order.ASC ? 'text-gray-600' : 'text-gray-400'}
                `} style={{marginBottom: "-7px"}}/>
                <FaSortDown
                    className={`
                        ${sortBy === field && order === Order.DESC ? 'text-gray-600' : 'text-gray-400'}
                    `}
                    style={{marginTop: "-7px"}}/>
            </button>
        </div>
    );
};

export default TableOrderButton;