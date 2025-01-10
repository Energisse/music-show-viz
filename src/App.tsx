import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Grid2,
  Paper,
  Typography,
} from "@mui/material";
import { blue, green, orange, purple } from "@mui/material/colors";
import Bulle from "./Bulle";
import { ControlProvider } from "./controlContext";
import Radar from "./Radar";
import Form from "./Form";
import ArrowDropDownIcon from "@mui/icons-material/ArrowDropDown";
import GitHubIcon from "@mui/icons-material/GitHub";

export const colors = {
  clement: orange[800],
  celine: blue[800],
  matthieu: purple[800],
  thomas: green[800],
};

function App() {
  return (
    <>
      <ControlProvider>
        <Grid2 container p={2}>
          <Grid2 size={12} p={2}>
            <Paper>
              <Form />
            </Paper>
          </Grid2>
          <Grid2 container size={12}>
            <Grid2 size={6} p={2}>
              <Paper
                sx={{
                  height: 500,
                }}
              >
                <Radar />
              </Paper>
            </Grid2>
            <Grid2 size={6} p={2}>
              <Paper
                sx={{
                  height: 500,
                }}
              >
                <Bulle />
              </Paper>
            </Grid2>
          </Grid2>
          <Grid2 size={12} p={2}>
            <Paper sx={{ padding: 2 }}>
              <Typography variant="h3" paddingBottom={2}>
                À propos
              </Typography>
              <Accordion>
                <AccordionSummary expandIcon={<ArrowDropDownIcon />}>
                  <Typography variant="h4">Qui a fait quoi ?</Typography>
                </AccordionSummary>
                <AccordionDetails>
                  <Typography>
                    <ul>
                      <li>
                        <span style={{ color: colors.clement }}>Clément</span>:
                        Création des diagrammes de Kiviat et des diagrammes en
                        bulles
                      </li>
                      <li>
                        <span style={{ color: colors.celine }}>Céline</span>:
                        Création des graphiques en barres avec un axe vertical
                      </li>
                      <li>
                        <span style={{ color: colors.matthieu }}>Matthieu</span>
                        : Formatage et traitement des données collectées
                      </li>
                      <li>
                        <span style={{ color: colors.thomas }}>Thomas</span>:
                        Réalisation du site web
                      </li>
                    </ul>
                  </Typography>
                </AccordionDetails>
              </Accordion>
              <Accordion>
                <AccordionSummary expandIcon={<ArrowDropDownIcon />}>
                  <Typography variant="h4">
                    D'où viennent les données ?
                  </Typography>
                </AccordionSummary>
                <AccordionDetails>
                  <Typography>
                    Les données proviennent des différentes plateformes :
                    <ul>
                      <li>
                        <span style={{ color: colors.clement }}>Clément</span>:
                        Deezer
                      </li>
                      <li>
                        <span style={{ color: colors.celine }}>Céline</span>:
                        Spotify
                      </li>
                      <li>
                        <span style={{ color: colors.matthieu }}>Matthieu</span>
                        : Spotify
                      </li>
                      <li>
                        <span style={{ color: colors.thomas }}>Thomas</span>:
                        Youtube musique
                      </li>
                    </ul>
                    La collecte des données a été faite à l'aide du RGPD qui
                    permet de demander à ces plateformes de nous fournir les
                    données qu'elles ont sur nous.
                  </Typography>
                </AccordionDetails>
              </Accordion>
              <Accordion>
                <AccordionSummary expandIcon={<ArrowDropDownIcon />}>
                  <Typography variant="h4">Téchnologies utilisées</Typography>
                </AccordionSummary>
                <AccordionDetails>
                  <Typography>
                    <ul>
                      <li>
                        <a href="https://react.dev/">React</a>
                      </li>
                      <li>
                        <a href="https://mui.com/">Material UI</a>
                      </li>
                      <li>
                        <a href="https://d3js.org/">d3js</a>
                      </li>
                      <li>
                        <a href="https://www.typescriptlang.org/">Typescript</a>
                      </li>
                    </ul>
                  </Typography>
                </AccordionDetails>
              </Accordion>
              <Accordion>
                <AccordionSummary expandIcon={<ArrowDropDownIcon />}>
                  <Typography variant="h4">Code source</Typography>
                </AccordionSummary>
                <AccordionDetails>
                  <Typography>
                    Le code source de ce projet est disponible sur{" "}
                    <a href="https://github.com/Energisse/music-show-viz">
                      GitHub
                      <GitHubIcon
                        sx={{
                          verticalAlign: "top",
                        }}
                      />
                    </a>
                  </Typography>
                </AccordionDetails>
              </Accordion>
              <Accordion>
                <AccordionSummary expandIcon={<ArrowDropDownIcon />}>
                  <Typography variant="h4">Hébergement</Typography>
                </AccordionSummary>
                <AccordionDetails>
                  <Typography>
                    Ce site est hébergé sur{" "}
                    <a href="https://energisse.github.io/music-show-viz/">
                      GitHub Pages
                    </a>
                  </Typography>
                </AccordionDetails>
              </Accordion>
            </Paper>
          </Grid2>
        </Grid2>
      </ControlProvider>
    </>
  );
}

export default App;
