import { grades } from "./globals.js";

const barChart = d3.select("svg")
  .append("g")
    .attr("class", "barChart")
    .attr("transform", "translate(50%, 50%)");

let margin = {
  top: 20,
  right: 20,
  bottom: 20,
  left: 20
};

let width = 1000 - margin.left - margin.right;
let height = 800 - margin.top - margin.bottom;

let data = null;

// set the ranges
let x = d3.scaleBand()
  .range([0, width]);

let y = d3.scaleLinear()
  .range([0, height]);

function initChart(d) {
  data = d;
}

function showChart(query) {
  console.log(query);

  barChart.append("rect")
    .attr("class", "barChartBackground")
    .attr("x", 0)
    .attr("y", 0)
    .attr("rx", 10)
    .attr("ry", 10)
    .attr("width", width)
    .attr("height", height)

  /*
  // scale the range of the data in the domains
  x.domain(data.map(function(d) { return d.salesperson; }));
  y.domain([0, d3.max(data, function(d) { return d.sales; })]);

  // append the rectangles for the bar chart
  barChart.selectAll(".bar")
    .data(data)
    .enter().append("rect")
    .attr("class", "bar")
    .attr("x", function(d) { return x(d.salesperson); })
    .attr("width", x.bandwidth())
    .attr("y", function(d) { return y(d.sales); })
    .attr("height", function(d) { return height - y(d.sales); });

  // add the x Axis
  barChart.append("g")
    .attr("transform", "translate(0," + height + ")")
    .call(d3.axisBottom(x));

  // add the y Axis
  barChart.append("g")
    .call(d3.axisLeft(y));
  */
}

function clearChart() {

}

export { initChart, clearChart, showChart };
