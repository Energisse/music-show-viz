import { Grid2, Paper } from "@mui/material";
import { blue, green, orange, purple } from "@mui/material/colors";
import Bulle from "./Bulle";
import { ControlProvider } from "./controlContext";
import Radar from "./Radar";
import Form from "./Form";

export const colors = {
  clement: orange[800],
  celine: blue[800],
  mathieu: purple[800],
  thomas: green[800],
};

function App() {
  return (
    <>
      <ControlProvider>
        <Grid2 container p={2} gap={2}>
          <Grid2 size={12}>
            <Paper>
              <Form />
            </Paper>
          </Grid2>
          <Grid2 container gap={2} flexWrap={"nowrap"} size={12}>
            <Grid2 size={6}>
              <Paper
                sx={{
                  height: 500,
                }}
              >
                <Radar />
              </Paper>
            </Grid2>
            <Grid2 size={6}>
              <Paper
                sx={{
                  height: 500,
                }}
              >
                <Bulle />
              </Paper>
            </Grid2>
          </Grid2>
        </Grid2>
      </ControlProvider>
    </>
  );
}

export default App;
