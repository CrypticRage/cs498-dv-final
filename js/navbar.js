// https://www.digitalocean.com/community/tutorials/js-js-singletons

const yearSliderCallbacks = [];
let startYear = 2013;
let endYear = 2016;

const navGrid = d3.select("div#navGrid");

class NavBar
{
  constructor() { }

  setYearRange(start, end) {
    startYear = start;
    endYear = end;
  }

  startYear() { return startYear; }
  endYear() { return endYear; }

  addYearSliderCallback(callback) {
    yearSliderCallbacks.push(callback);
  }

  initNavBar(years) {
    let row = navGrid.append("div")
      .attr("class", "centered row");

    let leftCell = row.append("div")
      .attr("class", "left aligned three wide column");

    let yearSliderCell = row.append("div")
      .attr("class", "center aligned eight wide column");
    yearSliderCell.append("div")
      .attr("class", "ui labeled ticked range slider")
      .attr("id", "yearSlider");

    let yearSlider = $("#yearSlider");
    yearSlider.slider({
      min: years[0],
      max: years[years.length - 1],
      start: startYear,
      end: endYear,
      step: 1,
      onChange: this.yearSliderUpdated
    });

    let rightCell = row.append("div")
      .attr("class", "right aligned three wide column");

    let backButton = rightCell.append("div")
      .attr("class", "ui icon button");

    backButton.append("i")
      .attr("class", "arrow left icon");
  }

  yearSliderUpdated(val, start, end)
    {
      startYear = start;
      endYear = end;

      yearSliderCallbacks.forEach((fn) => {
        fn(val, start, end);
      });
    }
}

const instance = new NavBar();
Object.freeze(instance);

export default instance;