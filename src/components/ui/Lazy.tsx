import {ComponentType, lazy, Suspense} from "react";
import SuspenseLoader from "@/components/ui/SuspenseLoader.tsx";

export const Lazy = ({component}: { component: () => Promise<{ default: ComponentType<unknown>; }> }) => {
    const LazyComponent = lazy(component);
    return (
        <Suspense fallback={<SuspenseLoader/>}>
            <LazyComponent/>
        </Suspense>
    );
}