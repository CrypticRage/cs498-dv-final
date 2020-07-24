import { Query } from "./globals.js";

const menu = d3.select("#menu");

let itemHeight = 22;
let itemWidth = 0;

let handleMenuItemClick = null;

function setCallback(callback) {
  handleMenuItemClick = callback;
}

function initMenu(cellPassive, courseList, baseTransform) {
  let subject = cellPassive.attr("data-subject");
  let level = parseInt(cellPassive.attr("data-level"));
  let x = parseInt(cellPassive.attr("x"));
  let y = parseInt(cellPassive.attr("y")) + parseInt(cellPassive.attr("height")) / 2.0;

  itemWidth = parseInt(cellPassive.attr("width"));

  menu.attr("transform", "translate(" + x + "," + y + ") " + baseTransform);
  clearMenu();

  let menuSelect = menu.selectAll(".menuItem")
    .data(courseList)
    .enter()
    .filter(function(d) { return d["Subject"] === subject })
    .filter(function(d) { return (d["Number"] >= level) && (d["Number"] <= level + 99) })
    .append("g")
      .attr("class", "menuItem")
      .attr("id", function(d) { return d["Subject"] + d["Number"] })
      .attr("data-subject", function(d) { return d["Subject"] })
      .attr("data-number", function(d) { return d["Number"] })
      .on("mouseover", handleMouseOver)
      .on("mouseout", handleMouseOut)
      .on("click", handleClick);

  menuSelect.append("rect")
    .attr("class", "menuItemRect")
    .attr("x", 0)
    .attr("y", function(d, i) { return i * itemHeight })
    .attr("width", itemWidth)
    .attr("height", itemHeight);

  menuSelect.append("text")
    .attr("class", "menuItemText")
    .attr("x", 0)
    .attr("y", function(d, i) { return i * itemHeight + itemHeight / 2.0 })
    .text(menuText);
}

function clearMenu() {
  menu.selectAll(".menuItem").remove();
}

function menuText(d) {
  return d["Number"] + "-" + d["Title"]
}

function handleMouseOver() {
  let menuItem = d3.select(this);
  let menuItemRect = d3.select(this).select("rect");
  menuItemRect.attr("class", "menuItemRect over");

  let circles = d3.select("g#circles");
  let courseCircle = circles.select("circle#" + menuItem.attr("id"));
  courseCircle.attr("class", "course over");
}

function handleMouseOut() {
  let menuItem = d3.select(this);
  let menuItemRect = d3.select(this).select("rect");
  menuItemRect.attr("class", "menuItemRect");

  let circles = d3.select("g#circles");
  let courseCircle = circles.select("circle#" + menuItem.attr("id"));
  courseCircle.attr("class", "course");
}

function handleClick() {
  let menuItem = d3.select(this);
  let subject = menuItem.attr("data-subject");
  let number = +menuItem.attr("data-number");

  let testYear = 2018;
  let query = new Query(testYear, testYear, subject, number);

  handleMenuItemClick(query);
}

export { initMenu, clearMenu, setCallback };
