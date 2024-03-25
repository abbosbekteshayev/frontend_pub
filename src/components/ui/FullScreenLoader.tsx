import {SyncLoader} from "react-spinners";

const FullScreenLoader = () => {
    return (
        <div className="fullscreen-loader animate__animated animate__faster">
            <SyncLoader
                color="#0096DB"
                size={15}
                speedMultiplier={1}
            />
        </div>
    );
};

export default FullScreenLoader;