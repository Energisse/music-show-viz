import { Grid2, Typography } from "@mui/material";
import { useEffect, createRef, useMemo, useRef } from "react";
import * as d3 from "d3";
import data from "./assets/data.json";
import { colors } from "./App";
import { useControl } from "./controlContext";

export default function Bulle() {
  const container = createRef<HTMLDivElement>();

  const svgRef = useRef<d3.Selection<
    SVGSVGElement,
    unknown,
    null,
    undefined
  > | null>(null);

  const { selectedUsers: selectedUsersRaw, top: topN, period } = useControl();

  const selectedUsers = useMemo(
    () =>
      Object.entries(selectedUsersRaw)
        .filter(([_, v]) => v)
        .map(([k, _]) => k),
    [selectedUsersRaw]
  );

  useEffect(() => {
    const resizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const { width, height } = entry.contentRect;

        svgRef.current?.attr("width", width.toString());
        svgRef.current?.attr("height", height.toString());
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
        //console.log("Traitement du genre :", genreName); // Log pour chaque genre

        const userProportions = selectedUsers.map((user) => {
          //console.log("Utilisateur traité :", user); // Log pour chaque utilisateur

          const userData = data.users.find((u) => u.user_id === user);
          if (!userData) {
            console.warn("Données utilisateur introuvables pour :", user);
            return {
              user,
              proportion: 0,
              genre: genreName,
              temps: 0,
            };
          }

          const periodData = userData.top_genres.find(
            (p) => p.label === period
          ); // Changement ici pour correspondre à la période dynamique

          if (!periodData) {
            console.warn(
              "Aucune donnée trouvée pour la période :",
              period,
              "et l'utilisateur :",
              user
            );
            return {
              user,
              proportion: 0,
              genre: genreName,
              temps: 0,
            };
          }

          const totalListeningTime = periodData.ranking.reduce(
            (sum, genre) => sum + genre["Listening Time"],
            0
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
            user,
            proportion,
            genre: genreName,
            temps: genreData["Listening Time"] ?? 0,
          };
        });

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
    const width = container.current!.clientWidth;
    const height = container.current!.clientHeight;

    svgRef.current = d3
      .select(container.current)
      .select(".chart")
      .append("svg")
      .attr("width", width)
      .attr("height", height);

    const tooltip = d3
      .select(container.current)
      .select(".chart")
      .append("div")
      .style("position", "absolute")
      .style("background", "#fff")
      .style("padding", "8px")
      .style("border", "1px solid #ccc")
      .style("border-radius", "4px")
      .style("box-shadow", "0px 2px 4px rgba(0, 0, 0, 0.2)")
      .style("visibility", "hidden")
      .style("font-size", "12px")
      .style("pointer-events", "none");

    let minRadius;
    let maxRadius;

    if (combinedGenres.length === 1) {
      minRadius = 50;
      maxRadius = 120;
    } else if (combinedGenres.length <= 6) {
      minRadius = 30;
      maxRadius = 100;
    } else if (combinedGenres.length > 6 && combinedGenres.length <= 10) {
      minRadius = 20;
      maxRadius = 90;
    } else if (combinedGenres.length > 10 && combinedGenres.length <= 13) {
      minRadius = 10;
      maxRadius = 80;
    } else if (combinedGenres.length > 13) {
      minRadius = 5;
      maxRadius = 75;
    }

    const radiusScale = d3
      .scaleSqrt()
      .domain([0, d3.max(bubbles, (d) => d.average)])
      .range([minRadius, maxRadius]);

    d3.forceSimulation(bubbles)
      .force("x", d3.forceX(width / 2).strength(0.05))
      .force("y", d3.forceY(height / 2).strength(0.05))
      .force(
        "collide",
        d3.forceCollide((d) => radiusScale(d.average) + 2)
      )
      .on("tick", ticked);

    const pie = d3.pie().value((d) => d.proportion);
    const arc = d3
      .arc()
      .innerRadius(0)
      .outerRadius((d) => radiusScale(d.data.average));

    const zoomGroup = svgRef.current.append("g").attr("class", "zoom-group");

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
            proportion: p.temps / totalListeningTime, // Calcul de la proportion
            average: d.average,
          }))
        );
      })
      .enter()
      .append("path")
      .attr("d", arc)
      .attr("fill", (d) => colors[d.data.user])
      .attr("stroke", "#fff")
      .attr("stroke-width", 1)
      .style("cursor", "pointer")
      .attr("class", "slice")
      .on("mouseover", function (event, d) {
        // Trouve les données du genre correspondant
        const userData = data.users.find((u) => u.user_id === d.data.user);

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
            `
                    <div>
                      <div style="display: flex; align-items: center;">
                        <div style="width: 12px; height: 12px; background-color: ${
                          colors[d.data.user]
                        }; margin-right: 5px;"></div>
                        <strong>${d.data.user}</strong>
                      </div>
                      <div>Genre : ${d.data.genre}</div>
                      <div>Heures : ${(d.data.temps / 3600).toFixed(1)}</div>
                      <div>Self Proportion : ${realProportion}%</div>
                      <div>Diagram Proportion : ${(
                        d.data.proportion * 100
                      ).toFixed(1)}%</div>
                    </div>
                  `
          )
          .style("visibility", "visible");
      })
      .on("mousemove", function (event) {
        tooltip
          .style(
            "left",
            `${
              event.pageX - container.current!.getBoundingClientRect().left + 10
            }px`
          )
          .style(
            "top",
            `${
              event.pageY - container.current!.getBoundingClientRect().top + 10
            }px`
          );
      })
      .on("mouseout", function () {
        tooltip.style("visibility", "hidden");
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
      .style("font-size", "12px");

    function ticked() {
      nodes.attr("transform", (d) => `translate(${d.x},${d.y})`);
    }

    const zoom = d3
      .zoom()
      .scaleExtent([0.5, 1.1]) // Limiter les niveaux de zoom
      .translateExtent([
        [-width / 2, -height / 2],
        [width * 1.5, height * 1.5],
      ])
      .on("zoom", (event) => {
        zoomGroup.attr("transform", event.transform);
      });

    svgRef.current.call(zoom);
  }, [selectedUsers, period, topN, container, combinedGenres.length, bubbles]);

  return (
    <Grid2
      container
      height={"100%"}
      flexDirection={"column"}
      textAlign={"center"}
    >
      <Typography variant="h4">Top genres - diagramme en bulles</Typography>

      <Typography>Vision bulles : Top N genres par période</Typography>

      <Typography>
        Part des bulles : Temps d'écoute utilisateur vs total.
      </Typography>
      <Typography>
        Taille des bulles : Popularité du genre chez les utilisateurs.
      </Typography>
      <Grid2 flex={1} ref={container}>
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
