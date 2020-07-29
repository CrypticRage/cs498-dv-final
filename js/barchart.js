import Globals, { Query } from "./globals.js";
import navBar from "./navbar.js";

let baseMargin = 30;

let margin = {
  top: baseMargin,
  right: baseMargin,
  bottom: baseMargin,
  left: baseMargin
};

let grid = null;
let leftMenu = null;
let termList = null;
let barChart = null;
let svg = null;
let bars = null;
let tooltip = null;
let header = null;

let svgWidth = 800;
let svgHeight = 500;

let tooltipWidth = 30;
let tooltipHeight = 25;

let chartWidth = svgWidth - margin.left - margin.right;
let chartHeight = svgHeight - margin.top - margin.bottom;

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
    .attr("class", "ui middle aligned sixteen column grid");

  header = grid.append("div")
    .attr("class", "centered row");
  header.append("h2")
    .attr("id", "headerText");

  leftMenu = grid
    .append("div")
    .attr("id", "leftMenu")
    .attr("class", "left aligned five wide column");

  barChart = grid
    .append("div")
    .attr("id", "barChart")
    .attr("class", "left aligned eleven wide column");

  svg = barChart
    .append("svg")
    .attr("transform", "translate(0, 0)")
    .attr("width", svgWidth)
    .attr("height", svgHeight);

  svg.append("rect")
    .attr("id", "barChartBackground")
    .attr("x", 0)
    .attr("y", 0)
    .attr("rx", 10)
    .attr("ry", 10)
    .attr("width", svgWidth)
    .attr("height", svgHeight);

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
    .attr("y", tooltipWidth / 2.0);

  termList = leftMenu.append("div")
    .attr("class", "ui list");

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

  this.filteredData.sort((a, b) => (a["ID"] > b["ID"]) ? 1 : -1);

  this.selectedData = this.filteredData;
  console.log(this.selectedData);

  this.updateMenu();
  this.updateChart();
}

function updateMenu() {
  let items = termList.selectAll("div");
  items
    .data(this.filteredData)
    .join(
    enter => {
      let div = enter.append("div")
        .attr("class", "item")
        .attr("id", d => d["ID"]);
      let check = div.append("button")
        .attr("class", "ui toggle checkbox")
        .attr("id", d => d["ID"]);
      check.append("input")
        .attr("type", "checkbox")
      check.append("label")
        .attr("class", "itemLabel")
        .text(d => d["ID"] + ":" + d["Year"] + " " + d["Term"] + ": " + d["Primary Instructor"]);
    },
    update => {
      update.attr("id", d => d["ID"]);
      update.select("button.checkbox").select("label.itemLabel")
        .text(d => d["ID"] + ":" + d["Year"] + " " + d["Term"] + ": " + d["Primary Instructor"]);
    },
    exit => {
      exit.remove();
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

  let chartData = this.selectedData;
  let pivotData = pivot(chartData);

  // transpose the data into layers
  let seriesData = d3.stack()
    .keys(chartData.map(d => d["ID"]))
    (pivotData)
    .map(d => (d.forEach(v => v.key = d.key), d));

  // console.log(seriesData);

  // set the ranges
  let maxTotal = d3.max(pivotData, d => d["Total"]);

  let x = d3.scaleBand()
    .domain(Globals.grades)
    .range([0, chartWidth])
    .padding(0.1);

  let y = d3.scaleLinear()
    .domain([0, maxTotal * 1.05])
    .range([chartHeight, 0])

  // https://observablehq.com/@d3/working-with-color
  let color = d3.scaleOrdinal()
    .domain(seriesData.map(d => d.key))
    .range(d3.quantize(d3.interpolateSpectral, seriesData.length))
    .unknown("#ccc");

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
        let xPosition = x(d.data.Grade) + x.bandwidth() / 2.0;
        let yPosition = y(d[1]) + ((y(d[0]) - y(d[1])) / 2.0) - tooltipHeight;
        tooltip.attr("transform", "translate(" + xPosition + "," + yPosition + ")");
        tooltip.select("text").text(d[1] - d[0]);
      });

  /*
  // add the x Axis
  svg.append("g")
    .attr("transform", "translate(" + margin.left + ", " + (chartHeight + margin.top) + ")")
    .call(d3.axisBottom(x));

  // add the y Axis
  svg.append("g")
    .attr("transform", "translate(" + margin.left + ", " + margin.top + ")")
    .call(d3.axisLeft(y));

   */
}

function clearChart() {

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

function addSelectedData(id) {
  const item = this.selectedData.find(d => d["ID"] === id);
  if (!item) this.selectedData.push(this.data[id]);
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
