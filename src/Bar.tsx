import {
  Checkbox,
  Grid2,
  ListSubheader,
  MenuItem,
  Select,
  Typography,
} from "@mui/material";
import { useEffect, createRef, useMemo, useState } from "react";
import * as d3 from "d3";
import data from "./assets/data.json";
import { colors } from "./UserSelector";
import { useSelectedUsers } from "./selectedUsersControl";
import { formatListenTime } from "./utils";
import useWatchSize from "./hooks/useWatchSize";

export type BarProps = {
  visualisation: "month" | "year" | "day";
};

export default function Bar({ visualisation }: BarProps) {
  const container = createRef<HTMLDivElement>();

  const periodList = useMemo(() => {
    if (visualisation === "day") return [];
    if (visualisation === "year")
      return [
        ...new Set(
          data.users.flatMap((d) =>
            d.average_listening_time.dataYear.map((d) => d.period.split("-")[0])
          )
        ),
      ].sort((a, b) => new Date(b).getTime() - new Date(a).getTime());
    return [
      ...new Set(
        data.users.flatMap((d) =>
          d.average_listening_time.dataMonth.map((d) =>
            d.period.split("-").splice(0, 2).join("-")
          )
        )
      ),
    ].sort((a, b) => new Date(b).getTime() - new Date(a).getTime());
  }, [visualisation]);

  const [selectedPeriod, setSelectedPeriod] = useState([periodList[0]]);

  const { height, width } = useWatchSize(container);

  const selectedUsers = useSelectedUsers();

  const filteredData = useMemo(() => {
    const filteredData = data.users
      .filter(({ user_id }) => selectedUsers.includes(user_id))
      .map(({ average_listening_time, user_id, username }) => ({
        user_id,
        username,
        average_listening_time: average_listening_time[
          `data${
            visualisation.charAt(0).toUpperCase() + visualisation.slice(1)
          }` as keyof typeof average_listening_time
        ].map(({ listens, ...rest }) => ({
          ...rest,
          listens: listens / 60,
          formatedTime: formatListenTime(listens),
        })),
      }));

    if (visualisation === "month" || visualisation === "year") {
      return filteredData.map(({ average_listening_time, ...data }) => ({
        ...data,
        average_listening_time: average_listening_time
          .filter(({ period }) =>
            selectedPeriod.some((selectedPeriod) =>
              period.toString().startsWith(selectedPeriod)
            )
          )
          .sort(
            (a, b) =>
              new Date(a.period).getTime() - new Date(b.period).getTime()
          ),
      }));
    }

    return filteredData;
  }, [visualisation, selectedUsers, selectedPeriod]);

  const selectPeriods = useMemo(() => {
    const selectPeriods = Array<React.ReactNode>();

    if (visualisation === "day") return selectPeriods;

    if (visualisation === "year") {
      return periodList.map((val) => (
        <MenuItem key={val} value={val}>
          <Checkbox checked={selectedPeriod.includes(val)} />
          {new Date(val).toLocaleDateString("fr-FR", { year: "numeric" })}
        </MenuItem>
      ));
    }

    periodList
      .sort(
        (a, b) =>
          new Date(b).getFullYear() - new Date(a).getFullYear() ||
          new Date(a).getTime() - new Date(b).getTime()
      )
      .forEach((year, index, array) => {
        if (
          index === 0 ||
          year.split("-")[0] !== array[index - 1].split("-")[0]
        )
          selectPeriods.push(
            <ListSubheader key={year.split("-")[0]}>
              {year.split("-")[0]}
            </ListSubheader>
          );

        selectPeriods.push(
          <MenuItem key={year} value={year}>
            <Checkbox checked={selectedPeriod.includes(year)} />
            {new Date(year).toLocaleDateString("fr-FR", { month: "long" })}
          </MenuItem>
        );
      });

    return selectPeriods;
  }, [visualisation, selectedPeriod, periodList]);

  const periods = useMemo(() => {
    const periods = new Set<string>();

    filteredData.forEach(({ average_listening_time }) =>
      average_listening_time.forEach(({ period }) =>
        periods.add(period.toString())
      )
    );

    return [...periods].sort(
      (a, b) => new Date(a).getTime() - new Date(b).getTime()
    );
  }, [filteredData]);

  useEffect(() => {
    //clear the chart
    d3.select(container.current).select(".chart").selectAll("*").remove();

    const margin = { top: 40, right: 50, bottom: 70, left: 50 };
    const innerHeight = height - margin.top - margin.bottom;
    const innerWidth = width - margin.left - margin.right;

    const svg = d3
      .select(container.current)
      .select(".chart")
      .append("svg")
      .attr("width", width)
      .attr("height", height)
      .append("g")
      .attr("width", innerWidth)
      .attr("height", innerHeight)
      .attr("transform", `translate(${margin.left},${margin.top})`);

    // Tooltip for hover interactions
    const tooltip = d3.select("#tooltip");

    function drawHorizontal(data: typeof filteredData) {
      const paddingCenter = 100;
      // Scales for the charts
      const y = d3
        .scaleBand()
        .range([innerHeight, 0])
        .padding(0.2)
        .domain(periods);

      const max =
        d3.max(data, ({ average_listening_time }) =>
          d3.max(average_listening_time, ({ listens }) => listens)
        ) || 0;

      const x1 = d3
        .scaleLinear()
        .range([(innerWidth - paddingCenter) / 2, 0])
        .domain([0, max]);

      const x2 = d3
        .scaleLinear()
        .range([0, (innerWidth - paddingCenter) / 2])
        .domain([0, max]);

      // Group for user1 chart (barres orientées vers la gauche)
      const group1 = svg.append("g").attr("transform", `translate(0, 0)`);

      const bar1 = group1
        .selectAll(".bar1")
        .data(data[0].average_listening_time)
        .join("rect")
        .attr("class", "bar1")
        .style("opacity", 0.8)
        .attr("y", (d) => y(d.period.toString()) || 0)
        .attr("x", width / 2 - margin.left - paddingCenter / 2)
        .attr("height", y.bandwidth())
        .attr("fill", colors[data[0].user_id]);

      bar1
        .transition()
        .duration(500)
        .delay((_, i) => i * 10)
        .attr("x", (d) => x1(d.listens))

        .attr(
          "width",
          (d) => width / 2 - margin.left - paddingCenter / 2 - x1(d.listens)
        );

      // Ajouter l'axe X pour l'utilisateur 1
      group1
        .append("g")
        .attr("transform", `translate(0,${height - margin.top * 2})`)
        .call(d3.axisBottom(x1).ticks(5));

      // Group for user2 chart (barres orientées vers la droite)
      const group2 = svg
        .append("g")
        .attr("transform", `translate(${(innerWidth + paddingCenter) / 2}, 0)`);

      const bar2 = group2
        .selectAll(".bar2")
        .data(data[1].average_listening_time)
        .join("rect")
        .attr("class", "bar2")
        .style("opacity", 0.8)
        .attr("y", (d) => y(d.period.toString()) || 0)
        .attr("x", 0)
        .attr("height", y.bandwidth())
        .attr("fill", colors[data[1].user_id]);

      bar2
        .transition()
        .duration(500)
        .delay((_, i) => i * 10)
        .attr("width", (d) => x2(d.listens));

      // Ajouter l'axe X pour l'utilisateur 2
      group2
        .append("g")
        .attr("transform", `translate(0,${height - margin.top * 2})`)
        .call(d3.axisBottom(x2).ticks(5));

      [bar1, bar2].forEach((group, index) => {
        group
          .on("mousemove", function (event, d) {
            tooltip
              .style("visibility", "visible")
              .html(
                `  <div style="display: flex; align-items: center;">
                        <div style="width: 12px; height: 12px; background-color: ${
                          colors[data[index].user_id]
                        }; margin-right: 5px;"></div>
                        <strong>${data[index].username}</strong>
                      </div><strong>Période:</strong> ${
                        d.period
                      }<br><strong>Temps d'écoute:</strong> ${d.formatedTime}`
              )
              .style("left", `${event.pageX + 10}px`)
              .style("top", `${event.pageY - 30}px`);

            d3.select(this)
              .attr("opacity", 1)
              .attr("stroke", "black")
              .attr("stroke-width", 2);
          })
          .on("mouseout", function () {
            tooltip.style("visibility", "hidden");
            d3.select(this).attr("opacity", 0.8).attr("stroke", "none");
          });
      });

      // Ajouter un axe central pour les périodes
      const centralAxis = svg
        .append("g")
        .attr(
          "transform",
          `translate(${x1.range()[0] + paddingCenter / 2} , 0)`
        );

      centralAxis
        .call(d3.axisLeft(y).tickSize(0).tickSizeOuter(0))
        .selectAll("text")
        .style("text-anchor", "middle")
        .style("font-size", "10px");

      centralAxis.select(".domain").attr("stroke", "none");

      // Ajouter des titres pour les deux joueurs
      svg
        .append("text")
        .attr("x", width / 4)
        .attr("y", -margin.top / 2)
        .style("text-anchor", "middle")
        .style("font-size", "14px")
        .text(`Écoutes de ${selectedUsers[0]}`);

      svg
        .append("text")
        .attr("x", (width / 4) * 3)
        .attr("y", -margin.top / 2)
        .style("text-anchor", "middle")
        .style("font-size", "14px")
        .text(`Écoutes de ${selectedUsers[1]}`);
    }

    function drawVertical(data: typeof filteredData) {
      const userCount = selectedUsers.length;

      const x = d3
        .scaleBand()
        .domain(periods)
        .range([0, width - margin.left - margin.right])
        .paddingInner(0.2)
        .paddingOuter(0.2);

      const y = d3
        .scaleLinear()
        .domain([
          0,
          d3.max(data, ({ average_listening_time }) =>
            d3.max(average_listening_time, ({ listens }) => listens)
          ) || 0,
        ])
        .range([height - margin.top - margin.bottom, 0])
        .nice();

      const xAxisGroup = svg
        .append("g")
        .attr(
          "transform",
          `translate(0,${height - margin.top - margin.bottom})`
        );
      const yAxisGroup = svg.append("g");

      // Largeur dynamique des barres
      const barWidth = x.bandwidth() / userCount;

      // Lier les données aux éléments rect
      const users = svg.selectAll(".bar").data(data).join("g");

      users
        .selectAll("g")
        .data(({ average_listening_time, ...data }) =>
          average_listening_time.flatMap((d) => ({ ...d, ...data }))
        )
        .join("rect")
        .attr("class", "bar")
        .attr(
          "x",
          (d) =>
            (x(d.period.toString()) || 0) + // Position de la période
            (x.bandwidth() - userCount * barWidth) / 2 + // Décalage pour centrer les groupes
            selectedUsers.indexOf(d.user_id) * barWidth // Décalage pour chaque joueur
        )
        .attr("y", innerHeight)
        .attr("width", barWidth - 2) // Ajustement pour éviter les chevauchements
        .attr("fill", (d) => colors[d.user_id])
        .attr("opacity", 0.8)
        .on("mousemove", function (event, d) {
          tooltip
            .style("visibility", "visible")
            .html(
              `  <div style="display: flex; align-items: center;">
                        <div style="width: 12px; height: 12px; background-color: ${
                          colors[d.user_id]
                        }; margin-right: 5px;"></div>
                        <strong>${d.username}</strong>
                      </div><strong>Période:</strong> ${
                        d.period
                      }<br><strong>Temps d'écoute:</strong> ${d.formatedTime}`
            )
            .style("left", `${event.pageX + 10}px`)
            .style("top", `${event.pageY - 30}px`);

          d3.select(this)
            .attr("opacity", 1)
            .attr("stroke", "black")
            .attr("stroke-width", 2);
        })
        .on("mouseout", function () {
          tooltip.style("visibility", "hidden");
          d3.select(this).attr("opacity", 0.8).attr("stroke", "none");
        })
        .transition()
        .duration(500)
        .delay((_, i) => i * 10)
        .attr("y", (d) => y(d.listens))
        .attr(
          "height",
          (d) => height - y(d.listens) - margin.top - margin.bottom
        );

      // Mise à jour des axes
      xAxisGroup
        .call(d3.axisBottom(x))
        .selectAll("text")
        .attr("transform", "rotate(45)") // Incliner les étiquettes pour éviter la superposition
        .style("text-anchor", "start");

      yAxisGroup.call(d3.axisLeft(y));
    }

    if (selectedUsers.length === 2) {
      drawHorizontal(filteredData);
    } else {
      drawVertical(filteredData.splice(0, filteredData.length));
    }
  }, [
    selectedUsers,
    container,
    width,
    height,
    visualisation,
    filteredData,
    periods,
  ]);

  return (
    <Grid2
      container
      size={12}
      height={
        selectedUsers.length === 2 ? Math.max(500, periods.length * 20) : 500
      }
      flexDirection={"column"}
      textAlign={"center"}
    >
      <Typography variant="h5">
        {visualisation === "day"
          ? "Jour"
          : visualisation === "month"
          ? "Mois"
          : "Année" + (selectedPeriod.length > 1 ? "s" : "")}
        {visualisation !== "day" && (
          <>
            {" "}
            :{" "}
            <Select
              variant="standard"
              multiple
              value={selectedPeriod}
              onChange={(e) =>
                setSelectedPeriod((prev) => {
                  if (e.target.value.length < prev.length)
                    return e.target.value as string[];
                  if (prev.length > 5) return prev;
                  return e.target.value as string[];
                })
              }
              sx={{
                fontSize: "1.25rem",
              }}
              renderValue={(selected) =>
                selected
                  .map((date) =>
                    new Date(date).toLocaleDateString(
                      "fr-FR",
                      visualisation === "year"
                        ? { year: "numeric" }
                        : { month: "long", year: "numeric" }
                    )
                  )
                  .join(", ")
              }
            >
              {selectPeriods}
            </Select>
          </>
        )}
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
