import { Grid2, Typography } from "@mui/material";
import { useEffect, createRef, useMemo, useState } from "react";
import * as d3 from "d3";
import data from "./assets/data.json";
import { colors } from "./UserSelector";
import { useSelectedUsers } from "./selectedUsersControl";
import { useFormBar } from "./FormBarContext";
import { formatListenTime } from "./utils";

export default function Bar() {
  const container = createRef<HTMLDivElement>();

  const [width, setWidth] = useState(0);
  const [height, setHeight] = useState(0);

  const selectedUsers = useSelectedUsers();
  const { visualisation, period: selectedPeriod } = useFormBar();

  const title = useMemo(() => {
    const selectedUsersCopy = [...selectedUsers].map(
      (user) => data.users.find(({ user_id }) => user === user_id)?.username
    );
    let titre = "";
    if (selectedUsers.length === 1) {
      titre = "Analyse du temps d'écoute en minutes de ";
    } else {
      titre = "Comparaison du temps d'écoute en minutes de ";
    }
    titre += [
      selectedUsersCopy.splice(0, selectedUsersCopy.length - 1).join(", "),
      selectedUsersCopy.at(-1),
    ].join(" et ");

    switch (visualisation) {
      case "month":
        titre += " par mois";
        break;
      case "year":
        titre += " par année";
        break;
      case "day":
        titre += " par jour";
        break;
    }

    return titre;
  }, [selectedUsers, visualisation]);

  const filteredData = useMemo(() => {
    const filteredData = data.users
      .filter(({ user_id }) => selectedUsers.includes(user_id))
      .map(({ average_listening_time, user_id, username }) => ({
        user_id,
        username,
        average_listening_time: (
          average_listening_time[
            `data${
              visualisation.charAt(0).toUpperCase() + visualisation.slice(1)
            }`
          ] as
            | (typeof data)["users"][number]["average_listening_time"]["dataDay"]
            | (typeof data)["users"][number]["average_listening_time"]["dataMonth"]
            | (typeof data)["users"][number]["average_listening_time"]["dataYear"]
        ).map(({ listens, ...rest }) => ({
          ...rest,
          listens: listens / 60,
          formatedTime: formatListenTime(listens),
        })),
      }));

    if (visualisation === "month" || visualisation === "year") {
      return filteredData.map(({ average_listening_time, ...data }) => ({
        ...data,
        average_listening_time: average_listening_time.filter(({ period }) =>
          period.toString().startsWith(selectedPeriod)
        ),
      }));
    }

    return filteredData;
  }, [visualisation, selectedUsers, selectedPeriod]);

  const periods = useMemo(() => {
    const periods = new Set<string>();

    filteredData.forEach(({ average_listening_time }) =>
      average_listening_time.forEach(({ period }) =>
        periods.add(period.toString())
      )
    );

    if (visualisation === "month") {
      return [...periods].reverse();
    }
    return [...periods];
  }, [filteredData, visualisation]);

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
    //clear the chart
    d3.select(container.current).select(".chart").selectAll("*").remove();

    const margin = { top: 40, right: 100, bottom: 70, left: 100 };
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
    const tooltip = d3.select(container.current).select(".tooltip");

    function draw({
      average_listening_time,
      user_id,
      username,
    }: (typeof filteredData)[number]) {
      const x = d3.scaleBand().range([0, innerWidth]).padding(0.1);
      const y = d3.scaleLinear().range([innerHeight, 0]);

      const xAxisGroup = svg
        .append("g")
        .attr("transform", `translate(0,${innerHeight})`);
      const yAxisGroup = svg.append("g");
      // Mise à jour des échelles
      x.domain(periods);
      y.domain([0, d3.max(average_listening_time, (d) => d.listens) || 0]);

      // // Liaison des données avec les barres
      svg
        .selectAll(".bar")
        .data(average_listening_time)
        .enter()
        .append("rect")
        .attr("class", "bar")
        .attr("x", ({ period }) => x(period.toString()) || 0)
        .attr("y", ({ listens }) => y(listens))
        .attr("width", x.bandwidth())
        .attr("height", ({ listens }) => innerHeight - y(listens))
        .attr("fill", colors[user_id])
        .attr("opacity", 0.8)
        .on("mousemove", function (event, { formatedTime, period }) {
          tooltip
            .style("visibility", "visible")
            .html(
              `
              <div style="display: flex; align-items: center;">
                        <div style="width: 12px; height: 12px; background-color: ${colors[user_id]}; margin-right: 5px;"></div>
                        <strong>${username}</strong>
                      </div><strong>Période:</strong> ${period}<br><strong>Temps d'écoute:</strong> ${formatedTime}`
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
      // Mise à jour des axes
      xAxisGroup
        .call(d3.axisBottom(x))
        .selectAll("text")
        .attr("transform", "rotate(45)")
        .style("text-anchor", "start");
      yAxisGroup.call(d3.axisLeft(y));
    }

    function drawComparison(data: typeof filteredData) {
      const paddingCenter = 100;
      // Scales for the charts
      const y = d3
        .scaleBand()
        .range([0, innerHeight])
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
        .enter()
        .append("rect")
        .attr("class", "bar1")
        .style("opacity", 0.8)
        .attr("y", (d) => y(d.period.toString()) || 0)
        .attr("x", (d) => x1(d.listens))
        .attr("height", y.bandwidth())
        .attr(
          "width",
          (d) => width / 2 - margin.left - paddingCenter / 2 - x1(d.listens)
        )
        .attr("fill", colors[data[0].user_id]);

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
        .enter()
        .append("rect")
        .attr("class", "bar2")
        .style("opacity", 0.8)
        .attr("y", (d) => y(d.period.toString()) || 0)
        .attr("x", 0)
        .attr("height", y.bandwidth())
        .attr("width", (d) => x2(d.listens))
        .attr("fill", colors[data[1].user_id]);

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

    function drawAdvanced(data: typeof filteredData) {
      const userCount = selectedUsers.length;

      const x = d3.scaleBand().range([0, width - margin.left - margin.right]);
      const y = d3
        .scaleLinear()
        .range([height - margin.top - margin.bottom, 0]);

      const xAxisGroup = svg
        .append("g")
        .attr(
          "transform",
          `translate(0,${height - margin.top - margin.bottom})`
        );
      const yAxisGroup = svg.append("g");

      // Mettre à jour les échelles
      x.range([0, width - margin.left - margin.right])
        .domain(periods)
        .paddingInner(0.001); // Réduction de l'espace entre les périodes
      y.domain([
        0,
        d3.max(data, ({ average_listening_time }) =>
          d3.max(average_listening_time, ({ listens }) => listens)
        ) || 0,
      ]).nice();

      // Largeur dynamique des barres
      const barWidth = Math.min(18, x.bandwidth() / userCount);

      // Lier les données aux éléments rect
      svg
        .selectAll(".bar")
        .data(
          data.flatMap(({ average_listening_time, ...data }) =>
            average_listening_time.flatMap((d) => [{ ...d, ...data }])
          )
        )
        .enter()
        .append("rect")
        .attr("class", "bar")
        .attr(
          "x",
          (d) =>
            (x(d.period.toString()) || 0) + // Position de la période
            (x.bandwidth() - userCount * barWidth) / 2 + // Décalage pour centrer les groupes
            selectedUsers.indexOf(d.user_id) * barWidth // Décalage pour chaque joueur
        )
        .attr("y", (d) => y(d.listens))
        .attr("width", barWidth - 2) // Ajustement pour éviter les chevauchements
        .attr(
          "height",
          (d) => height - y(d.listens) - margin.top - margin.bottom
        )
        .attr("fill", (d) => colors[d.user_id] || "gray")
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
        });

      // Mise à jour des axes
      xAxisGroup
        .call(d3.axisBottom(x))
        .selectAll("text")
        .attr("transform", "rotate(45)") // Incliner les étiquettes pour éviter la superposition
        .style("text-anchor", "start");

      yAxisGroup.call(d3.axisLeft(y));
    }

    if (filteredData.length === 1) {
      draw(filteredData[0]);
    } else if (selectedUsers.length === 2) {
      drawComparison(filteredData);
    } else {
      drawAdvanced(filteredData);
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
      height={"100%"}
      flexDirection={"column"}
      textAlign={"center"}
    >
      <Typography variant="h4" paddingBottom={2}>
        {title}
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
