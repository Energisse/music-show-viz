import { Grid2, Chip } from "@mui/material";
import {
  useSelectedUsers,
  useSelectedUsersDispatch,
} from "./selectedUsersControl";
import * as data from "./assets/data.json";
import { blue, green, orange, purple } from "@mui/material/colors";

const users = data.users.map((user) => ({
  name: user.user_id,
  label: user.username,
}));

export const colors = {
  [data.users[0].user_id]: blue[800],
  [data.users[1].user_id]: orange[800],
  [data.users[2].user_id]: green[800],
  [data.users[3].user_id]: purple[800],
};

export default function UserSelector() {
  const selectedUsers = useSelectedUsers();

  const dispatch = useSelectedUsersDispatch();

  return (
    <Grid2
      container
      flexDirection={"row"}
      gap={2}
      p={2}
      justifyContent={"center"}
    >
      {users.map(({ name, label }) => (
        <Chip
          key={name}
          label={label}
          variant="outlined"
          sx={{
            cursor: "pointer",
            borderColor: colors[name],
            ...(selectedUsers.includes(name)
              ? {
                  backgroundColor: colors[name],
                  color: "white",
                }
              : {
                  color: colors[name],
                }),
          }}
          clickable={false} // Remove style when clickable
          onClick={() =>
            dispatch({
              type: "toggleUser",
              payload: name,
            })
          }
        />
      ))}
    </Grid2>
  );
}
