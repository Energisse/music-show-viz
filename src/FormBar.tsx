import {
  Grid2,
  FormControl,
  InputLabel,
  MenuItem,
  Select,
} from "@mui/material";
import {
  FormBarContextType,
  useFormBar,
  useFormBarDispatch,
} from "./FormBarContext";
import * as data from "./assets/data2.json";
import { useEffect } from "react";
export default function FormBar() {
  const { period, visualisation } = useFormBar();

  const dispatch = useFormBarDispatch();

  useEffect(() => {
    if (visualisation === "month" && period === "") {
      dispatch({
        type: "setPeriod",
        payload: data.dataYear[0].period,
      });
    }
  }, [dispatch, period, visualisation]);

  return (
    <Grid2 container justifyContent={"center"}>
      <Grid2 size={4} p={2}>
        <FormControl fullWidth>
          <InputLabel>Visualisation</InputLabel>
          <Select
            value={visualisation}
            label="Visualisation"
            onChange={(e) =>
              dispatch({
                type: "setVisualisation",
                payload: e.target.value as FormBarContextType["visualisation"],
              })
            }
          >
            <MenuItem value="day">jour</MenuItem>
            <MenuItem value="month">mois</MenuItem>
            <MenuItem value="year">année</MenuItem>
          </Select>
        </FormControl>
      </Grid2>
      <Grid2 size={4} p={2}>
        <FormControl
          fullWidth
          sx={{
            visibility: visualisation === "month" ? "visible" : "hidden",
          }}
        >
          <InputLabel>Periode</InputLabel>
          <Select
            value={period}
            label="Periode"
            onChange={(e) =>
              dispatch({
                type: "setPeriod",
                payload: e.target.value as FormBarContextType["period"],
              })
            }
          >
            {[...new Set(data.dataYear.map((d) => d.period))].map((val) => (
              <MenuItem key={val} value={val}>
                {val}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      </Grid2>
    </Grid2>
  );
}
