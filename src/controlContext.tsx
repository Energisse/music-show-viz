import { createContext, Dispatch, useContext, useReducer } from "react";

export type ControlContextType = {
  selectedUsers: {
    thomas: boolean;
    mathieu: boolean;
    clement: boolean;
    celine: boolean;
  };
  period: "4 weeks" | "3 months" | "6 months" | "1 year" | "all time";
  top: number;
  order: "clement" | "celine" | "mathieu" | "thomas";
};

type toggleUserAction = {
  type: "toggleUser";
  payload: keyof ControlContextType["selectedUsers"];
};

type setPeriodAction = {
  type: "setPeriod";
  payload: ControlContextType["period"];
};

type setTopAction = {
  type: "setTop";
  payload: number;
};

type setOrderAction = {
  type: "setOrder";
  payload: ControlContextType["order"];
};

type Action =
  | toggleUserAction
  | setPeriodAction
  | setTopAction
  | setOrderAction;

const controlContext = createContext<ControlContextType>(
  {} as ControlContextType
);
const controlContextProvider = createContext<Dispatch<Action>>(
  {} as Dispatch<Action>
);

const initialState: ControlContextType = {
  selectedUsers: {
    thomas: true,
    mathieu: true,
    clement: true,
    celine: true,
  },
  period: "4 weeks",
  top: 3,
  order: "clement",
};

export function ControlProvider({ children }: { children: React.ReactNode }) {
  const [context, dispatch] = useReducer(reducer, initialState);

  return (
    <controlContext.Provider value={context}>
      <controlContextProvider.Provider value={dispatch}>
        {children}
      </controlContextProvider.Provider>
    </controlContext.Provider>
  );
}

function reducer(state: ControlContextType, action: Action) {
  switch (action.type) {
    case "toggleUser":
      return {
        ...state,
        selectedUsers: {
          ...state.selectedUsers,
          [action.payload]: !state.selectedUsers[action.payload],
        },
      };
    case "setPeriod":
      return {
        ...state,
        period: action.payload,
      };
    case "setTop":
      return {
        ...state,
        top: action.payload,
      };
    case "setOrder":
      return {
        ...state,
        order: action.payload,
      };
    default:
      return state;
  }
}

export function useControl() {
  return useContext(controlContext);
}

export function useControlDispatch() {
  return useContext(controlContextProvider);
}

export default controlContext;
