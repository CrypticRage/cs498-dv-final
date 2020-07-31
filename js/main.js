import Globals from "./globals.js";
import Singleton from "./singleton.js";

import { Menu } from "./menu.js";
import { BarChart } from "./barchart.js";

// DOM references
let content = null;
let svg = null;
let cellsPassive = null;
let body = null
let grid = null;
let circles = null;
let cellsActive = null;
let labels = null;
let debugText = null;

// dimensions and constants
let maxRadius = 40.0;
let xLabelPad = 5.0;
let xLabelHeight = 30.0;
let yLabelWidth = 60.0;
let yLabelPad = 5.0;

const margin = {
  top: maxRadius + xLabelHeight,
  right: 20.0,
  bottom: 20.0,
  left: maxRadius + yLabelWidth
};

const width = 1100 - margin.left - margin.right;
const height = 1500 - margin.top - margin.bottom;

// data vars
const years = [];
let rawSubjectData = null;
const subjects = {};
let subjectKeys = [];

let courseData = [];
let courses = {};
let courseList = [];

let filteredData = null;

let barChart = null;
let menu = null;

let x = null;
let y = null;
let r = null;

let maxTotal = 1;
let minTotal = 1;
let currentCellSelection = "";

d3.csv(Globals.subjectDataFile).then(initSubjectData);

function initSubjectData(data) {
  rawSubjectData = data;
  data.forEach(d => {
    subjects[d["Subject"]] = d["Title"];
  });
  subjectKeys = Object.keys(subjects);

  d3.csv(Globals.courseDataFile).then(initCourseData);
}

function initCourseData(data) {
  let i = 0;
  data.forEach(d => {
    d["ID"] = i;
    d["Number"] = +d["Number"];
    d["Year"] = +d["Year"];

    if (!years.includes(d["Year"])) years.push(d["Year"]);

    Globals.grades.forEach(g => {
      d[g] = +d[g];
    });

    d["Total"] = d3.sum(Globals.grades, g => d[g]);

    courseData.push(data[i++]);
  });

  years.sort();
  initCourseChart();
}

function initCourseChart() {
  Singleton.initNavBar();
  Singleton.setYears(years);
  Singleton.addYearSliderCallback(setYears);
  Singleton.setShowCallback(showChart);

  barChart = new BarChart(courseData);

  showChart();
}

function showChart() {
  initChart();
  updateCourses();
  drawChart();
}

function initChart() {
  content = d3.select("div#content");
  debugText = d3.select("div#debug");

  svg = content.append("svg")
    .attr("width", width + margin.left + margin.right)
    .attr("height", height + margin.top + margin.bottom);

  cellsPassive = svg.append("g")
    .attr("id", "cellsPassive")
    .attr("transform", "translate(" + margin.left + "," + xLabelHeight + ")");

  grid = svg.append("g")
    .attr("id", "grid")
    .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

  body = svg.append("g")
    .attr("id", "body")
    .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

  circles = body.append("g")
    .attr("id", "circles")

  cellsActive = svg.append("g")
    .attr("id", "cellsActive")
    .attr("transform", "translate(" + margin.left + "," + xLabelHeight + ")");

  labels = svg.append("g")
    .attr("id", "labels")
    .attr("transform", "translate(" + 0 + "," + 0 + ")");

  menu = new Menu(svg);
  menu.setClickCallback(showBarChart);

  x = d3.scaleLinear()
    .range([0, width])
    .domain([100, 600]);

  y = d3.scaleBand()
    .range([0, height])
    .domain(subjectKeys);
}

function setYears() {
  updateCourses();
  drawCourses();
}

function updateCourses() {
  subjectKeys = Object.keys(subjects);

  filteredData = courseData
    .filter(d => d["Year"] >= Singleton.startYear())
    .filter(d => d["Year"] <= Singleton.endYear())
    .filter(d => d["Subject"] in subjects);

  courses = {};
  filteredData.forEach(d => {
    const key = d["Subject"] + ":" + d["Number"].toString() + ":" + d["Course Title"];
    let total = d["Total"];

    if (key in courses) {
      courses[key]["Total"] += total;
      total = courses[key]["Total"];
    } else {
      courses[key] =
        {"Subject": d["Subject"], "Number": d["Number"], "Title": d["Course Title"], "Total": total};
    }
  });

  courseList = Object.values(courses);
  maxTotal = d3.max(courseList, d => d["Total"]);
  minTotal = d3.min(courseList, d => d["Total"]);

  // set the radius range
  r = d3.scaleLog()
    .base(10)
    .range([2, maxRadius])
    .domain([minTotal, maxTotal]);
}

function drawChart() {
  let cellHeight = maxRadius * 2.0;
  let cellWidth = x(Globals.classLevels[1]);

  Globals.classLevels.forEach(function(level, index) {
    grid.append("line")
      .attr("class", "xLine")
      .attr("x1", x(level))
      .attr("y1", -maxRadius)
      .attr("x2", x(level))
      .attr("y2", height);
  });

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
    .data(rawSubjectData)
    .enter().append("text")
    .text(function(d) { return d["Subject"]; })
    .attr("class", "yLabel subject")
    .attr("x", yLabelWidth - yLabelPad)
    .attr("y", function(d) { return y(d["Subject"]) + margin.top; });

  grid.selectAll(".yLine")
    .data(rawSubjectData)
    .enter().append("line")
    .attr("class", "yLine")
    .attr("x1", -maxRadius)
    .attr("y1", function(d) { return y(d["Subject"]) })
    .attr("x2", width + maxRadius)
    .attr("y2", function(d) { return y(d["Subject"]) });

  drawCourses();
}

function drawCourses() {
  // update the circles for each course in the chart
  circles.selectAll(".course").remove();
  circles.selectAll(".course")
    .data(courseList)
    .enter()
    .append("circle")
    .attr("class", "course")
    .attr("id", d => { return d["Subject"] + d["Number"] })
    .attr("cx", d => { return x(d["Number"]); })
    .attr("cy", d => { return y(d["Subject"]); })
    .attr("r", d => { return r(d["Total"]) });
}

function showBarChart(query) {
  /*
  $('div#content')
    .transition({
      animation: 'fade right',
      duration: '500ms',
      onComplete: () => {
        d3.select("div#content").selectAll("*").remove();
        debugText.selectAll("*").remove();
        barChart.initChart();
        barChart.setQuery(query);
      }
    });
   */

  d3.select("div#content").selectAll("*").remove();
  debugText.selectAll("*").remove();
  barChart.initChart();
  barChart.setQuery(query);
  barChart.updatePage();
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
