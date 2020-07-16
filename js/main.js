// var d3 = require("d3");

const grades = [
  "A+", "A", "A-", "B+", "B", "B-",
  "C+", "C", "C-", "D+", "D", "D-", "F", "W"
];

const gpaDataFile = "data/uiuc-gpa-dataset.txt"
const subjectDataFile = "data/subjects.txt"

const terms = {};
const subjects = {};
const courses = {};

const debugText = d3.select("#debug");

d3.csv(subjectDataFile).then(function(data) {
  // console.log(data);
  data.forEach(function(d) {
    subjects[d["Subject"]] = d["Title"];
  });

  diagram.selectAll(".subject")
    .data(data)
    .enter().append("text")
    .text(function(d) { return d["Subject"]; })
    .attr("class", "subject")
    .attr("x", function(d) { return 20; })
    .attr("y", function(d, i) { return i * 100; });
});

let testString = "";
let testInt = 0;

d3.csv(gpaDataFile).then(function(data) {
  data.forEach(function(d) {
    if (!(d["YearTerm"] in terms)) {
      terms[d["YearTerm"]] = {"Year": d["Year"], "Term": d["Term"]};
    }

    if (d["Year"] == 2019) {
      const subjectNumber = d["Subject"] + d["Number"];

      let total = 0;
      grades.forEach(function(grade) {
        total += parseInt(d[grade]);
      });
      testInt = total;

      if (subjectNumber in courses) {
        courses[subjectNumber]["Total"] += total;
      }
      else {
        courses[subjectNumber] =
          {"Subject": d["Subject"], "Number": d["Number"], "Total": total};
      }
    }
  });

  debugText.selectAll("p")
    .data(data)
    .enter().append("p")
    .filter(function(d) { return d["Subject"] in subjects })
    .filter(function(d) { return d["Number"] >= 400 })
    .filter(function(d) { return d["Term"] === "Fall" })
    .text(function(d) {
      let propValue = "";
      let propString = "";
      for(let propName in d) {
        propValue = d[propName]
        propString += propName + " - " + propValue + " \n"
      }
      return propString;
    })
});

// set the dimensions and margins of the graph
var margin = { top: 20, right: 20, bottom: 30, left: 40 };
var width = 960 - margin.left - margin.right;
var height = 500 - margin.top - margin.bottom;

// set the ranges
var x = d3.scaleBand()
  .range([0, width])
  .padding(0.1);

var y = d3.scaleLinear()
  .range([height, 0]);

// append the svg object to the body of the page
// append a 'group' element to 'svg'
// moves the 'group' element to the top left margin
var diagram = d3.select("#diagram").append("svg")
  .attr("width", width + margin.left + margin.right)
  .attr("height", height + margin.top + margin.bottom)
  .append("g")
  .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

// get the data
d3.csv("data/sales.csv").then(function(data) {

  // format the data
  data.forEach(function(d) {
    d.sales = +d.sales;
  });

  // Scale the range of the data in the domains
  x.domain(data.map(function(d) { return d.salesperson; }));
  y.domain([0, d3.max(data, function(d) { return d.sales; })]);

  // append the rectangles for the bar chart
  diagram.selectAll(".bar")
    .data(data)
    .enter().append("rect")
    .attr("class", "bar")
    .attr("x", function(d) { return x(d.salesperson); })
    .attr("width", x.bandwidth())
    .attr("y", function(d) { return y(d.sales); })
    .attr("height", function(d) { return height - y(d.sales); });

  // add the x Axis
  diagram.append("g")
    .attr("transform", "translate(0," + height + ")")
    .call(d3.axisBottom(x));

  // add the y Axis
  diagram.append("g")
    .call(d3.axisLeft(y));
});
