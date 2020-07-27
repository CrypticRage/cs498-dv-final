import { Query } from "./globals.js";

let itemHeight = 22;
let itemWidth = 0;

function Menu(parent, clickCallback) {
  this.parent = parent;
  this.init = init;
  this.clear = clear;
  this.clickCallback = clickCallback;

  this.menu = parent.append("g")
    .attr("class", "menu");
}

function init(cellPassive, courseList, baseTransform) {
  let subject = cellPassive.attr("data-subject");
  let level = +cellPassive.attr("data-level");
  let x = +cellPassive.attr("x");
  let y = +cellPassive.attr("y") + +cellPassive.attr("height") / 2.0;

  itemWidth = +cellPassive.attr("width");

  this.menu.attr("transform", "translate(" + x + "," + y + ") " + baseTransform);
  this.clear();

  let menuSelect = this.menu.selectAll(".menuItem")
    .data(courseList)
    .enter()
    .filter((d) => d["Subject"] === subject)
    .filter((d) => (d["Number"] >= level) && (d["Number"] <= level + 99))
    .append("g")
      .attr("class", "menuItem")
      .attr("id", (d) => d["Subject"] + d["Number"])
      .attr("data-subject", (d) => d["Subject"])
      .attr("data-number", (d) => d["Number"])
      .attr("data-title", (d) => d["Title"])
      .on("mouseover", handleMouseOver)
      .on("mouseout", handleMouseOut)
      .on("click", handleClick(this));

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

function clear() {
  this.menu.selectAll(".menuItem").remove();
}

function menuText(d) {
  return d["Number"] + "-" + d["Title"]
}

function handleMouseOver() {
  let menuItem = d3.select(this);
  let menuItemRect = menuItem.select("rect");
  menuItemRect.attr("class", "menuItemRect over");

  let circles = d3.select("g#circles");
  let courseCircle = circles.select("circle#" + menuItem.attr("id"));
  courseCircle.attr("class", "course over");
}

function handleMouseOut() {
  let menuItem = d3.select(this);
  let menuItemRect = menuItem.select("rect");
  menuItemRect.attr("class", "menuItemRect");

  let circles = d3.select("g#circles");
  let courseCircle = circles.select("circle#" + menuItem.attr("id"));
  courseCircle.attr("class", "course");
}

function handleClick(parentMenu) {
  // https://www.jstips.co/en/javascript/passing-arguments-to-callback-functions/
  return function () {
    let menuItem = d3.select(this);
    let subject = menuItem.attr("data-subject");
    let number = +menuItem.attr("data-number");
    let title = menuItem.attr("data-title");

    let query = new Query(0, 0, subject, number, title);

    parentMenu.clickCallback(query);
  }
}

export { Menu };
