import { Grid2, Paper, Typography } from "@mui/material";
import Bar from "./Bar";
import { useSelectedUsers } from "./selectedUsersControl";
import { useMemo } from "react";
import data from "./assets/data.json";

export default function BarGroupe() {
  const selectedUsers = useSelectedUsers();

  const title = useMemo(() => {
    const selectedUsersCopy = [...selectedUsers].map(
      (user) => data.users.find(({ user_id }) => user === user_id)?.username
    );
    let titre = "";
    if (selectedUsers.length === 1) {
      titre = "Analyse du temps d'écoute en minutes de ";
    } else {
      titre = "Comparaison du temps d'écoute en minutes de ";
    }
    titre += [
      selectedUsersCopy.splice(0, selectedUsersCopy.length - 1).join(", "),
      selectedUsersCopy.at(-1),
    ].join(" et ");

    return titre;
  }, [selectedUsers]);

  return (
    <Grid2 container spacing={2} size={12} justifyContent={"center"}>
      <Typography variant="h4" paddingBottom={2} textAlign={"center"}>
        {title}
      </Typography>
      <Grid2 size={12} p={2} component={Paper}>
        <Bar visualisation="day" />
      </Grid2>
      <Grid2 size={12} p={2} component={Paper}>
        <Bar visualisation="month" />
      </Grid2>
      <Grid2 size={12} p={2} component={Paper}>
        <Bar visualisation="year" />
      </Grid2>
    </Grid2>
  );
}
