import { Grid2, Chip, Typography } from "@mui/material";
import { colors } from "./App";
import {
  UsersType,
  useSelectedUsers,
  useSelectedUsersDispatch,
} from "./selectedUsersControl";

const users = [
  { name: "clement", label: "Clément" },
  { name: "celine", label: "Céline" },
  { name: "matthieu", label: "Matthieu" },
  { name: "thomas", label: "Thomas" },
] satisfies {
  name: UsersType;
  label: string;
}[];

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
      <Grid2 size={12} textAlign={"center"}>
        <Typography variant="h6">Utilisateurs :</Typography>
      </Grid2>
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
