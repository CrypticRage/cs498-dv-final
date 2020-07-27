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

let svgWidth = 800;
let svgHeight = 500;

let chartWidth = svgWidth - margin.left - margin.right;
let chartHeight = svgHeight - margin.top - margin.bottom;

// set the ranges
let x = d3.scaleBand()
  .range([0, chartWidth])
  .padding(0.1);

let y = d3.scaleLinear()
  .range([chartHeight, 0]);

function BarChart(d) {
  this.data = d;
  this.query = null;

  this.initChart = initChart;
  this.showMenu = showMenu;
  this.showChart = showChart;
  this.clearChart = clearChart;
  this.yearUpdated = yearUpdated;
}

function yearUpdated(parent) {
  return function(val, start, end) {
    let query = parent.query;
    query.startYear = start;
    query.endYear = end;

    let filteredData = parent.data
      .filter(d => d["Year"] >= query.startYear)
      .filter(d => d["Year"] <= query.endYear)
      .filter(d => d["Subject"] === query.subject)
      .filter(d => d["Number"] === +query.number)
      .filter(d => d["Course Title"] === query.title);

    parent.showMenu(filteredData);
  }
}

function initChart() {
  grid = d3.select("div#content")
    .append("div")
    .attr("id", "grid")
    .attr("class", "ui middle aligned sixteen column grid");

  leftMenu = grid
    .append("div")
    .attr("id", "leftMenu")
    .attr("class", "right aligned three wide column");

  barChart = grid
    .append("div")
    .attr("id", "barChart")
    .attr("class", "left aligned thirteen wide column");

  svg = barChart
    .append("svg")
    .attr("transform", "translate(0, 0)")
    .attr("width", svgWidth)
    .attr("height", svgHeight);

  termList = leftMenu.append("div")
    .attr("class", "ui list");

  navBar.addYearSliderCallback(yearUpdated(this));
}

function showMenu(filteredData) {
  termList.selectAll("*").remove();

  let items = termList.selectAll("div")
    .data(filteredData)
    .enter()
    .append("div")
    .attr("class", "item");

  let checks = items
    .append("button")
    .attr("class", "ui toggle checkbox")
    .attr("width", 100);

  checks.append("input")
    .attr("type", "checkbox")
    .attr("name", "public");

  checks.append("label")
    .attr("type", "checkbox")
    .text(d => d["Year"] + " " + d["Term"]);
}

function showChart(q) {
  this.query = q;

  let filteredData = this.data
    .filter(d => d["Year"] >= this.query.startYear)
    .filter(d => d["Year"] <= this.query.endYear)
    .filter(d => d["Subject"] === this.query.subject)
    .filter(d => d["Number"] === +this.query.number)
    .filter(d => d["Course Title"] === this.query.title);

  showMenu(filteredData);
  let testData = filteredData[0];

  // https://stackoverflow.com/questions/38750705/filter-object-properties-by-key-in-es6
  const filteredObject = Object
    .keys(testData)
    .filter(key => Globals.grades.includes(key));

  let maxCount = 0;
  let filteredArray = [];
  filteredObject.forEach(key => {
      let obj = {};
      obj["Grade"] = key;
      obj["Count"] = testData[key];
      maxCount = testData[key] > maxCount ? testData[key] : maxCount;
      filteredArray.push(obj);
    }
  );

  console.log("filteredData");
  console.log(filteredData);

  svg.append("rect")
    .attr("class", "barChartBackground")
    .attr("x", 0)
    .attr("y", 0)
    .attr("rx", 10)
    .attr("ry", 10)
    .attr("width", svgWidth)
    .attr("height", svgHeight)

  // scale the range of the data in the domains
  x.domain(Globals.grades);
  y.domain([0, maxCount * 1.05]);

  console.log(maxCount);

  const bars = d3.select("svg")
    .append("g")
    .attr("id", "bars")
    .attr("transform", "translate(" + margin.left + ", " + margin.top + ")");

  // append the rectangles for the bar chart
  bars.selectAll(".bar")
    .data(filteredArray)
    .enter()
    .append("rect")
      .attr("class", "bar")
      .attr("x", function(d) { return x(d["Grade"]); })
      .attr("width", x.bandwidth())
      .attr("y", function(d) { return y(d["Count"]); })
      .attr("height", function(d) { return chartHeight - y(d["Count"]); })
      .attr("rx", 3)
      .attr("ry", 3);

  // add the x Axis
  svg.append("g")
    .attr("transform", "translate(" + margin.left + ", " + (chartHeight + margin.top) + ")")
    .call(d3.axisBottom(x));

  // add the y Axis
  svg.append("g")
    .attr("transform", "translate(" + margin.left + ", " + margin.top + ")")
    .call(d3.axisLeft(y));
}

function clearChart() {

}

export { BarChart };
