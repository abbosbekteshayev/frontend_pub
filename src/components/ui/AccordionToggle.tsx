import {useAccordionButton} from "react-bootstrap/AccordionButton";
import {FaAngleDown} from "react-icons/fa6";

const AccordionToggle = ({eventKey}: { eventKey: string }) => {
    const decoratedOnClick = useAccordionButton(eventKey);

    return (
        <button
            type="button"
            className="btn"
            onClick={decoratedOnClick}
        >
            <FaAngleDown/>
        </button>
    );
}

export default AccordionToggle