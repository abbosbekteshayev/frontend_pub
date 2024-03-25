import {ClipLoader} from "react-spinners";

const FullScreenLoader = () => {
    return (
        <div className="d-flex align-items-center justify-content-center">
            <div className="animate__animated animate__faster animate__fadeIn">
                <ClipLoader
                    color="#0096DB"
                />
            </div>
        </div>
    );
};

export default FullScreenLoader;