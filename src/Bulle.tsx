import { Grid2, Typography } from "@mui/material";
import { useEffect, createRef, useMemo, useState } from "react";
import * as d3 from "d3";
import data from "./assets/data.json";
import { useFormBulleRadar } from "./FormBulleRadarContext";
import { useSelectedUsers } from "./selectedUsersControl";
import { formatListenTime } from "./utils";
import { colors } from "./UserSelector";

export type BulleProps = {
  zoomed?: boolean;
};

export default function Bulle({ zoomed }: BulleProps) {
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

  const bubbles = useMemo(() => {
    return Object.entries(
      selectedUsers.reduce(
        (acc, user) => {
          const userData = data.users.find((u) => u.user_id === user)!;

          const periodData = userData.top_genres.find(
            (p) => p.label === period
          );

          if (!periodData) return acc;

          const totalListeningTime = d3.sum(
            periodData.ranking,
            (g) => g["Listening Time"]
          );

          if (!totalListeningTime) return acc;

          periodData.ranking
            .sort((a, b) => b["Listening Time"] - a["Listening Time"])
            .slice(0, topN)
            .forEach((genre) => {
              const genreName = genre.Tags;
              const listeningTime = genre["Listening Time"];
              const selfProportion = listeningTime / totalListeningTime;

              if (!acc[genreName]) {
                acc[genreName] = {
                  average: 0,
                  users: [],
                };
              }

              acc[genreName].average += listeningTime;

              acc[genreName].users.push({
                user_id: userData.user_id,
                username: userData.username,
                selfProportion,
                genre: genreName,
                temps: listeningTime,
                formatedTime: formatListenTime(listeningTime),
              });
            });

          return acc;
        },
        {} as Record<
          string,
          {
            average: number;
            users: {
              user_id: string;
              username: string;
              selfProportion: number;
              genre: string;
              temps: number;
              formatedTime: string;
            }[];
          }
        >
      )
    ).map(([name, { average, users }]) => ({
      name,
      average,
      users: users.map((u) => ({
        ...u,
        average,
        proportion: u.temps / average,
      })),
      x: 0,
      y: 0,
    }));
  }, [selectedUsers, topN, period]);

  useEffect(() => {
    d3.select(container.current).select(".chart").selectAll("*").remove();

    const svg = d3
      .select(container.current)
      .select(".chart")
      .append("svg")
      .attr("width", width)
      .attr("height", height);

    const tooltip = d3.select("#tooltip");

    const radiusScale = d3
      .scaleSqrt()
      .domain([0, d3.max(bubbles, (d) => d.average)!])
      .range([10, 100]);

    d3.forceSimulation(bubbles)
      .force("x", d3.forceX(width / 2).strength(0.05))
      .force("y", d3.forceY(height / 2).strength(0.05))
      .force(
        "collide",
        d3.forceCollide(({ average }) => radiusScale(average) + 5)
      )
      .on("tick", ticked);

    const pie = d3
      .pie<(typeof bubbles)[number]["users"][number]>()
      .value(({ proportion }) => proportion);

    const arc = d3
      .arc<ReturnType<typeof pie>[number]>()
      .innerRadius(0)
      .outerRadius(({ data: { average } }) => radiusScale(average));

    const zoomGroup = svg.append("g").attr("class", "zoom-group");

    const nodes = zoomGroup
      .selectAll("g")
      .data(bubbles)
      .enter()
      .append("g")
      .attr("data-name", ({ name }) => name)
      .on("mouseover", function (_, { users }) {
        d3.select(this).selectAll("path").style("scale", 1.1);
        tooltip
          .html(
            `
            <table>
              <thead>
          <tr>
            <th style="padding: 0 5px;"></th>
            <th style="padding: 0 5px;">Utilisateur</th>
            <th style="padding: 0 5px;">Temps</th>
            <th style="padding: 0 5px;">Self Proportion</th>
            <th style="padding: 0 5px;">Diagram Proportion</th>
          </tr>
              </thead>
              <tbody>
          ${users
            .map(
              ({
                formatedTime,
                user_id,
                username,
                proportion,
                selfProportion,
              }) => `
              <tr>
                <td style="padding: 0 5px;">
            <div style="width: 10px; height: 10px; background-color: ${
              colors[user_id]
            }; border: 1px solid #000;"></div>
                </td>
                <td style="padding: 0 5px;">${username}</td>
                <td style="padding: 0 5px;">${formatedTime}</td>
                <td style="padding: 0 5px;">${(selfProportion * 100).toFixed(
                  1
                )}%</td>
                <td style="padding: 0 5px;">${(proportion * 100).toFixed(
                  1
                )}%</td>
              </tr>`
            )
            .join("")}
              </tbody>
            </table>
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
        d3.select(this).selectAll("path").style("scale", 1);
      });

    nodes
      .selectAll("path")
      .data(({ users }) => pie(users))
      .enter()
      .append("path")
      .attr("data-user", ({ data: { user_id } }) => user_id)
      .attr("d", arc)
      .attr("fill", ({ data: { user_id } }) => colors[user_id])
      .attr("stroke", "#fff")
      .attr("stroke-width", 1)
      .style("cursor", "pointer")
      .style("transition", ".1s");

    nodes
      .append("text")
      .attr("text-anchor", "middle")
      .attr("dy", ".3em")
      .text((d) => d.name)
      .style("font-size", "12px")
      .style("font-weight", "bold")
      .style("overflow", "hidden")
      .style("text-overflow", "ellipsis")
      .style("fill", "#FFF");

    function ticked() {
      nodes.attr("transform", ({ x, y }) => `translate(${x},${y})`);
    }

    const zoom = d3
      .zoom<SVGSVGElement, unknown>()
      .scaleExtent([0.5, 2]) // Limiter les niveaux de zoom
      .translateExtent([
        [-width / 2, -height / 2],
        [width * 1.5, height * 1.5],
      ])
      .on("zoom", (event) => {
        zoomGroup.attr("transform", event.transform);
      });

    svg.call(zoom);
  }, [selectedUsers, period, topN, container, bubbles, width, height]);

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
          <Typography>Vision bulles : Top N genres par période</Typography>

          <Typography>
            Part des bulles : Temps d'écoute utilisateur vs total d'écoute sur
            leur top genre
          </Typography>
          <Typography>
            Taille des bulles : Popularité du genre chez les utilisateurs.
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
