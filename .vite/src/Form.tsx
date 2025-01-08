import {
  FormControlLabel,
  Checkbox,
  Grid2,
  FormControl,
  InputLabel,
  MenuItem,
  Select,
} from "@mui/material";
import { colors } from "./App";
import {
  ControlContextType,
  useControl,
  useControlDispatch,
} from "./controlContext";

export default function Form() {
  const { selectedUsers, order, period, top } = useControl();

  const dispatch = useControlDispatch();

  return (
    <Grid2 container p={2} gap={2} justifyContent={"center"}>
      <Grid2
        container
        size={12}
        gap={2}
        flexDirection={"column"}
        textAlign={"center"}
      ></Grid2>
      <Grid2 container flexDirection={"column"}>
        <ColoredCheckbox name="clement" label="Clément" />
        <ColoredCheckbox name="celine" label="Céline" />
        <ColoredCheckbox name="mathieu" label="Mathieu" />
        <ColoredCheckbox name="thomas" label="Thomas" />
      </Grid2>
      <Grid2 container gap={2}>
        <FormControl fullWidth>
          <InputLabel>Order</InputLabel>
          <Select
            value={order}
            label="Order"
            onChange={(e) =>
              dispatch({
                type: "setOrder",
                payload: e.target.value as ControlContextType["order"],
              })
            }
          >
            {Object.entries(selectedUsers)
              .filter(([, value]) => value)
              .map(([key]) => (
                <MenuItem key={key} value={key}>
                  {key[0].toUpperCase() + key.slice(1)}
                </MenuItem>
              ))}
          </Select>
        </FormControl>
        <FormControl fullWidth>
          <InputLabel>Top</InputLabel>
          <Select
            value={top}
            label="Top"
            onChange={(e) =>
              dispatch({
                type: "setTop",
                payload: e.target.value as ControlContextType["top"],
              })
            }
          >
            <MenuItem value={3}>3</MenuItem>
            <MenuItem value={4}>4</MenuItem>
            <MenuItem value={5}>5</MenuItem>
            <MenuItem value={15}>15</MenuItem>
          </Select>
        </FormControl>
        <FormControl fullWidth>
          <InputLabel>Period</InputLabel>
          <Select
            value={period}
            label="Period"
            onChange={(e) =>
              dispatch({
                type: "setPeriod",
                payload: e.target.value as ControlContextType["period"],
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

const ColoredCheckbox = ({
  name,
  label,
}: {
  name: keyof typeof colors;
  label: string;
}) => {
  const { selectedUsers } = useControl();

  const dispatch = useControlDispatch();

  return (
    <FormControlLabel
      control={
        <Checkbox
          value={!!selectedUsers[name]}
          defaultChecked={!!selectedUsers[name]}
          onChange={() => dispatch({ type: "toggleUser", payload: name })}
          sx={{
            color: colors[name],
            "&.Mui-checked": {
              color: colors[name],
            },
          }}
        />
      }
      label={label}
    />
  );
};
