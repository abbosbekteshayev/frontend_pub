import {StrictMode} from 'react'
import ReactDOM from 'react-dom/client'
import App from '@/App.tsx'
import {QueryClient, QueryClientProvider} from "@tanstack/react-query";
import {StateContextProvider} from "@/contexts/State.context.tsx";
import {ToastContainer} from "react-toastify";
import {BrowserRouter} from "react-router-dom";
import {AxiosError} from "axios";

// Define the maximum number of retries
const MAX_RETRY_COUNT = 3;

// Custom retry function typed with TypeScript
const retry = (failureCount: number, error: unknown) => {
    // Check if the error is a network error (no response)
    if (!(error as AxiosError).response) {
        // Retry for network errors
        return true;
    }

    // Extract the status code from the error
    const statusCode = (error as AxiosError)?.response?.status;

    // Do not retry for 400 or 500 errors
    if (statusCode && statusCode >= 400 && statusCode <= 502) {
        return false;
    }

    // Retry up to the max retry count for other errors
    return failureCount < MAX_RETRY_COUNT;
};

// QueryClient configuration with TypeScript types
const queryClient = new QueryClient({
    defaultOptions: {
        queries: {
            refetchOnWindowFocus: false,
            refetchOnReconnect: false,
            retry,
            cacheTime: 0,
            staleTime: 0
        },
        mutations: {
            retry
        }
    }
});

ReactDOM.createRoot(document.getElementById('root')!).render(
    <StrictMode>
        <QueryClientProvider client={queryClient}>
            <StateContextProvider>
                <BrowserRouter>
                    <ToastContainer position="bottom-right" autoClose={2000}/>
                    <App/>
                </BrowserRouter>
            </StateContextProvider>
        </QueryClientProvider>
    </StrictMode>,
)
