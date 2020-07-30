// https://observablehq.com/@d3/stacked-bar-chart
// https://observablehq.com/@d3/styled-axes
// https://observablehq.com/@d3/working-with-color

import Globals, { Query } from "./globals.js";
import navBar from "./navbar.js";

let margin = {
  top: 10,
  right: 0,
  bottom: 20,
  left: 15
};

let buttons = null;
let grid = null;
let leftMenu = null;
let termList = null;
let barChart = null;
let svg = null;
let axis = null;
let bars = null;
let tooltip = null;
let header = null;
let color = null;

let svgWidth = 650;
let svgHeight = 500;

let tooltipWidth = 30;
let tooltipHeight = 20;

function BarChart(data) {
  this.data = data;
  this.query = null;
  this.selectedData = {};
  this.filteredData = [];

  this.initChart = initChart;
  this.setQuery = setQuery;
  this.updateMenu = updateMenu;
  this.updateChart = updateChart;
  this.clearChart = clearChart;

  this.addSelectedData = addSelectedData;
  this.removeSelectedData = removeSelectedData;
}

function initChart() {
  grid = d3.select("div#content")
    .append("div")
    .attr("id", "grid")
    .attr("class", "ui grid");

  let row = grid;
  // let row = grid.append("div")
  //  .attr("class", "centered row");

  row.append("div")
    .attr("class", "one wide column");

  leftMenu = row
    .append("div")
    .attr("id", "leftMenu")
    .attr("class", "left aligned four wide column");

  barChart = row
    .append("div")
    .attr("id", "barChart")
    .attr("class", "ten wide column");

  header = barChart.append("div")
    .attr("class", "centered row");
  header.append("h2")
    .attr("id", "headerText");

  let svgCell = barChart.append("div")
    .attr("class", "row");
  svg = svgCell
    .append("svg")
    .attr("width", "auto")
    // .attr("height", "auto")
    .attr("viewBox", [0, 0, svgWidth, svgHeight]);

/*
  svg.append("rect")
    .attr("id", "barChartBackground")
    .attr("x", 0)
    .attr("y", 0)
    .attr("rx", 10)
    .attr("ry", 10)
    .attr("width", svgWidth)
    .attr("height", svgHeight);
*/

  axis = svg
    .append("g")
    .attr("id", "axisLabels")

  bars = svg.append("g")
    .attr("id", "bars");

  tooltip = svg.append("g")
    .attr("class", "tooltip")
    .attr("visibility", "hidden");

  tooltip.append("rect")
    .attr("width", tooltipWidth)
    .attr("height", tooltipHeight)
    .attr("rx", 4)
    .attr("ry", 4);

  tooltip.append("text")
    .attr("x", tooltipWidth / 2.0)
    .attr("y", tooltipWidth / 2.0)
    .attr("width", tooltipWidth)
    .attr("height", tooltipHeight);

  termList = leftMenu.append("div")
    .attr("class", "ui form");
  termList = termList.append("div")
    .attr("class", "grouped fields");
  termList.append("label").text("Course Terms");

  navBar.addYearSliderCallback(yearUpdated(this));
}

function setQuery(q) {
  this.query = q;

  this.filteredData = this.data
    .filter(d => d["Year"] >= this.query.startYear)
    .filter(d => d["Year"] <= this.query.endYear)
    .filter(d => d["Subject"] === this.query.subject)
    .filter(d => d["Number"] === +this.query.number)
    .filter(d => d["Course Title"] === this.query.title);

  this.filteredData = this.filteredData.sort(sortFilteredData);

  color = d3.scaleOrdinal()
    .domain(this.filteredData.map(d => d["ID"]))
    .range(d3.quantize(d3.interpolateSpectral, this.filteredData.length))
    .unknown("#ccc");

  this.selectedData = this.filteredData;

  this.updateMenu();
  this.updateChart();
}

function updateMenu() {
  termList.selectAll("div").remove();

  let items = termList.selectAll("div")
    .data(this.filteredData)
    .join(
    enter => {
      let div = enter.append("div")
        .attr("class", "field")
        .attr("id", d => d["ID"]);
      let check = div.append("button")
        .attr("class", "ui slider checkbox")
        .attr("id", d => d["ID"]);
        // .style("background", (d, i) => "linear-gradient(90deg, " + color(d["ID"]) + " 0%, rgba(255,255,255,1) 75%)");
      check.append("input")
        .attr("type", "checkbox");
      check.append("label")
        .attr("class", "itemLabel")
        .text(d => d["Year"] + " " + d["Term"] + " - " + d["Primary Instructor"]);
    }
  );

  this.filteredData.forEach(d => {
    let checkbox = $("#" + d["ID"] + ".checkbox");
    checkbox.checkbox("check");
    checkbox.checkbox({
      onChecked: termChecked(this, d),
      onUnchecked: termUnchecked(this, d)
    });
  });
}

function pivot(data) {
  const pivotData = Globals.grades.map(g => {
    const row = {};
    row["Grade"] = g;
    return row;
  });

  data.forEach(fd => {
    Globals.grades.forEach(g => {
      pivotData.find((pd, i) => {
        if (pd["Grade"] === g) {
          const item = pivotData[i];
          if (!("Total" in item)) item["Total"] = 0;
          item[fd["ID"]] = fd[g];
          item["Total"] += fd[g];
          pivotData[i] = item;
          return true;
        }
      });
    });
  });

  return pivotData;
}

function updateChart() {
  d3.select("#headerText")
    .text(this.query.subject + this.query.number + ": " + this.query.title);

  let chartData = this.selectedData.sort(sortSelectionData);
  let pivotData = pivot(chartData);

  // transpose the data into layers
  let seriesData = d3.stack()
    .keys(chartData.map(d => d["ID"]))
    (pivotData)
    .map(d => (d.forEach(v => v.key = d.key), d));

  // console.log(chartData);
  // console.log(seriesData);

  // set the ranges
  let maxTotal = d3.max(pivotData, d => d["Total"]);

  let x = d3.scaleBand()
    .domain(Globals.grades)
    .range([margin.left, svgWidth - margin.right])
    .padding(0.20);

  let y = d3.scaleLinear()
    .domain([0, maxTotal * 1.05])
    .range([svgHeight - margin.bottom, margin.top])

  let xAxis = g => g
    .attr("id", "xAxis")
    .attr("transform", `translate(0, ${ svgHeight - margin.bottom })`)
    .call(d3.axisBottom(x).tickSizeOuter(0));

  let yAxis = g => g
    .attr("id", "yAxis")
    .attr("transform", "translate(0, 0)")
    .call(d3.axisRight(y).ticks(null, "s").tickSize(svgWidth))
    .call(g => g.selectAll(".tick:not(:first-of-type) line")
      .attr("stroke-opacity", 0.55)
      .attr("stroke-dasharray", "2, 2"))
    .call(g => g.selectAll(".tick text")
      .attr("x", 0)
      .attr("dy", -4))
    .call(g => g.select(".domain")
      .remove());

  // add the x Axis
  axis.append("g")
    .call(xAxis);

  // add the y Axis
  axis.select("#yAxis").remove();
  axis.append("g")
    .call(yAxis);

  // draw the chart
  let subBarGroup = bars.selectAll("g")
    .data(seriesData)
    .join("g")
      .attr("fill", d => color(d.key))
    .on("mouseover", () => {
      tooltip.attr("visibility", "visible");
    })
    .on("mouseout", () => {
      tooltip.attr("visibility", "hidden");
    });

  subBarGroup.selectAll("rect")
    .data(d => d)
    .join("rect")
      .attr("x", (d, i) => x(d.data.Grade))
      .attr("y", d => y(d[1]))
      .attr("height", d => y(d[0]) - y(d[1]))
      .attr("width", x.bandwidth())
      .on("mouseover", d => {
        let xPosition = x(d.data.Grade);
        let yPosition = y(d[1]) + y(d[0]) - y(d[1]) - tooltipHeight;
        tooltip.attr("transform", "translate(" + xPosition + "," + yPosition + ")");
        tooltip.select("text").text(d[1] - d[0]);
      });
}

function clearChart() {
  $('div#content')
    .transition('fade left');
  d3.select("div#content").selectAll("*").remove();
}

function termChecked(parent, data) {
  return function() {
    parent.addSelectedData(data["ID"]);
    parent.updateChart();
  }
}

function termUnchecked(parent, data) {
  return function() {
    parent.removeSelectedData(data["ID"]);
    parent.updateChart();
  }
}

function sortSelectionData(a, b) {
  return (a["ID"] < b["ID"]) ? 1 : -1;
}

function sortFilteredData(a, b) {
  return (a["ID"] > b["ID"]) ? 1 : -1;
}

function addSelectedData(id) {
  const item = this.selectedData.find(d => d["ID"] === id);
  if (!item) {
    this.selectedData.push(this.data[id]);
  }
}

function removeSelectedData(id) {
  const item = this.selectedData.find(d => d["ID"] === id);
  if (item) {
    const index = this.selectedData.indexOf(item);
    if (index  > -1) this.selectedData.splice(index, 1);
  }
}

function yearUpdated(parent) {
  return function(val, start, end) {
    let query = parent.query;
    query.startYear = start;
    query.endYear = end;
    parent.setQuery(query);
  }
}

export { BarChart };
