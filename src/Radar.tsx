import { Grid2, Typography } from "@mui/material";
import { useEffect, createRef, useMemo, useState } from "react";
import * as d3 from "d3";
import data from "./assets/data.json";
import { colors } from "./UserSelector";
import { useFormBulleRadar } from "./FormBulleRadarContext";
import { useSelectedUsers } from "./selectedUsersControl";
import { formatListenTime } from "./utils";

export type RadarProps = {
  zoomed?: boolean;
};

export default function Radar({ zoomed }: RadarProps) {
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
    const result = selectedUsers
      .map((user) => data.users.find((u) => u.user_id === user))
      .filter(Boolean)
      .flatMap((userData) => {
        // Utiliser la fonction getTopGenres pour récupérer les genres de l'utilisateur pour la période sélectionnée
        // Trouver la période correspondant à "period"
        const selectedPeriod =
          userData!.top_genres.find((p) => p.label === period)?.ranking || [];

        const topGenres = selectedPeriod
          .flatMap((genre) => ({
            name: genre.Tags,
            time: genre["Listening Time"],
          }))
          .sort((a, b) => b.time - a.time)
          .slice(0, topN)
          .map((genre) => genre.name)
          .filter(Boolean);

        return topGenres;
      });

    // Retourner les genres sous forme de tableau
    return Array.from(new Set(result));
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

    const pointSize = (zoom) => Math.max(1, Math.min(5 - zoom, 4));

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

    const tooltip = d3.select("#tooltip");

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
    function drawRadar({ user_id, username, data: userData }) {
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
        .style("fill", colors[user_id])
        .style("stroke", colors[user_id])
        .style("opacity", 0.5);

      radarPath
        .on("mouseover", function () {
          d3.select(this).style("opacity", 0.8).style("stroke-width", "2px");
          tooltip.style("visibility", "visible").html(
            `<div style="display: flex; align-items: center;">
              <div style="width: 10px; height: 10px; background-color: ${colors[user_id]}; margin-right: 5px; border: 1px solid #000;"></div>
              <strong>${username} </strong><br>
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

          .style("fill", colors[user_id])
          .style("cursor", "pointer")
          .on("mouseover", function () {
            radarPath.raise(); // Déplace la zone radar au-dessus des autres

            tooltip.style("visibility", "visible").html(
              `<div style="display: flex; align-items: center;">
                  <div style="width: 10px; height: 10px; background-color: ${colors[user_id]}; margin-right: 5px; border: 1px solid #000;"></div>
                  <strong>${username}</strong><br>
                </div>
                <strong>Genre:</strong> ${axis}<br>
                <strong>Proportion:</strong> ${value}%<br>
                <strong>Temps:</strong> ${temps}`
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
            d3.select(this).attr(
              "r",
              pointSize(d3.zoomTransform(zoomGroup.node()).k)
            );
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
            temps: formatListenTime(genreMatch["Listening Time"]),
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
      drawRadar({
        user_id: userData.user_id,
        username: userData.username,
        data: userFiltered,
      });
    });

    const zoom = d3
      .zoom()
      .scaleExtent([1, 10])
      .translateExtent([
        [width / 4, height / 4],
        [(width * 3) / 4, (height * 3) / 4],
      ])
      .on("zoom", function (event) {
        svg.selectAll(".zoom-group").attr("transform", event.transform);
        svg
          .selectAll(".points-group circle")
          .attr("r", pointSize(event.transform.k));
      });
    svg.call(zoom);
    const newTransform = d3.zoomIdentity.translate(-width, -height).scale(3);
    svg.transition().duration(750).call(zoom.transform, newTransform);
  }, [selectedUsers, period, topN, container, allAxes, width, height]);

  return (
    <Grid2
      container
      height={"100%"}
      flexDirection={"column"}
      textAlign={"center"}
    >
      <Typography variant="h4">Top {topN} genres</Typography>
      {zoomed && (
        <>
          <Typography>
            Vision radar : Top N genres par période, classés selon l'utilisateur
            principal.
          </Typography>
          <Typography>
            Le radar compare les proportions de temps d'écoute des différents
            utilisateurs sur leur top genre.
          </Typography>
          <Typography>
            Les proportions reflètent le temps d'écoute pour chaque utilisateur
            par rapport au total sur la période donnée.
          </Typography>
        </>
      )}

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
