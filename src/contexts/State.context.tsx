import React, {Reducer} from 'react';
import {IUser} from '@/types';
import {ACTIONS} from "@/utils/constants.ts";

type State = {
    authUser: IUser | null;
    access_token: string;
    breadcrumbs: Array<{ label: string; path: string }>;
};

type Action = {
    type: string;
    payload?: unknown;
};

type Dispatch = (action: Action) => void;

const initialState: State = {
    authUser: null,
    access_token: '',
    breadcrumbs: [],
};

type StateContextProviderProps = { children: React.ReactNode };

const StateContext = React.createContext<
    { state: State; dispatch: Dispatch } | undefined
>(undefined);

const stateReducer = (state: State, action: Action) => {
    switch (action.type) {
        case ACTIONS.SET_ACCESS_TOKEN: {
            return {
                ...state,
                access_token: action.payload as string,
            }
        }
        case ACTIONS.SET_USER: {
            return {
                ...state,
                authUser: action.payload as IUser,
            };
        }
        case ACTIONS.LOGIN: {
            return {
                ...state,
                ...action.payload,
            };
        }
        case ACTIONS.SET_BREADCRUMBS: {
            return {
                ...state,
                breadcrumbs: action.payload as Array<{ label: string; path: string }>,
            }
        }
        case ACTIONS.LOGOUT: {
            return {
                ...initialState,
            }
        }
        default: {
            throw new Error(`Unhandled action type`);
        }
    }
};

const StateContextProvider = ({children}: StateContextProviderProps) => {
    const [state, dispatch] = React.useReducer<Reducer<State, Action>>(stateReducer, initialState);
    return (
        <StateContext.Provider value={{state, dispatch}}>{children}</StateContext.Provider>
    );
};

export {StateContextProvider, StateContext};
