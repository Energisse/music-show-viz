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
import * as data from "./assets/data.json";
import { useEffect, useMemo } from "react";
export default function FormBar() {
  const { period, visualisation } = useFormBar();

  const dispatch = useFormBarDispatch();

  const periodList = useMemo(() => {
    if (visualisation === "day") return [];
    if (visualisation === "year")
      return [
        ...new Set(
          data.users.flatMap((d) =>
            d.average_listening_time.dataYear.map((d) => d.period.split("-")[0])
          )
        ),
      ];
    return [
      ...new Set(
        data.users.flatMap((d) =>
          d.average_listening_time.dataMonth.map((d) =>
            d.period.split("-").splice(0, 2).join("-")
          )
        )
      ),
    ];
  }, [visualisation]);

  useEffect(() => {
    if (visualisation === "day") return;
    dispatch({
      type: "setPeriod",
      payload: periodList[0],
    });
  }, [dispatch, periodList, visualisation]);

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
            visibility: visualisation === "day" ? "hidden" : "visible",
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
            {periodList.map((val) => (
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
