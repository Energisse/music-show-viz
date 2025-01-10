import { Grid2, Typography } from "@mui/material";
import { useEffect, createRef, useMemo, useRef } from "react";
import * as d3 from "d3";
import data from "./assets/data.json";
import { colors } from "./App";
import { useFormBulleRadar } from "./FormBulleRadarContext";

export default function Camenbert() {
  const container = createRef<HTMLDivElement>();

  const svgRef = useRef<d3.Selection<
    SVGSVGElement,
    unknown,
    null,
    undefined
  > | null>(null);

  const {
    selectedUsers: selectedUsersRaw,
    top: topN,
    period,
  } = useFormBulleRadar();

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
      selectedUsers
        .map((user: string) => {
          const dataUser = data.users.find(({ user_id }) => user_id === user);
          if (!dataUser) return null;

          const topArtists = dataUser?.top_artists
            .find(({ label }) => label === period)
            ?.ranking.slice(0, topN)
            ?.sort((a, b) => b["Listening Time"] - a["Listening Time"]);

          if (!topArtists) return null;

          const sumArtists = d3.sum(
            topArtists,
            (artist) => artist["Listening Time"]
          );

          const angleScale = d3
            .scaleLinear()
            .domain([0, sumArtists || 0])
            .range([0, Math.PI * 2]);

          const radiusScale = d3
            .scaleLinear()
            .domain([
              0,
              d3.max(topArtists, (artist) => artist["Listening Time"]) || 0,
            ])
            .range([0, 100]);

          let totalAngle = 0;

          return {
            user,
            songs: topArtists.flatMap((artist) => {
              const startAngle = totalAngle;
              const endAngle =
                startAngle + angleScale(artist["Listening Time"]);
              totalAngle = endAngle;

              let totalRadius = 0;

              return dataUser.top_tracks
                .find(({ label }) => label === period)
                ?.ranking.filter((song) => song.Artist === artist.Artist)
                .sort((a, b) => b["Listening Time"] - a["Listening Time"])
                .map((song) => ({
                  ...song,
                  startAngle,
                  endAngle,
                  innerRadius: totalRadius,
                  outerRadius: (totalRadius += radiusScale(
                    song["Listening Time"]
                  )),
                }));
            }),
          };
        })
        .filter((x) => x),
    [selectedUsers, period, topN]
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

    d3.forceSimulation(combinedGenres)
      .force("x", d3.forceX(100).strength(0.05))
      .force("y", d3.forceY(100).strength(0.05))
      .force("collide", d3.forceCollide(100 + 2))
      .on("tick", ticked);

    svgRef
      .current!.selectAll("path")
      .data(
        combinedGenres.flatMap(({ songs, user, ...data }, i) =>
          songs?.flatMap((song) => ({ ...song, user }))
        )
      )
      .enter()
      .append("path")
      .attr("fill", (artist) => colors[artist.user])
      .attr("data-user", (artist) => artist.user)
      .attr("d", (artist) => {
        return d3.arc()({
          ...artist,
        });
      });

    function ticked() {
      combinedGenres.forEach(({ songs, user, x, y }) => {
        songs.forEach((song) => {
          svgRef
            .current!.selectAll(`[data-user=${user}]`)
            .style(
              "transform",
              `translate(${x + width / 2}px, ${y + height / 2}px)`
            );
        });
      });
    }
  }, [combinedGenres, container]);

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
