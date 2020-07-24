import { initMenu, clearMenu, setCallback } from "./menu.js";
import { initChart, clearChart, showChart } from "./barchart.js";
import { grades, classLevels, gpaDataFile, subjectDataFile, Query } from "./globals.js";

const terms = {};
const subjects = {};
const courses = {};

let rawData = null;
let courseList = [];
let subjectKeys = [];

// set the dimensions and margins of the graph
var maxRadius = 40.0;
var xLabelPad = 5.0;
var xLabelHeight = 30.0;
var yLabelWidth = 60.0;
var yLabelPad = 5.0;

var margin = {
  top: maxRadius + xLabelHeight,
  right: maxRadius,
  bottom: maxRadius,
  left: maxRadius + yLabelWidth
};

var width = 1200 - margin.left - margin.right;
var height = 1500 - margin.top - margin.bottom;

// set the ranges
var x = d3.scaleLinear()
  .range([0, width])
  .domain([100, 600]);

var y = d3.scaleBand()
  .range([0, height]);

var r = d3.scaleLinear()
  .range([maxRadius / 10.0, maxRadius])

var cellHeight = maxRadius * 2.0;
var cellWidth = x(classLevels[1]);

// grab all the svg elements
const diagram = d3.select("svg")
diagram
  .attr("width", width + margin.left + margin.right)
  .attr("height", height + margin.top + margin.bottom);

const grid = d3.select("#grid")
  .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

const cellsPassive = d3.select("#cellsPassive")
  .attr("transform", "translate(" + margin.left + "," + xLabelHeight + ")");

const mainBody = d3.select("#mainBody")
  .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

const cellsActive = d3.select("#cellsActive")
  .attr("transform", "translate(" + margin.left + "," + xLabelHeight + ")");

const labels = d3.select("#labels")
  .attr("transform", "translate(" + 0 + "," + 0 + ")");

const circles = d3.select("#mainBody").select("#circles");
const debugText = d3.select("#debug");

let currentCellSelection = "";

classLevels.forEach(function(level, index) {
  grid.append("line")
    .attr("class", "xLine")
    .attr("x1", x(level))
    .attr("y1", -maxRadius)
    .attr("x2", x(level))
    .attr("y2", height);
});

d3.csv(subjectDataFile).then(function(data) {
  data.forEach(function(d) {
    subjects[d["Subject"]] = d["Title"];
  });

  // set subject scale
  subjectKeys = Object.keys(subjects);
  y.domain(subjectKeys);

  subjectKeys.forEach(function(subject, i) {
    classLevels.forEach(function (level, j) {
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

let testList = [];
let testString = "";
let testObject = Object.create(null);
let testInt = 0;
let maxTotal = 0;

d3.csv(gpaDataFile).then(function(data) {
  data.forEach(function(d) {
    d["Number"] = +d["Number"];
    d["Year"] = +d["Year"];

    grades.forEach(function(grade) {
      d[grade] = + d[grade];
    });

    if (!(d["YearTerm"] in terms)) {
      terms[d["YearTerm"]] = {"Year": d["Year"], "Term": d["Term"]};
    }

    if (d["Year"] === 2018) {
      const key = d["Subject"] + ":" + d["Number"].toString() + ":" + d["Course Title"];

      let total = 0;
      grades.forEach(function(grade) {
        total += d[grade];
      });

      if (key in courses) {
        courses[key]["Total"] += total;
        total = courses[key]["Total"];
      }
      else {
        courses[key] =
          {"Subject": d["Subject"], "Number": d["Number"], "Title": d["Course Title"], "Total": total};
      }

      if (d["Subject"] in subjects) maxTotal = (total > maxTotal) ? total : maxTotal;
    }
  });

  rawData = data;
  courseList = Object.values(courses);
  initChart(data);

  // set subject scale
  r.domain([0, maxTotal]);

  // add the circles to the chart
  circles.selectAll(".course")
    .data(courseList)
    .enter()
    .filter(function(d) { return d["Subject"] in subjects })
    .append("circle")
    .attr("class", "course")
    .attr("id", function(d) { return d["Subject"] + d["Number"] })
    .attr("cx", function(d) { return x(parseInt(d["Number"])); })
    .attr("cy", function(d) { return y(d["Subject"]); })
    .attr("r", function(d) { return r(d["Total"]); });
});

function showBarChart(query) {
  showChart(query);
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
    clearMenu();
    return;
  }
  else if (currentCellSelection) {
    let currentCellPassive = d3.select("g#cellsPassive").select("rect#" + currentCellSelection + ".cell.passive");
    currentCellPassive.attr("class", "cell passive");
  }

  cellPassive.attr("class", "cell passive click");
  setCallback(showBarChart);
  initMenu(cellPassive, courseList, mainBody.attr("transform"));

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
