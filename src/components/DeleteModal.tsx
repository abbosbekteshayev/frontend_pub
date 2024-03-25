import { toast } from "react-toastify";
import { Button, Modal } from "react-bootstrap";
import { FaTrash, FaX } from "react-icons/fa6";
import { AxiosPromise } from "axios";

type DeleteModalTypes = {
    itemName: string
    mutationFn: (idx: string) => AxiosPromise
    show: boolean
    onHide: () => void
    itemIdx: string
    refetch: () => void
}
const DeleteModal = ({ mutationFn, show, onHide, itemIdx, itemName, refetch }: DeleteModalTypes) => {
    const { mutate, isLoading } = mutationFn({
        idx: itemIdx,
        onSuccess: () => {
            toast.success(`${ itemName } deleted successfully`)
            onHide()
            refetch()
        }
    })
    return (
        <Modal
            show={ show }
            backdrop="static"
            animation
            centered
            onHide={ onHide }
        >
            <Modal.Header closeButton>
                <h3>Delete { itemName }?</h3>
            </Modal.Header>
            <Modal.Body>
                <h5>Are you sure?</h5>
            </Modal.Body>
            <Modal.Footer>
                <Button
                    variant="secondary"
                    className="center gap-2 py-2 px-3"
                    onClick={ onHide }
                    disabled={ isLoading }
                >
                    <FaX/> Close
                </Button>
                <Button
                    variant="danger"
                    className="center gap-2 py-2 px-3"
                    disabled={ isLoading }
                    onClick={ () => mutate(itemIdx) }
                >
                    <FaTrash/> Delete
                </Button>
            </Modal.Footer>
        </Modal>
    );
};

export default DeleteModal;