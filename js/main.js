import Globals from "./globals.js";
import Singleton from "./singleton.js";

import { Menu } from "./menu.js";
import { BarChart } from "./barchart.js";

// DOM references
let content = null;
let svg = null;
let cellsPassive = null;
let grid = null;
let lines = null;
let circles = null;
let cellsActive = null;
let labels = null;
let debugText = null;
let legend = null;

// dimensions and constants
let minRadius = 2.0;
let maxRadius = 40.0;
let xLabelPad = 5.0;
let xLabelHeight = 25.0;
let yLabelPad = 5.0;
let yLabelWidth = 45.0;

let legendLabelWidth = 10;
let legendPad = 25;

const margin = {
  top: maxRadius + xLabelHeight + xLabelPad,
  left: maxRadius + yLabelWidth + yLabelPad,
  right: maxRadius,
  bottom: maxRadius
};

const width = 1200;
const height = 1300;
const legendHeight = 2 * maxRadius + 2 * legendPad;

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
  menu = new Menu(courseData);
  menu.setClickCallback(showBarChart);

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

  let layoutGrid = d3.select("div#content")
    .append("div")
    .attr("id", "grid")
    .attr("class", "ui grid");

  layoutGrid.append("div")
    .attr("id", "leftPad")
    .attr("class", "one wide column");

  let svgCell = layoutGrid.append("div")
    .attr("id", "svgCell")
    .attr("class", "fourteen wide column");

  layoutGrid.append("div")
    .attr("id", "rightPad")
    .attr("class", "one wide column");

  legend = svgCell.append("svg")
    .attr("viewBox", [0, 0, width, legendHeight])
    .attr("id", "legend");

  svg = svgCell.append("svg")
    .attr("viewBox", [0, 0, width, height]);

  cellsPassive = svg.append("g")
    .attr("id", "cellsPassive")
    .attr("transform", "translate(" + margin.left + "," + (margin.top - maxRadius) + ")");

  labels = svg.append("g")
    .attr("id", "labels")
    .attr("transform", "translate(" + 0 + "," + 0 + ")");

  grid = svg.append("g")
    .attr("id", "svgGrid")
    .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

  lines = grid.append("g")
    .attr("id", "lines");

  circles = grid.append("g")
    .attr("id", "circles");

  cellsActive = svg.append("g")
    .attr("id", "cellsActive")
    .attr("transform", "translate(" + margin.left + "," + (margin.top - maxRadius) + ")");

  menu.setParent(svg);

  x = d3.scaleLinear()
    .range([0, width - margin.right - margin.left])
    .domain([100, 600]);

  y = d3.scaleBand()
    .range([0, height - margin.top - margin.bottom])
    .domain(subjectKeys);
}

function setYears() {
  updateCourses();
  drawCourses();
}

function revR(iVal) {
  let iRange = maxRadius - minRadius;
  let oMin = Math.log10(minTotal);
  let oMax = Math.log10(maxTotal);
  let oRange = oMax - oMin;

  let oVal = ((iVal - minRadius) / iRange) * oRange + oMin;
  oVal = Math.pow(10, oVal);
  return oVal;
}

function drawAnnotations() {
  let group = legend.append("g");

  group.append("text")
    .attr("transform", "translate(" + 10 + "," + 20 + ")")
    .attr("class", "annotation")
    .attr("x", 0)
    .attr("y", 0)
    .text("Enrollment Scale - The bigger the circle, the more students.");

  group.append("text")
    .attr("transform", "translate(" + 10 + "," + 40 + ")")
    .attr("class", "annotation")
    .attr("x", 0)
    .attr("y", 0)
    .text("CS105 always seems to have the highest enrollment.");

  let introBlock = group.append("text")
    .attr("transform", "translate(" + (width / 2 - 10) + "," + 10 + ")")
    .attr("class", "annotation")
    .attr("x", 0)
    .attr("y", 10);

  introBlock
    .append("tspan")
    .attr("x", 0)
    .attr("y", 10)
    .text("1. Use the slider above to limit the graph to a range of specific years.")
    .append("tspan")
    .attr("x", 0)
    .attr("y", 30)
    .text("2. Click on any orange cell to see a list of classes for that specific subject and level.")
    .append("tspan")
    .attr("x", 0)
    .attr("y", 50)
    .text("3. Click on a class in that list to show the grade distribution for that class.")
    .append("tspan")
    .attr("x", 275)
    .attr("y", 110)
    .text("Try a CS498 class. :)");
}


function updateLegend() {
  let count = 6;
  let midHeight = legendHeight / 2;
  let spacing = 90;
  let rads = [];

  const base = (maxRadius - minRadius) / (count - 1);
  for (let i = 0; i < count; i++) {
    let iVal = minRadius + base * i;
    let oVal = revR(iVal);
    rads.push(oVal);
  }

  legend.selectAll("*").remove();

  let group = legend.append("g")
    .attr("transform", "translate(" + margin.left / 4 + "," + (midHeight + 20) + ")");

  group.selectAll("circle")
    .data(rads)
    .enter().append("circle")
    .attr("class", "legendCircle")
    .attr("id", (d, i) => i)
    .attr("cx", (d, i) => spacing * i)
    .attr("cy", 0)
    .attr("r", d => r(d));

  group.selectAll("text")
    .data(rads)
    .enter().append("text")
    .attr("class", "legendLabel")
    .attr("id", (d, i) => i)
    .attr("x", (d, i) => spacing * i)
    .attr("y", d => r(maxRadius) + legendLabelWidth)
    .text(d => d.toFixed(0));

  drawAnnotations();
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
    .range([minRadius, maxRadius])
    .domain([minTotal, maxTotal]);
}

function drawChart() {
  let cellHeight = maxRadius * 2.0;
  let cellWidth = x(Globals.classLevels[1]);

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

  /*
  labels.append("circle")
    .attr("cx", 0)
    .attr("cy", 0)
    .attr("r", 10.0)
    .style("fill", "blue")
    .style("opacity", "0.5");

  grid.append("circle")
    .attr("cx", 0)
    .attr("cy", 0)
    .attr("r", 10.0)
    .style("fill", "yellow")
    .style("opacity", "0.5");
   */

  // vertical lines
  labels.selectAll(".xLabel")
    .data(Globals.classLevels)
    .enter().append("text")
    .text(d => d + " Level")
    .attr("class", "xLabel level")
    .attr("x", d => margin.left + x(d + 50))
    .attr("y", xLabelHeight - xLabelPad);

  lines.selectAll(".xLine")
    .data(Globals.classLevels)
    .enter().append("line")
    .attr("class", "xLine")
    .attr("x1", d => x(d))
    .attr("y1", -maxRadius)
    .attr("x2", d => x(d))
    .attr("y2", y(rawSubjectData[rawSubjectData.length - 1]["Subject"]) + maxRadius);

  lines
    .append("line")
    .attr("id", "fourNineEightLine")
    .attr("x1", d => x(498))
    .attr("y1", - 2 * maxRadius)
    .attr("x2", d => x(498))
    .attr("y2", y(rawSubjectData[rawSubjectData.length - 1]["Subject"]) + maxRadius);

  // horizontal lines
  labels.selectAll(".yLabel")
    .data(rawSubjectData)
    .enter().append("text")
    .text(d => d["Subject"])
    .attr("class", "yLabel subject")
    .attr("x", yLabelWidth)
    .attr("y", d => margin.top + y(d["Subject"]));

  lines.selectAll(".yLine")
    .data(rawSubjectData)
    .enter().append("line")
    .attr("class", "yLine")
    .attr("x1", -maxRadius)
    .attr("y1", d => y(d["Subject"]))
    .attr("x2", width - margin.left)
    .attr("y2", d => y(d["Subject"]));

  drawCourses();
}

function drawCourses() {
  updateLegend();

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
  menu.init(cellPassive, courseList, grid.attr("transform"));

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
