import { Grid2, Typography } from "@mui/material";
import { useEffect, createRef, useMemo, useState } from "react";
import * as d3 from "d3";
import data from "./assets/data.json";
import { colors } from "./App";
import { useFormBulleRadar } from "./FormBulleRadarContext";
import { useSelectedUsers } from "./selectedUsersControl";
import { formatListenTime } from "./utils";

export default function Bulle() {
  const container = createRef<HTMLDivElement>();

  const [width, setWidth] = useState(0);
  const [height, setHeight] = useState(0);

  const { top: topN, period } = useFormBulleRadar();

  const selectedUsers = useSelectedUsers();

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

  const combinedGenres = useMemo(
    () =>
      Array.from(
        new Set(
          selectedUsers.flatMap(
            (user: string) =>
              data.users
                .find((u) => u.user_id === user)
                ?.top_genres.find((p) => p.label === period)
                ?.ranking.sort(
                  (a, b) => b["Listening Time"] - a["Listening Time"]
                )
                .slice(0, topN)
                .map((d) => d.Tags) || []
          )
        )
      ),
    [selectedUsers, period, topN]
  );

  const bubbles = useMemo(
    () =>
      combinedGenres.map((genreName) => {
        const userProportions = selectedUsers
          .map((user) => {
            const userData = data.users.find((u) => u.user_id === user);
            if (!userData) return null;

            const periodData = userData.top_genres.find(
              (p) => p.label === period
            ); // Changement ici pour correspondre à la période dynamique

            if (!periodData) return null;

            const totalListeningTime = d3.sum(
              periodData.ranking,
              (g) => g["Listening Time"]
            );

            const genreData = periodData.ranking.find(
              (g) => g.Tags === genreName
            ) || {
              ListeningTime: 0,
            };

            const proportion =
              totalListeningTime === 0 || isNaN(genreData["Listening Time"])
                ? 0
                : genreData["Listening Time"] / totalListeningTime;

            return {
              user_id: userData.user_id,
              username: userData.username,
              proportion,
              genre: genreName,
              temps: genreData["Listening Time"],
              formatedTime: formatListenTime(genreData["Listening Time"]),
            };
          })
          .filter((d) => d !== null);

        const average = d3.mean(userProportions, (d) => d.proportion);

        const totalProportion = d3.sum(userProportions, (d) => d.proportion);

        const result = {
          name: genreName,
          average: average,
          proportions: userProportions.map((p) => ({
            ...p,
            proportion:
              totalProportion === 0 ? 0 : p.proportion / totalProportion,
          })),
        };

        return result;
      }),
    [combinedGenres, selectedUsers, period]
  );

  useEffect(() => {
    //clear the chart
    d3.select(container.current).select(".chart").selectAll("*").remove();

    const svg = d3
      .select(container.current)
      .select(".chart")
      .append("svg")
      .attr("width", width)
      .attr("height", height);

    const tooltip = d3.select(container.current).select(".tooltip");

    const radiusScale = d3
      .scaleSqrt()
      .domain([0, d3.max(bubbles, (d) => d.average)])
      .range([10, 100]);

    d3.forceSimulation(bubbles)
      .force("x", d3.forceX(width / 2).strength(0.05))
      .force("y", d3.forceY(height / 2).strength(0.05))
      .force(
        "collide",
        d3.forceCollide((d) => radiusScale(d.average) + 5)
      )
      .on("tick", ticked);

    const pie = d3.pie().value((d) => d.proportion);
    const arc = d3
      .arc()
      .innerRadius(0)
      .outerRadius((d) => radiusScale(d.data.average));

    const zoomGroup = svg.append("g").attr("class", "zoom-group");

    const nodes = zoomGroup.selectAll("g").data(bubbles).enter().append("g");

    // Mise à jour de la création des chemins (paths)
    nodes
      .selectAll("path")
      .data((d) => {
        // Calcule les proportions basées sur `Listening Time`
        const totalListeningTime = d3.sum(d.proportions, (p) => p.temps);
        return pie(
          d.proportions.map((p) => ({
            ...p,
            proportion:
              totalListeningTime === 0 ? 0 : p.temps / totalListeningTime,
            average: d.average,
          }))
        );
      })
      .enter()
      .append("path")
      .attr("d", arc)
      .attr("fill", (d) => colors[d.data.user_id])
      .attr("stroke", "#fff")
      .attr("stroke-width", 1)
      .style("cursor", "pointer")
      .style("transition", ".1s")
      .on("mouseover", function (event, d) {
        d3.select(this).style("scale", 1.1);
        const userData = data.users.find((u) => u.user_id === d.data.user_id);

        if (!userData) return;

        const periodData = userData.top_genres.find((p) => p.label === period);

        if (!periodData) return;

        const genre = periodData.ranking.find((g) => g.Tags === d.data.genre);

        const totalListeningTime = d3.sum(
          periodData.ranking,
          (g) => g["Listening Time"]
        );

        const realProportion = genre
          ? ((genre["Listening Time"] / totalListeningTime) * 100).toFixed(1)
          : 0;

        tooltip
          .html(
            `<div style="display: flex; align-items: center;">
                  <div style="width: 10px; height: 10px; background-color: ${
                    colors[d.data.user_id]
                  }; margin-right: 5px; border: 1px solid #000;"></div>
                  <strong>${d.data.username}</strong><br>
                </div>
                <strong>Genre:</strong> ${d.data.genre}<br>
                <strong>Temps:</strong> ${d.data.formatedTime}<br>
                <strong>Self Proportion:</strong> ${realProportion}%<br>
                <strong>Diagram Proportion:</strong>  ${(
                  d.data.proportion * 100
                ).toFixed(1)}%
                  `
          )
          .style("visibility", "visible");
      })
      .on("mousemove", function (event) {
        tooltip
          .style("left", `${event.pageX + 10}px`)
          .style("top", `${event.pageY + 10}px`);
      })
      .on("mouseout", function () {
        tooltip.style("visibility", "hidden");
        d3.select(this).style("scale", 1);
      })
      .on("click", function (event, d) {
        // const targetPage = `music-genre.html?user=${d.data.user}&genre=${d.data.genre}`;
        // window.location.href = targetPage;
        //TODO:
      });

    nodes
      .append("text")
      .attr("text-anchor", "middle")
      .attr("dy", ".3em")
      .text((d) => d.name)
      .style("font-size", "18px")
      .style("font-weight", "bold")
      .style("fill", "#FFF");

    function ticked() {
      nodes.attr("transform", (d) => `translate(${d.x},${d.y})`);
    }

    const zoom = d3
      .zoom()
      .scaleExtent([0.5, 2]) // Limiter les niveaux de zoom
      .translateExtent([
        [-width / 2, -height / 2],
        [width * 1.5, height * 1.5],
      ])
      .on("zoom", (event) => {
        zoomGroup.attr("transform", event.transform);
      });

    svg.call(zoom);
  }, [
    selectedUsers,
    period,
    topN,
    container,
    combinedGenres.length,
    bubbles,
    width,
    height,
  ]);

  return (
    <Grid2
      container
      height={"100%"}
      flexDirection={"column"}
      textAlign={"center"}
    >
      <Typography variant="h4">Top genres</Typography>

      <Typography>Vision bulles : Top N genres par période</Typography>

      <Typography>
        Part des bulles : Temps d'écoute utilisateur vs total.
      </Typography>
      <Typography>
        Taille des bulles : Popularité du genre chez les utilisateurs.
      </Typography>
      <Grid2 flex={1} ref={container}>
        <Typography
          className="tooltip"
          style={{
            position: "absolute",
            background: "#fff",
            border: "1px solid #ccc",
            borderRadius: "5px",
            padding: "5px",
            fontSize: "12px",
            visibility: "hidden",
            textAlign: "left",
            zIndex: 9999,
          }}
        />
        <div
          className="chart"
          style={{
            position: "absolute",
          }}
        ></div>
      </Grid2>
    </Grid2>
  );
}
