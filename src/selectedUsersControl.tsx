import { createContext, Dispatch, useContext, useReducer } from "react";

export const Users = ["thomas", "matthieu", "clement", "celine"] as const;

export type UsersType = (typeof Users)[number];

export type SelectedUserContextType = {
  thomas: boolean;
  matthieu: boolean;
  clement: boolean;
  celine: boolean;
};

type toggleUserAction = {
  type: "toggleUser";
  payload: UsersType;
};

type Action = toggleUserAction;

const selectedUserContext = createContext<SelectedUserContextType>(
  {} as SelectedUserContextType
);

const selectedUserProvider = createContext<Dispatch<Action>>(
  {} as Dispatch<Action>
);

const initialState: SelectedUserContextType = {
  thomas: true,
  matthieu: true,
  clement: true,
  celine: true,
};

export function SelectedUserProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [context, dispatch] = useReducer(reducer, initialState);

  return (
    <selectedUserContext.Provider value={context}>
      <selectedUserProvider.Provider value={dispatch}>
        {children}
      </selectedUserProvider.Provider>
    </selectedUserContext.Provider>
  );
}

function reducer(state: SelectedUserContextType, action: Action) {
  switch (action.type) {
    case "toggleUser":
      return {
        ...state,
        [action.payload]: !state[action.payload],
      };
    default:
      return state;
  }
}

export function useSelectedUsers() {
  return Object.entries(useContext(selectedUserContext))
    .filter(([, value]) => value)
    .map(([key]) => key);
}

export function useSelectedUsersDispatch() {
  return useContext(selectedUserProvider);
}

export default SelectedUserProvider;
