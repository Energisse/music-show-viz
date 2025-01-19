import { createContext, Dispatch, useContext, useReducer } from "react";
import * as data from "./assets/data.json";

export type SelectedUserContextType = Record<
  (typeof data.users)[number]["user_id"],
  boolean
>;

type toggleUserAction = {
  type: "toggleUser";
  payload: string;
};

type Action = toggleUserAction;

const selectedUserContext = createContext<SelectedUserContextType>(
  {} as SelectedUserContextType
);

const selectedUserProvider = createContext<Dispatch<Action>>(
  {} as Dispatch<Action>
);

const initialState: SelectedUserContextType = {
  ...data.users.reduce((acc, { user_id }) => ({ ...acc, [user_id]: true }), {}),
  thomas: false, //FIXME: Remove this line when the data is fixed
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
