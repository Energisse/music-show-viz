import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Box,
  Grid2,
  IconButton,
  Paper,
  Tooltip,
  Typography,
} from "@mui/material";
import Bulle from "./Bulle";
import { FormBulleRadarControlProvider } from "./FormBulleRadarContext";
import Radar from "./Radar";
import FormBulleRadar from "./FormBulleRadar";
import ArrowDropDownIcon from "@mui/icons-material/ArrowDropDown";
import GitHubIcon from "@mui/icons-material/GitHub";
import Bar from "./Bar";
import UserSelector, { colors } from "./UserSelector";
import FormBar from "./FormBar";
import { FormBarControlProvider } from "./FormBarContext";
import Camenbert from "./Camenbert";
import ZoomInMapIcon from "@mui/icons-material/ZoomInMap";
import ZoomOutMapIcon from "@mui/icons-material/ZoomOutMap";
import { useState } from "react";

function App() {
  return (
    <>
      <Grid2 container p={2} spacing={2}>
        <Grid2 size={12} component={Paper} elevation={2}>
          <UserSelector />
        </Grid2>
        <Grid2
          container
          size={12}
          p={2}
          component={Paper}
          elevation={2}
          spacing={2}
        >
          <FormBulleRadarControlProvider>
            <Grid2 size={12} component={Paper} elevation={2}>
              <FormBulleRadar />
            </Grid2>
            <ZoomableGrid items={[<Radar />, <Bulle />, <Camenbert />]} />
          </FormBulleRadarControlProvider>
        </Grid2>

        <Grid2
          container
          size={12}
          p={2}
          spacing={2}
          component={Paper}
          elevation={2}
        >
          <FormBarControlProvider>
            <Grid2 size={12} component={Paper} elevation={2}>
              <FormBar />
            </Grid2>
            <Grid2 size={12} p={2} component={Paper} elevation={2} height={500}>
              <Bar />
            </Grid2>
          </FormBarControlProvider>
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
                <ul>
                  <li>
                    <Typography>
                      <span style={{ color: colors.clement }}>Clément</span>:
                      Création des diagrammes de Kiviat et des diagrammes en
                      bulles
                    </Typography>
                  </li>
                  <li>
                    <Typography>
                      <span style={{ color: colors.celine }}>Céline</span>:
                      Création des graphiques en barres avec un axe vertical
                    </Typography>
                  </li>
                  <li>
                    <Typography>
                      <span style={{ color: colors.matthieu }}>Matthieu</span>:
                      Formatage et traitement des données collectées
                    </Typography>
                  </li>
                  <li>
                    <Typography>
                      <span style={{ color: colors.thomas }}>Thomas</span>:
                    </Typography>
                    <ul>
                      <li>
                        <Typography>
                          Création des graphiques en camembert
                        </Typography>
                      </li>
                      <li>
                        <Typography>Création du site</Typography>
                      </li>
                      <li>
                        <Typography>Correction des graphiques</Typography>
                      </li>
                    </ul>
                  </li>
                </ul>
              </AccordionDetails>
            </Accordion>
            <Accordion>
              <AccordionSummary expandIcon={<ArrowDropDownIcon />}>
                <Typography variant="h4">
                  D'où viennent les données ?
                </Typography>
              </AccordionSummary>
              <AccordionDetails>
                Les données proviennent des différentes plateformes :
                <ul>
                  <li>
                    <Typography>
                      <span style={{ color: colors.clement }}>Clément</span>:
                      Deezer
                    </Typography>
                  </li>
                  <li>
                    <Typography>
                      <span style={{ color: colors.celine }}>Céline</span>:
                      Spotify
                    </Typography>
                  </li>
                  <li>
                    <Typography>
                      <span style={{ color: colors.matthieu }}>Matthieu</span>:
                      Spotify
                    </Typography>
                  </li>
                  <li>
                    <Typography>
                      <span style={{ color: colors.thomas }}>Thomas</span>:
                      Youtube musique
                    </Typography>
                  </li>
                </ul>
                <Typography>
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
                <ul>
                  <li>
                    <Typography>
                      <a href="https://react.dev/">React</a>
                    </Typography>
                  </li>
                  <li>
                    <Typography>
                      <a href="https://mui.com/">Material UI</a>
                    </Typography>
                  </li>
                  <li>
                    <Typography>
                      <a href="https://d3js.org/">d3js</a>
                    </Typography>
                  </li>
                  <li>
                    <Typography>
                      <a href="https://www.typescriptlang.org/">Typescript</a>
                    </Typography>
                  </li>
                </ul>
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
    </>
  );
}

export default App;

type ZoomableGridProps = {
  items: React.ReactNode[];
};

function ZoomableGrid({ items }: ZoomableGridProps) {
  const [zoom, setZoom] = useState<number | null>(null);

  return (
    <Grid2 container size={12} component={Paper} elevation={2} spacing={2}>
      {items.map((item, index) =>
        zoom !== null && index !== zoom ? null : (
          <Grid2
            key={index}
            size={zoom === index ? 12 : 12 / items.length}
            p={2}
            component={Paper}
            elevation={2}
            height={zoom === index ? 1000 : 500}
          >
            <Box
              sx={{
                position: "relative",
              }}
            >
              <IconButton
                onClick={() => setZoom(zoom === index ? null : index)}
                sx={{
                  position: "absolute",
                  right: 0,
                  top: 0,
                }}
                size="large"
              >
                {zoom === index ? (
                  <Tooltip title="Dézoomer">
                    <ZoomOutMapIcon
                      sx={{
                        fontSize: "2rem",
                      }}
                    />
                  </Tooltip>
                ) : (
                  <Tooltip title="Zoomer">
                    <ZoomInMapIcon
                      sx={{
                        fontSize: "2rem",
                      }}
                    />
                  </Tooltip>
                )}
              </IconButton>
            </Box>
            {item}
          </Grid2>
        )
      )}
    </Grid2>
  );
}
