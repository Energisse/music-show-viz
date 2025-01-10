import { createContext, Dispatch, useContext, useReducer } from "react";
import { UsersType } from "./selectedUsersControl";

export type FormBulleRadarContextType = {
  period: "4 weeks" | "3 months" | "6 months" | "1 year" | "all time";
  top: number;
  order: UsersType;
};

type setPeriodAction = {
  type: "setPeriod";
  payload: FormBulleRadarContextType["period"];
};

type setTopAction = {
  type: "setTop";
  payload: number;
};

type setOrderAction = {
  type: "setOrder";
  payload: FormBulleRadarContextType["order"];
};

type Action = setPeriodAction | setTopAction | setOrderAction;

const FormBulleRadarContext = createContext<FormBulleRadarContextType>(
  {} as FormBulleRadarContextType
);
const FormBulleRadarContextProvider = createContext<Dispatch<Action>>(
  {} as Dispatch<Action>
);

const initialState: FormBulleRadarContextType = {
  period: "4 weeks",
  top: 3,
  order: "clement",
};

export function FormBulleRadarControlProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [context, dispatch] = useReducer(reducer, initialState);

  return (
    <FormBulleRadarContext.Provider value={context}>
      <FormBulleRadarContextProvider.Provider value={dispatch}>
        {children}
      </FormBulleRadarContextProvider.Provider>
    </FormBulleRadarContext.Provider>
  );
}

function reducer(state: FormBulleRadarContextType, action: Action) {
  switch (action.type) {
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

export function useFormBulleRadar() {
  return useContext(FormBulleRadarContext);
}

export function useFormBulleRadarDispatch() {
  return useContext(FormBulleRadarContextProvider);
}

export default FormBulleRadarContext;
