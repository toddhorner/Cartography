var svg = d3.select("svg"),
  width = +svg.attr("width"),
  height = +svg.attr("height");

const steps = 10;
var q, color;
//The collection in which to store the data.
var wrk_at_home = d3.map();

//Path generator for drawing the map
var path = d3.geoPath();

// Scale for formatting legend
var x = d3.scaleLinear()
  .domain([0, steps])
  .rangeRound([550, 900])

//For formatting legend ticks
var f = d3.format(".1%");

d3.queue()
  .defer(d3.json, "https://d3js.org/us-10m.v1.json")
  .defer(d3.csv, "wrk_at_home.csv", function(d) {
    wrk_at_home.set(d.id, +d.pct_home);
  })
  .await(ready);

function ready(error, us) {
  if (error) throw error;

  q = d3.scaleQuantile()
    .domain(wrk_at_home.values())
    .range(d3.range(steps))

  key = d3.scaleOrdinal()
    .domain(d3.range(steps))
    .range(q.quantiles())

  color = d3.scaleThreshold()
    .domain(q.quantiles())
    .range(d3.schemeBlues[steps - 1]);

  var g = svg.append("g")
    .attr("class", "key")
    .attr("transform", "translate(0,40)");

  g.selectAll("rect")
    .data(d3.range(steps))
    .enter().append("rect")
    .attr("height", 12)
    .attr("x", function(d, i) {
      return x(d);
    })
    .attr("width", function() {
      return ((x.range()[1] - x.range()[0]) / (steps));
    })
    .attr("fill", function(d) {
      return color.range()[d];
    });

  g.append("text")
    .attr("class", "caption")
    .attr("x", x.range()[0])
    .attr("y", -6)
    .attr("fill", "#000")
    .attr("text-anchor", "start")
    .attr("font-weight", "bold")
    .text("Worked at Home - 2016 ACS 5-Year Estimates");

  g.call(d3.axisBottom(x)
      .tickSize(13)
      .tickFormat(function(x, i) {
        if (i == 0) {
          return 0 + "%"
        } else if (i < steps - 1) {
          return f(key(x - 1))
        } else {
          return ">" + f(key(x - 1))
        }
      })
      .tickValues(d3.range(0, steps)))
    .select(".domain")
    .remove();

  d3.format(",.1%")

  svg.append("g")
    .attr("class", "counties")
    .selectAll("path")
    .data(topojson.feature(us, us.objects.counties).features)
    .enter().append("path")
    .attr("fill", function(d) {
      return color(d.pct_home = wrk_at_home.get(d.id));
    })
    .attr("d", path)
    .append("title")
    .text(function(d) {
      return d.rate + "%";
    });

  svg.append("path")
    .datum(topojson.mesh(us, us.objects.states, function(a, b) {
      return a !== b;
    }))
    .attr("class", "states")
    .attr("d", path);
}
