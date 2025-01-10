import { createContext, Dispatch, useContext, useReducer } from "react";

export type FormBarContextType = {
  visualisation: "day" | "month" | "year";
  period: string;
};

type setPeriodAction = {
  type: "setPeriod";
  payload: FormBarContextType["period"];
};

type setVisualisationAction = {
  type: "setVisualisation";
  payload: FormBarContextType["visualisation"];
};

type Action = setPeriodAction | setVisualisationAction;

const FormBarContext = createContext<FormBarContextType>(
  {} as FormBarContextType
);
const FormBarContextProvider = createContext<Dispatch<Action>>(
  {} as Dispatch<Action>
);

const initialState: FormBarContextType = {
  visualisation: "day",
  period: "",
};

export function FormBarControlProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [context, dispatch] = useReducer(reducer, initialState);

  return (
    <FormBarContext.Provider value={context}>
      <FormBarContextProvider.Provider value={dispatch}>
        {children}
      </FormBarContextProvider.Provider>
    </FormBarContext.Provider>
  );
}

function reducer(state: FormBarContextType, action: Action) {
  switch (action.type) {
    case "setPeriod":
      return {
        ...state,
        period: action.payload,
      };
    case "setVisualisation":
      return {
        ...state,
        visualisation: action.payload,
      };
    default:
      return state;
  }
}

export function useFormBar() {
  return useContext(FormBarContext);
}

export function useFormBarDispatch() {
  return useContext(FormBarContextProvider);
}

export default FormBarContext;
