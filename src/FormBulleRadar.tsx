import {
  Grid2,
  FormControl,
  InputLabel,
  MenuItem,
  Select,
} from "@mui/material";
import {
  FormBulleRadarContextType,
  useFormBulleRadar,
  useFormBulleRadarDispatch,
} from "./FormBulleRadarContext";
import { useSelectedUsers } from "./selectedUsersControl";

export default function FormBulleRadar() {
  const { order, period, top } = useFormBulleRadar();
  const selectedUsers = useSelectedUsers();
  const dispatch = useFormBulleRadarDispatch();

  return (
    <Grid2 container justifyContent={"center"}>
      <Grid2 size={4} p={2}>
        <FormControl fullWidth>
          <InputLabel>Order</InputLabel>
          <Select
            value={order}
            label="Order"
            onChange={(e) =>
              dispatch({
                type: "setOrder",
                payload: e.target.value as FormBulleRadarContextType["order"],
              })
            }
          >
            {selectedUsers.map((val) => (
              <MenuItem key={val} value={val}>
                {val[0].toUpperCase() + val.slice(1)}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      </Grid2>
      <Grid2 size={4} p={2}>
        <FormControl fullWidth>
          <InputLabel>Top</InputLabel>
          <Select
            value={top}
            label="Top"
            onChange={(e) =>
              dispatch({
                type: "setTop",
                payload: e.target.value as FormBulleRadarContextType["top"],
              })
            }
          >
            <MenuItem value={3}>3</MenuItem>
            <MenuItem value={4}>4</MenuItem>
            <MenuItem value={5}>5</MenuItem>
            <MenuItem value={15}>15</MenuItem>
          </Select>
        </FormControl>
      </Grid2>
      <Grid2 size={4} p={2}>
        <FormControl fullWidth>
          <InputLabel>Periode</InputLabel>
          <Select
            value={period}
            label="Periode"
            onChange={(e) =>
              dispatch({
                type: "setPeriod",
                payload: e.target.value as FormBulleRadarContextType["period"],
              })
            }
          >
            <MenuItem value={"4 weeks"}>4 weeks</MenuItem>
            <MenuItem value={"3 months"}>3 months</MenuItem>
            <MenuItem value={"6 months"}>6 mounths</MenuItem>
            <MenuItem value={"1 year"}>1 year</MenuItem>
            <MenuItem value={"all time"}>all time</MenuItem>
          </Select>
        </FormControl>
      </Grid2>
    </Grid2>
  );
}
