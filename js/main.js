import { Menu } from "./menu.js";
import { BarChart } from "./barchart.js";
import Globals from "./globals.js";
import navBar from "./navbar.js";

const years = [];
const terms = {};
const subjects = {};

let rawData = null;
let filteredData = null;
let courses = {};
let courseList = [];

// set the dimensions and margins of the graph
var maxRadius = 40.0;
var xLabelPad = 5.0;
var xLabelHeight = 30.0;
var yLabelWidth = 60.0;
var yLabelPad = 5.0;

var margin = {
  top: maxRadius + xLabelHeight,
  right: 20.0,
  bottom: 20.0,
  left: maxRadius + yLabelWidth
};

var width = 1100 - margin.left - margin.right;
var height = 1500 - margin.top - margin.bottom;

let startYear = 2014;
let endYear = 2015;

let maxTotal = 0;
let minTotal = 20;

// set the ranges
var x = d3.scaleLinear()
  .range([0, width])
  .domain([100, 600]);

var y = d3.scaleBand()
  .range([0, height]);

var r = d3.scaleLog()
  .base(10)
  .range([2, maxRadius])

var cellHeight = maxRadius * 2.0;
var cellWidth = x(Globals.classLevels[1]);

const content = d3.select("div#content");
const debugText = d3.select("div#debug");

const chart = content.append("svg")
    .attr("width", width + margin.left + margin.right)
    .attr("height", height + margin.top + margin.bottom);

const cellsPassive = chart.append("g")
  .attr("id", "cellsPassive")
  .attr("transform", "translate(" + margin.left + "," + xLabelHeight + ")");

const grid = chart.append("g")
  .attr("id", "grid")
  .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

const body = chart.append("g")
  .attr("id", "body")
  .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

const circles = body.append("g")
  .attr("id", "circles")

const cellsActive = chart.append("g")
  .attr("id", "cellsActive")
  .attr("transform", "translate(" + margin.left + "," + xLabelHeight + ")");

const labels = chart.append("g")
  .attr("id", "labels")
  .attr("transform", "translate(" + 0 + "," + 0 + ")");

const menu = new Menu(chart, showBarChart);
let barChart = null;

let currentCellSelection = "";

Globals.classLevels.forEach(function(level, index) {
  grid.append("line")
    .attr("class", "xLine")
    .attr("x1", x(level))
    .attr("y1", -maxRadius)
    .attr("x2", x(level))
    .attr("y2", height);
});

d3.csv(Globals.subjectDataFile).then(function(data) {
  let subjectKeys = [];

  data.forEach(function(d) {
    subjects[d["Subject"]] = d["Title"];
  });

  // set subject scale
  subjectKeys = Object.keys(subjects);
  y.domain(subjectKeys);

  subjectKeys.forEach(function(subject, i) {
    Globals.classLevels.forEach(function (level, j) {
      cellsPassive.append("rect")
        .attr("id", subject + level.toString())
        .attr("data-subject", subject)
        .attr("data-level", level)
        .attr("class", "cell passive")
        .attr("x", x(level))
        .attr("y", y(subject))
        .attr("width", cellWidth)
        .attr("height", cellHeight);

      cellsActive.append("rect")
        .attr("id", subject + level.toString())
        .attr("class", "cell active")
        .attr("x", x(level))
        .attr("y", y(subject))
        .attr("width", cellWidth)
        .attr("height", cellHeight)
        .on("mouseover", handleMouseOver)
        .on("mouseout", handleMouseOut)
        .on("click", handleClick);
    });
  });

  labels.selectAll(".yLabel")
    .data(data)
    .enter().append("text")
      .text(function(d) { return d["Subject"]; })
      .attr("class", "yLabel subject")
      .attr("x", yLabelWidth - yLabelPad)
      .attr("y", function(d) { return y(d["Subject"]) + margin.top; });

  grid.selectAll(".yLine")
    .data(data)
    .enter().append("line")
      .attr("class", "yLine")
      .attr("x1", -maxRadius)
      .attr("y1", function(d) { return y(d["Subject"]) })
      .attr("x2", width + maxRadius)
      .attr("y2", function(d) { return y(d["Subject"]) })
});

d3.csv(Globals.gpaDataFile).then(function(data) {
  let i = 0;
  data.forEach(function(d) {
    d["ID"] = i++;
    d["Number"] = +d["Number"];
    d["Year"] = +d["Year"];

    if(!years.includes(d["Year"])) years.push(d["Year"]);

    Globals.grades.forEach(function(grade) {
      d[grade] = +d[grade];
    });

    if (!(d["YearTerm"] in terms)) {
      terms[d["YearTerm"]] = {"Year": d["Year"], "Term": d["Term"]};
    }

    d["Total"] = d3.sum(Globals.grades, g => d[g]);
  });

  years.sort();
  rawData = data;
  barChart = new BarChart(data);

  navBar.initNavBar(years);
  navBar.addYearSliderCallback(yearUpdated);

  updateData();
  drawCourses();
});

function yearUpdated(val, start, end) {
  startYear = start;
  endYear = end;
  updateData();
  drawCourses();
}

function updateData() {
  filteredData = rawData
    .filter(d => d["Year"] >= startYear)
    .filter(d => d["Year"] <= endYear)
    .filter(d => d["Subject"] in subjects);

  courses = [];
  filteredData.forEach(function(d) {
    const key = d["Subject"] + ":" + d["Number"].toString() + ":" + d["Course Title"];
    let total = d["Total"];

    if (key in courses) {
      courses[key]["Total"] += total;
      total = courses[key]["Total"];
    } else {
      courses[key] =
        {"Subject": d["Subject"], "Number": d["Number"], "Title": d["Course Title"], "Total": total};
    }

    maxTotal = (total > maxTotal) ? total : maxTotal;
    minTotal = (total < minTotal) ? total : minTotal;
  });
}

function drawCourses() {
  courseList = Object.values(courses);

  // set subject scale
  r.domain([minTotal, maxTotal]);

  // add the circles to the chart
  circles.selectAll(".course").remove();
  circles.selectAll(".course")
    .data(courseList)
    .enter()
    .append("circle")
    .attr("class", "course")
    .attr("id", function(d) { return d["Subject"] + d["Number"] })
    .attr("cx", function(d) { return x(d["Number"]); })
    .attr("cy", function(d) { return y(d["Subject"]); })
    .attr("r", function(d) { return r(d["Total"]) });
}

function showBarChart(query) {
  query.startYear = startYear;
  query.endYear = endYear;

  d3.select("div#content").selectAll("*").remove();
  debugText.selectAll("*").remove();
  barChart.initChart();
  barChart.setQuery(query);
}

function handleMouseOver() {
  let cellPassive = d3.select("g#cellsPassive").select("rect#" + this.id + ".cell.passive");
  if (!cellPassive.attr("class").includes("click")) {
    cellPassive.attr("class", "cell passive over");
  }
}

function handleMouseOut() {
  let cellPassive = d3.select("g#cellsPassive").select("rect#" + this.id + ".cell.passive");
  if (!cellPassive.attr("class").includes("click")) {
    cellPassive.attr("class", "cell passive");
  }
}

function handleClick() {
  let cellPassive = d3.select("g#cellsPassive").select("rect#" + this.id + ".cell.passive");

  if (currentCellSelection && (currentCellSelection === this.id)) {
    cellPassive.attr("class", "cell passive");
    currentCellSelection = "";
    menu.clear();
    return;
  }
  else if (currentCellSelection) {
    let currentCellPassive = d3.select("g#cellsPassive").select("rect#" + currentCellSelection + ".cell.passive");
    currentCellPassive.attr("class", "cell passive");
  }

  cellPassive.attr("class", "cell passive click");
  menu.init(cellPassive, courseList, body.attr("transform"));

  let subject = cellPassive.attr("data-subject");
  let level = +cellPassive.attr("data-level");

  debugText.selectAll(".debug").remove();
  debugText.selectAll(".debug")
    .data(courseList)
    .enter()
    .filter(function(d) { return d["Subject"] === subject })
    .filter(function(d) { return (d["Number"] >= level) && (d["Number"] <= level + 99) })
    .append("p")
      .attr("class", "debug")
      .text(writeDebug);

  currentCellSelection = this.id;
}

function writeDebug(d) {
  let propValue = "";
  let propString = "";
  for(let propName in d) {
    propValue = d[propName]
    propString += propName + " - " + propValue + " "
  }
  propString += " \n"
  return propString;
}
