import {useContext} from "react";
import {StateContext} from "@/contexts/State.context.tsx";

const useStateContext = () => {
    const context = useContext(StateContext);

    if (context) {
        return context;
    }

    throw new Error(`useStateContext must be used within a StateContextProvider`);
};

export default useStateContext;