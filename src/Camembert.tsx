import { Grid2, Typography } from "@mui/material";
import { useEffect, createRef, useMemo } from "react";
import * as d3 from "d3";
import data from "./assets/data.json";
import { colors } from "./UserSelector";
import { useFormBulleRadar } from "./FormBulleRadarContext";
import { useSelectedUsers } from "./selectedUsersControl";
import { formatListenTime } from "./utils";
import useWatchSize from "./hooks/useWatchSize";

const paddingAngle = 0.1;
const padding = 4;
const innerPadding = 10;
const maxSongs = 5;

export type CamembertProps = {
  zoomed?: boolean;
};

export default function Camembert({ zoomed }: CamembertProps) {
  const container = createRef<HTMLDivElement>();

  const { top: topN, period } = useFormBulleRadar();

  const selectedUsers = useSelectedUsers();

  const { height, width } = useWatchSize(container);

  const filteredData = useMemo(
    () =>
      data.users
        .filter(({ user_id }) => selectedUsers.includes(user_id))
        .map(({ top_artists, user_id, username }) => ({
          user_id: user_id,
          username: username,
          top_artists: top_artists
            .find(({ label }) => label === period)
            ?.ranking.slice(0, topN)
            .map(({ list, ...rest }) => ({
              ...rest,
              list: list.sort(
                (a, b) => b["Listening Time"] - a["Listening Time"]
              ),
            })),
        })),
    [period, selectedUsers, topN]
  );

  const combinedArtistes = useMemo(() => {
    const maxArtists = d3.max(filteredData, (user) =>
      d3.max(user.top_artists, (artist) => artist["Listening Time"])
    );

    return filteredData
      .map((data) => {
        const angleScale =
          (Math.PI * 2 - paddingAngle * data.top_artists.length) /
          d3.sum(data.top_artists, (artist) => artist["Listening Time"]);

        const radiusScale = d3
          .scaleLinear()
          .domain([0, maxArtists])
          .range([0, 200]);

        let totalAngle = 0;

        const sumArtist = d3.sum(
          data.top_artists,
          (artist) => artist["Listening Time"]
        );

        return {
          user_id: data.user_id,
          username: data.username,
          radius:
            radiusScale(
              d3.max(data.top_artists, (artist) => artist["Listening Time"])
            ) +
            innerPadding +
            padding *
              Math.min(
                d3.max(data.top_artists, (artist) => artist.list.length) - 1,
                maxSongs + 1
              ),
          artists: data.top_artists.map((artist) => {
            const startAngle = totalAngle + paddingAngle;
            const endAngle = startAngle + angleScale * artist["Listening Time"];
            totalAngle = endAngle;

            let totalRadius = innerPadding;

            if (artist.list.length === 1) {
              totalRadius += padding * maxSongs;
            }

            return {
              artist: artist.Artist,
              startAngle,
              endAngle,
              songs: [
                ...(artist.list.length > maxSongs
                  ? [
                      {
                        "Song Title": "Autres",
                        "Listening Time": artist.list
                          .slice(maxSongs)
                          .reduce(
                            (acc, song) => acc + song["Listening Time"],
                            0
                          ),
                      },
                    ]
                  : []),
                ...artist.list.slice(0, maxSongs),
              ].map((song, index, array) => {
                const innerRadius = totalRadius;
                const outerRadius =
                  totalRadius + radiusScale(song["Listening Time"]);
                totalRadius =
                  outerRadius + (padding * maxSongs) / (array.length - 1);
                return {
                  ...song,
                  innerRadius,
                  outerRadius,
                  opacity: 1 - (0.8 / (array.length - 1)) * index,
                  formatedListens: formatListenTime(song["Listening Time"]),
                  percentageArtist:
                    (song["Listening Time"] / artist["Listening Time"]) * 100,
                  percentage: (song["Listening Time"] / sumArtist) * 100,
                };
              }),
            };
          }),
        };
      })
      .filter((x) => x);
  }, [filteredData]);

  useEffect(() => {
    //clear the chart
    d3.select(container.current).select(".chart").selectAll("*").remove();

    const tooltip = d3.select("#tooltip");

    const svg = d3
      .select(container.current)
      .select(".chart")
      .append("svg")
      .attr("width", width)
      .attr("height", height);

    const zoomGroup = svg.append("g").attr("class", "zoom-group");

    const userGroup = zoomGroup
      .selectAll("g")
      .data(combinedArtistes)
      .join("g")
      .attr("data-user", (d) => d.user_id);

    const artistGroup = userGroup
      .selectAll("g")
      .data(({ artists, ...data }) =>
        artists.flatMap((dataArtist) => ({
          ...data,
          ...dataArtist,
        }))
      )
      .join("g")
      .attr("data-artiste", (d) => d.artist);

    artistGroup
      .append("g")
      .style(
        "transform",
        ({ endAngle, startAngle, songs }) =>
          `rotate(${
            (((endAngle + startAngle) / 2) * 180) / Math.PI - 90
          }deg) translate(${songs.at(-1).outerRadius + padding}px, 0px)`
      )
      .append("text")
      .attr("class", "artist-name")
      .attr("data-start-radius", ({ songs }) => songs.at(-1).outerRadius)
      .text((d) => d.artist)
      .style("text-anchor", ({ endAngle, startAngle }) =>
        ((((endAngle + startAngle) / 2) * 180) / Math.PI) % 360 > 180
          ? "end"
          : "start"
      )
      .style("rotate", ({ endAngle, startAngle }) =>
        ((((endAngle + startAngle) / 2) * 180) / Math.PI) % 360 > 180
          ? "180deg"
          : 0
      );

    artistGroup
      .append("g")
      .selectAll("g")
      .data(({ songs, ...data }) =>
        songs.flatMap((song) => ({
          ...data,
          ...song,
        }))
      )
      .join("path")
      .style("cursor", "pointer")
      .style("transition", " 0.2s")
      .attr("fill", (artist) => colors[artist.user_id])
      .style("opacity", (artist) => artist.opacity)
      .attr("d", (artist) => {
        return d3.arc()({
          ...artist,
        });
      })
      .on("mouseover", (event, d) => {
        tooltip
          .html(
            `<div style="display: flex; align-items: center;">
                  <div style="width: 10px; height: 10px; background-color: ${
                    colors[d.user_id]
                  }; margin-right: 5px; border: 1px solid #000;"></div>
                  <strong>${d.username}</strong><br>
                </div>
                <strong>Écoutes:</strong> ${d.formatedListens}<br>
                <strong>Pourcentage artiste:</strong> ${d.percentageArtist.toFixed(
                  2
                )}%<br>
                <strong>Pourcentage total: </strong> ${d.percentage.toFixed(
                  2
                )}%<br>
                <strong>Artiste:</strong> ${d.artist}<br>
                <strong>Titre:</strong> ${d["Song Title"]}<br>
                  `
          )
          .style("visibility", "visible");

        d3.select(event.target).attr("d", (artist) => {
          return d3.arc()({
            ...artist,
            innerRadius: Math.max(artist.innerRadius - 2, 0),
            outerRadius: artist.outerRadius + 2,
            startAngle: artist.startAngle - 0.05,
            endAngle: artist.endAngle + 0.05,
          });
        });
      })
      .on("mousemove", function (event) {
        tooltip
          .style("left", `${event.pageX + 10}px`)
          .style("top", `${event.pageY + 10}px`);
      })
      .on("mouseout", (event) => {
        tooltip.style("visibility", "hidden");
        d3.select(event.target).attr("d", (artist) => {
          return d3.arc()({
            ...artist,
          });
        });
      });

    d3.forceSimulation(combinedArtistes)
      .force("x", d3.forceX(width / 2).strength(0.05))
      .force("y", d3.forceY(height / 2).strength(0.05))
      .force(
        "collide",
        d3.forceCollide((d) =>
          d3.max(
            d3.selectAll(`g[data-user=${d.user_id}] .artist-name`).nodes(),
            (n) => n.getComputedTextLength() + +n.dataset.startRadius
          )
        )
      )
      .on("tick", ticked);

    function ticked() {
      combinedArtistes.forEach(({ artists, user_id, x, y }) => {
        artists.forEach(({ songs }) => {
          songs.forEach(() => {
            svg
              .selectAll(`[data-user=${user_id}]`)
              .style("transform", `translate(${x}px, ${y}px)`);
          });
        });
      });
    }

    const zoom = d3
      .zoom()
      .scaleExtent([0.5, 100]) // Limiter les niveaux de zoom

      .on("zoom", (event) => {
        zoomGroup.attr("transform", event.transform);
      });

    svg.call(zoom);
  }, [combinedArtistes, container, height, width]);

  return (
    <Grid2
      container
      height={"100%"}
      flexDirection={"column"}
      textAlign={"center"}
    >
      <Typography variant="h4">Top {topN} artistes</Typography>

      {zoomed && (
        <>
          <Typography>
            Top {maxSongs} des musiques par artiste (Regroupement des autres
            musiques si necessaire)
          </Typography>
          <Typography>
            Largeur des arc de cercle : Pourcentage d'écoute de l'artiste
          </Typography>
          <Typography>
            Hauteur des arc de cercle : Temps d'écoute de la musique/de
            l'artiste
          </Typography>
        </>
      )}

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
