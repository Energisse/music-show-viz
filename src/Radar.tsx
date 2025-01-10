import { Grid2, Typography } from "@mui/material";
import { useEffect, createRef, useMemo, useState } from "react";
import * as d3 from "d3";
import data from "./assets/data.json";
import { colors } from "./App";
import {
  FormBulleRadarContextType,
  useFormBulleRadar,
} from "./FormBulleRadarContext";
import { useSelectedUsers } from "./selectedUsersControl";

export default function Radar() {
  const container = createRef<HTMLDivElement>();

  const [width, setWidth] = useState(0);
  const [height, setHeight] = useState(0);

  const { top: topN, period, order } = useFormBulleRadar();

  const selectedUsersRaw = useSelectedUsers();

  const selectedUsers = useMemo(() => {
    const index = selectedUsersRaw.findIndex((u) => u === order);
    if (index) {
      // Mettre l'utilisateur sélectionné en premier
      return [...selectedUsersRaw.splice(index, 1), ...selectedUsersRaw];
    }
    return selectedUsersRaw;
  }, [selectedUsersRaw, order]);

  const allAxes = useMemo(() => {
    // Fonction pour récupérer les Top N genres d'un utilisateur
    function getTopGenres(
      userData: (typeof data)["users"][number],
      period: FormBulleRadarContextType["period"],
      topN: FormBulleRadarContextType["top"]
    ) {
      // Trouver la période correspondant à "period"
      const selectedPeriod = userData.top_genres.find(
        (p) => p.label === period
      );

      if (selectedPeriod) {
        // Trier les genres par "Listening Time"
        const allGenres = selectedPeriod.ranking.map((genre) => ({
          name: genre.Tags,
          time: genre["Listening Time"],
        }));

        // Trier par temps d'écoute décroissant et ne garder que les top N
        allGenres.sort((a, b) => b.time - a.time);
        return allGenres.slice(0, topN);
      }

      return [];
    }

    const allGenres = new Set();

    // Parcourir chaque utilisateur sélectionné
    selectedUsers.forEach((user) => {
      // Trouver l'utilisateur dans les données
      const userData = data.users.find((u) => u.user_id === user);

      if (userData) {
        // Utiliser la fonction getTopGenres pour récupérer les genres de l'utilisateur pour la période sélectionnée
        const topGenres = getTopGenres(userData, period, topN);

        // Ajouter chaque genre dans le Set (pour éviter les doublons)
        topGenres.forEach((d) => {
          if (d.name) {
            allGenres.add(d.name); // Ajouter le genre unique
          }
        });
      }
    });

    // Retourner les genres sous forme de tableau
    return Array.from(allGenres);
  }, [selectedUsers, period, topN]);

  useEffect(() => {
    const resizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const { width, height } = entry.contentRect;
        setWidth(width);
        setHeight(height);
      }
    });

    resizeObserver.observe(container.current!);
  }, [container]);

  useEffect(() => {
    const margin = 50;

    //clear the chart
    d3.select(container.current).select(".chart").selectAll("*").remove();

    const svg = d3
      .select(container.current)
      .select(".chart")
      .append("svg")
      .attr("width", width)
      .attr("height", height);

    const zoomGroup = svg.append("g").attr("class", "zoom-group");

    const radius = Math.min(width, height) / 2 - margin;
    const centerX = width / 2;
    const centerY = height / 2;

    const scale = d3.scaleLinear().domain([0, 100]).range([0, radius]);

    const tooltip = d3
      .select("body")
      .append("div")
      .style("position", "absolute")
      .style("background", "#fff")
      .style("border", "1px solid #ccc")
      .style("border-radius", "5px")
      .style("padding", "5px")
      .style("font-size", "12px")
      .style("visibility", "hidden");

    // Ajouter des groupes pour organiser les éléments SVG
    const radarGroup = zoomGroup.append("g").attr("class", "radar-group");
    const pointsGroup = zoomGroup.append("g").attr("class", "points-group");

    // Créer un groupe pour les étiquettes des axes en dehors du groupe zoomable
    const axisLabelsGroup = svg.append("g").attr("class", "axis-labels-group");

    // calculer les genres (axes) à afficher
    const angleSlice = (2 * Math.PI) / allAxes.length;

    const gridLevels = 5;
    for (let i = 0; i <= gridLevels; i++) {
      const levelRadius = (radius / gridLevels) * i;

      radarGroup
        .append("circle")
        .attr("cx", centerX)
        .attr("cy", centerY)
        .attr("r", levelRadius)
        .style("fill", "none")
        .style("stroke", "#ccc");

      radarGroup
        .append("text")
        .attr("x", centerX)
        .attr("y", centerY - levelRadius - 5)
        .attr("text-anchor", "middle")
        .attr("font-size", "10px")
        .attr("fill", "#666")
        .text((100 / gridLevels) * i);
    }

    // Ajouter les axes (labels) dynamiquement en fonction des genres
    allAxes.forEach((genre: string, i) => {
      const angle = angleSlice * i + (3 * Math.PI) / 2;
      const x = centerX + Math.cos(angle) * radius;
      const y = centerY + Math.sin(angle) * radius;

      radarGroup
        .append("line")
        .attr("x1", centerX)
        .attr("y1", centerY)
        .attr("x2", x)
        .attr("y2", y)
        .attr("stroke", "#ccc");

      const labelX = centerX + Math.cos(angle) * (radius + 20);
      const labelY = centerY + Math.sin(angle) * (radius + 20);

      axisLabelsGroup
        .append("text")
        .attr("x", labelX)
        .attr("y", labelY)
        .attr("text-anchor", "middle")
        .attr("font-size", "12px")
        .attr("fill", "#666")
        .attr("class", "axis-label")
        .text(genre);
    });

    // Fonction pour dessiner le radar pour chaque utilisateur
    function drawRadar(
      userData: (typeof data)["users"],
      user: keyof typeof colors
    ) {
      const radarLine = d3
        .lineRadial()
        .radius((d) => scale(d.proportion))
        .angle((d, i) => {
          const angleIndex = allAxes.indexOf(d.name);
          return angleSlice * angleIndex;
        });

      const radarArea = radarLine(userData);

      const radarPath = radarGroup
        .append("path")
        .attr("d", radarArea + "Z")
        .attr("transform", `translate(${centerX}, ${centerY})`)
        .attr("class", "radar-area")
        .style("fill", colors[user])
        .style("stroke", colors[user])
        .style("opacity", 0.5);

      radarPath
        .on("mouseover", function () {
          d3.select(this).style("opacity", 0.8).style("stroke-width", "2px");
          tooltip.style("visibility", "visible").html(
            `<div style="display: flex; align-items: center;">
              <div style="width: 10px; height: 10px; background-color: ${colors[user]}; margin-right: 5px; border: 1px solid #000;"></div>
              <strong>${user} </strong><br>
            </div>`
          );
        })
        .on("mousemove", (event) => {
          tooltip
            .style("top", `${event.pageY - 20}px`)
            .style("left", `${event.pageX + 10}px`);
        })
        .on("mouseout", function () {
          d3.select(this).style("opacity", 0.5).style("stroke-width", "1px");
          tooltip.style("visibility", "hidden");
        });

      // S'assurer qu'il y ait un point pour chaque axe, même avec une proportion de 0
      allAxes.forEach((axis, i) => {
        const dataPoint = userData.find((d) => d.name === axis);
        const value = dataPoint ? dataPoint.proportion : 0;
        const temps = dataPoint ? dataPoint.temps : 0;

        const angle = angleSlice * i + (3 * Math.PI) / 2;
        const x = centerX + Math.cos(angle) * scale(value);
        const y = centerY + Math.sin(angle) * scale(value);

        pointsGroup
          .append("circle")
          .attr("cx", x)
          .attr("cy", y)
          .attr("r", function () {
            const zoomScale = d3.zoomTransform(zoomGroup.node()).k; // Obtenir l'échelle actuelle du zoom
            return zoomScale === 1
              ? 4
              : zoomScale > 1 && zoomScale < 1.5
              ? 3
              : zoomScale >= 1.5 && zoomScale < 2.5
              ? 2
              : zoomScale >= 2.5
              ? 1
              : 4; // Valeur par défaut
          })
          .style("fill", colors[user])
          .style("cursor", "pointer")
          .on("mouseover", function () {
            radarPath.raise(); // Déplace la zone radar au-dessus des autres

            tooltip.style("visibility", "visible").html(
              `<div style="display: flex; align-items: center;">
                  <div style="width: 10px; height: 10px; background-color: ${colors[user]}; margin-right: 5px; border: 1px solid #000;"></div>
                  <strong>${user}</strong><br>
                </div>
                <strong>Genre:</strong> ${axis}<br>
                <strong>Proportion:</strong> ${value}%<br>
                <strong>Temps:</strong> ${temps}<br>`
            );

            // Augmenter dynamiquement le rayon
            const currentRadius = parseFloat(d3.select(this).attr("r")); // Récupérer le rayon actuel
            d3.select(this).attr("r", currentRadius + 1); // Ajouter 1 au rayon actuel
          })
          .on("mousemove", (event) => {
            tooltip
              .style("top", `${event.pageY - 20}px`)
              .style("left", `${event.pageX + 10}px`);
          })
          .on("mouseout", function () {
            tooltip.style("visibility", "hidden");
            // Réinitialiser dynamiquement le rayon en fonction du niveau de zoom
            const zoomScale = d3.zoomTransform(zoomGroup.node()).k; // Obtenir l'échelle actuelle du zoom
            const defaultRadius =
              zoomScale === 1
                ? 4
                : zoomScale > 1 && zoomScale < 1.5
                ? 3
                : zoomScale >= 1.5 && zoomScale < 2.5
                ? 2
                : zoomScale >= 2.5
                ? 1
                : 4; // Par défaut

            d3.select(this).attr("r", defaultRadius); // Restaurer le rayon basé sur le zoom
          })
          .on("click", () => {
            // Redirection vers la page HTML correspondante
            //TODO:
            // user
            // axis
            // period
          });
      });
    }

    // Afficher les radars pour les utilisateurs sélectionnés
    selectedUsers.forEach((user) => {
      const userData = data.users.find((u) => u.user_id === user);
      if (!userData) return;
      const userFiltered = allAxes.map((axis) => {
        // Recherche dans les différents "top_genres"
        const match = userData.top_genres.find((genreData) => {
          // On cherche la période correspondant au label sélectionné
          if (genreData.label === period) {
            // Si la période correspond, on parcourt le tableau "ranking" de cette période pour chercher le genre
            return genreData.ranking.some(
              (genre) => genre.Tags.toLowerCase() === axis.toLowerCase()
            );
          }
          return false; // Si la période ne correspond pas, on ne fait pas de match
        });

        if (match) {
          // Calcul du total des temps d'écoute de tous les genres dans cette période
          const totalListeningTime = match.ranking.reduce(
            (total, genre) => total + genre["Listening Time"],
            0
          );

          // Recherche du genre spécifique dans le ranking de cette période
          const genreMatch = match.ranking.find(
            (genre) => genre.Tags.toLowerCase() === axis.toLowerCase()
          );

          // Calcul de la proportion de ce genre par rapport au total
          return {
            name: axis,
            // Calcul de la proportion, arrondi à 1 ou 0 décimale
            proportion: genreMatch
              ? (
                  (genreMatch["Listening Time"] / totalListeningTime) *
                  100
                ).toFixed(
                  genreMatch["Listening Time"] % totalListeningTime === 0
                    ? 0
                    : 1
                )
              : 0,

            // Temps d'écoute formaté en heures et minutes
            temps: genreMatch
              ? genreMatch["Listening Time"] >= 3600
                ? `${Math.floor(
                    genreMatch["Listening Time"] / 3600
                  )}h${Math.floor(
                    (genreMatch["Listening Time"] % 3600) / 60
                  )}min`
                : `${Math.floor(genreMatch["Listening Time"] / 60)}min`
              : "0min", // si null
          };
        } else {
          //valeurs par défaut
          return {
            name: axis,
            proportion: 0,
            temps: "0min",
          };
        }
      });
      drawRadar(userFiltered, user);
    });

    const zoom = d3
      .zoom()
      .scaleExtent([1, 5])
      .translateExtent([
        [width / 4, height / 4],
        [(width * 3) / 4, (height * 3) / 4],
      ])
      .on("zoom", function (event) {
        svgRef
          .current!.selectAll(".zoom-group")
          .attr("transform", event.transform);
        const zoomScale = event.transform.k;
        svg!.selectAll(".points-group circle").attr("r", (d) => {
          if (zoomScale === 1) {
            return 4;
          } else if (zoomScale > 1 && zoomScale < 1.5) {
            return 3;
          } else if (zoomScale >= 1.5 && zoomScale < 2.5) {
            return 2;
          } else if (zoomScale >= 2.5 && zoomScale < 3) {
            return 1;
          } else if (zoomScale >= 3) {
            return 0.5;
          }
          return 4;
        });
      });

    svg.call(zoom);
  }, [selectedUsers, period, topN, container, allAxes]);

  return (
    <Grid2
      container
      height={"100%"}
      flexDirection={"column"}
      textAlign={"center"}
    >
      <Typography variant="h4">Top genres - radar</Typography>

      <Typography>
        Vision radar : Top N genres par période, classés selon l'utilisateur
        principal.
      </Typography>
      <Typography>
        Le radar compare les proportions de temps d'écoute des différents
        utilisateurs sur leur top genre.
      </Typography>
      <Typography>
        Les proportions reflètent le temps d'écoute pour chaque utilisateur par
        rapport au total sur la période donnée.
      </Typography>
      <Grid2 flex={1} ref={container}>
        <div
          className="chart"
          style={{
            position: "absolute",
          }}
        />
      </Grid2>
    </Grid2>
  );
}
