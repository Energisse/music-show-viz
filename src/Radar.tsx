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

  const [allAxes, userData] = useMemo(() => {
    const axes = Array.from(
      new Set(
        selectedUsers
          .map((user) => data.users.find((u) => u.user_id === user))
          .flatMap((userData) => {
            // Utiliser la fonction getTopGenres pour récupérer les genres de l'utilisateur pour la période sélectionnée
            // Trouver la période correspondant à "period"
            const selectedPeriod =
              userData!.top_genres.find((p) => p.label === period)?.ranking ||
              [];

            return selectedPeriod
              .flatMap((genre) => ({
                name: genre.Tags,
                time: genre["Listening Time"],
              }))
              .sort((a, b) => b.time - a.time)
              .slice(0, topN)
              .map((genre) => genre.name);
          })
      )
    );

    const userData = selectedUsers.map((user) => {
      const userData = data.users.find((u) => u.user_id === user)!;

      const selectedPeriod = userData.top_genres
        .find((p) => p.label === period)
        ?.ranking.filter((g) => axes.includes(g.Tags))
        .sort((a, b) => axes.indexOf(a.Tags) - axes.indexOf(b.Tags));

      const total = d3.sum(
        userData.top_genres.find((p) => p.label === period)?.ranking || [],
        (d) => d["Listening Time"]
      );

      return {
        user_id: userData.user_id,
        username: userData.username,
        genres: axes.map((name) => {
          const genre = selectedPeriod?.find((g) => g.Tags === name);
          return {
            name,
            proportion: ((genre?.["Listening Time"] || 0) / total) * 100,
            time: genre?.["Listening Time"] || 0,
            formatedTime: formatListenTime(genre?.["Listening Time"] || 0),
          };
        }),
      };
    });

    return [axes, userData];
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

    const pointSize = (zoom: number) => Math.max(1, Math.min(5 - zoom, 4));

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

    radarGroup
      .selectAll("circle")
      .data(Array.from({ length: gridLevels + 1 }))
      .join("circle")
      .attr("cx", centerX)
      .attr("cy", centerY)
      .attr("r", (_, i) => (radius / gridLevels) * i)
      .style("fill", "none")
      .style("stroke", "#ccc");

    radarGroup
      .selectAll("text")
      .data(Array.from({ length: gridLevels + 1 }))
      .join("text")
      .attr("x", centerX)
      .attr("y", (_, i) => centerY - (radius / gridLevels) * i - 5)
      .attr("text-anchor", "middle")
      .attr("font-size", "10px")
      .attr("fill", "#666")
      .text((_, i) => (100 / gridLevels) * i);

    // // Ajouter les axes (labels) dynamiquement en fonction des genres

    radarGroup
      .selectAll("line")
      .data(allAxes)
      .join("line")
      .attr("x1", centerX)
      .attr("y1", centerY)
      .attr(
        "x2",
        (d, i) =>
          centerX + Math.cos(angleSlice * i + (3 * Math.PI) / 2) * radius
      )
      .attr(
        "y2",
        (d, i) =>
          centerY + Math.sin(angleSlice * i + (3 * Math.PI) / 2) * radius
      )
      .attr("stroke", "#ccc");

    axisLabelsGroup
      .selectAll("text")
      .data(allAxes)
      .join("text")
      .attr(
        "x",
        (_, i) =>
          centerX + Math.cos(angleSlice * i + (3 * Math.PI) / 2) * (radius + 20)
      )
      .attr(
        "y",
        (_, i) =>
          centerY + Math.sin(angleSlice * i + (3 * Math.PI) / 2) * (radius + 20)
      )
      .attr("text-anchor", "middle")
      .attr("font-size", "12px")
      .attr("fill", "#666")
      .attr("class", "axis-label")
      .text((genre) => genre);

    const radarUsersPath = radarGroup
      .selectAll("g")
      .data(userData)
      .join("g")
      .attr("data-user", ({ user_id }) => user_id);

    const radar = d3
      .lineRadial<{
        name: string;
        proportion: number;
      }>()
      .radius(({ proportion }) => scale(proportion))
      .angle(({ name }) => allAxes.indexOf(name) * angleSlice);

    radarUsersPath
      .selectAll("path")
      .data(({ genres, user_id, username }) => [
        {
          user_id,
          username,
          path: radar(genres) + "Z",
        },
      ])
      .join("path")
      .attr("d", ({ path }) => path)
      .attr("transform", `translate(${centerX}, ${centerY})`)
      .attr("class", "radar-area")
      .style("fill", ({ user_id }) => colors[user_id])
      .style("stroke", ({ user_id }) => colors[user_id])
      .style("opacity", 0.5)
      .on("mouseover", function (_, { username, user_id }) {
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

    const radarUsersCircle = pointsGroup
      .selectAll("g")
      .data(userData)
      .join("g")
      .attr("data-user", ({ user_id }) => user_id);

    radarUsersCircle
      .selectAll("circle")
      .data(({ genres, ...data }) =>
        genres.map((genreData) => {
          const angle =
            angleSlice * allAxes.indexOf(genreData.name) + (3 * Math.PI) / 2;
          const x = centerX + Math.cos(angle) * scale(genreData.proportion);
          const y = centerY + Math.sin(angle) * scale(genreData.proportion);
          return { ...data, ...genreData, x, y };
        })
      )
      .join("circle")
      .attr("cx", ({ x }) => x)
      .attr("cy", ({ y }) => y)
      .attr("r", pointSize(d3.zoomTransform(zoomGroup.node()!).k))
      .style("fill", ({ user_id }) => colors[user_id])
      .style("cursor", "pointer")
      .on(
        "mouseover",
        function (_, { user_id, formatedTime, name, username, proportion }) {
          d3.select('[data-user="' + user_id + '"]').raise(); // Déplace l'utilisateur au-dessus des autres

          tooltip.style("visibility", "visible").html(
            `<div style="display: flex; align-items: center;">
                  <div style="width: 10px; height: 10px; background-color: ${
                    colors[user_id]
                  }; margin-right: 5px; border: 1px solid #000;"></div>
                  <strong>${username}</strong><br>
                </div>
                <strong>Genre:</strong> ${name}<br>
                <strong>Proportion:</strong> ${proportion.toFixed(1)}%<br>
                <strong>Temps:</strong> ${formatedTime}`
          );

          // Augmenter dynamiquement le rayon
          const currentRadius = parseFloat(d3.select(this).attr("r")); // Récupérer le rayon actuel
          d3.select(this).attr("r", currentRadius + 1); // Ajouter 1 au rayon actuel
        }
      )
      .on("mousemove", (event) => {
        tooltip
          .style("top", `${event.pageY - 20}px`)
          .style("left", `${event.pageX + 10}px`);
      })
      .on("mouseout", function () {
        tooltip.style("visibility", "hidden");
        d3.select(this).attr(
          "r",
          pointSize(d3.zoomTransform(zoomGroup.node()!).k)
        );
      });

    const zoom = d3
      .zoom<SVGSVGElement, unknown>()
      .scaleExtent([1, 10])
      .translateExtent([
        [width / 4, height / 4],
        [(width * 3) / 4, (height * 3) / 4],
      ])
      .on("zoom", (event) => {
        svg
          .selectAll(".zoom-group")
          .attr("transform", event.transform)
          .selectAll(".points-group circle")
          .attr("r", pointSize(event.transform.k));
      });
    svg.call(zoom);
    const newTransform = d3.zoomIdentity.translate(-width, -height).scale(3);
    svg.transition().duration(750).call(zoom.transform, newTransform);
  }, [
    selectedUsers,
    period,
    topN,
    container,
    allAxes,
    width,
    height,
    userData,
  ]);

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
