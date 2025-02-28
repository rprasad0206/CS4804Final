// tiltedMap.js

const width = window.innerWidth;
const height = window.innerHeight;
let zoomedState = null;

const svg = d3.select("#map")
              .attr("width", width)
              .attr("height", height)
              .call(d3.zoom().scaleExtent([1, 8]).on("zoom", zoomed));

const g = svg.append("g");
const tooltip = d3.select("#tooltip");

// Create a text element to show the state name
const stateNameText = svg.append("text")
                         .attr("id", "state-name")
                         .attr("x", 20)
                         .attr("y", 20)
                         .style("font-size", "18px")
                         .style("fill", "#333")
                         .style("display", "none"); // Hide initially

const projection = d3.geoAlbersUsa()
                     .translate([width / 2, height / 2])
                     .scale(1000);

const path = d3.geoPath().projection(projection);

d3.json("ne_110m_admin_1_states_provinces.json")
  .then(data => {
    const states = g.selectAll("path")
      .data(data.features)
      .enter()
      .append("path")
      .attr("d", path)
      .attr("fill", "#cccccc")
      .attr("stroke", "#333")
      .attr("stroke-width", 1)
      .on("click", clicked)
      .on("mouseover", (event, d) => {
        tooltip.style("display", "block")
               .text(d.properties.name)
               .style("left", (event.pageX + 10) + "px")
               .style("top", (event.pageY + 10) + "px");
      })
      .on("mousemove", (event) => {
        tooltip.style("left", (event.pageX + 10) + "px")
               .style("top", (event.pageY + 10) + "px");
      })
      .on("mouseout", () => {
        tooltip.style("display", "none");
      });

    function clicked(event, d) {
      if (zoomedState === d) {
        reset();
      } else {
        const [[x0, y0], [x1, y1]] = path.bounds(d);
        event.stopPropagation();
        
        const zoomScale = Math.min(8, 0.9 / Math.max((x1 - x0) / width, (y1 - y0) / height));
        
        g.transition().duration(750).attr("transform",
          `translate(${width / 2}, ${height / 2}) scale(${zoomScale}) translate(${-((x0 + x1) / 2)}, ${-((y0 + y1) / 2)})`
        );

        tooltip.style("font-size", `${12 * zoomScale}px`)
               .style("padding", `${5 * zoomScale}px`);
        
        states.attr("fill", "#cccccc"); // Reset all states
        d3.select(event.target).attr("fill", "#ffcc00"); // Highlight selected state

        // Display the state name and position it
        stateNameText.style("display", "block")
                     .attr("x", (x0 + x1) / 2 + 10)  // Position text to the right of the state
                     .attr("y", (y0 + y1) / 2 - 10)  // Position text above the state center
                     .text(d.properties.name);       // Set text to the state name

        zoomedState = d;
      }
    }

    svg.on("click", reset);
  })
  .catch(error => console.error("Error loading GeoJSON file:", error));

function reset() {
  g.transition().duration(750).attr("transform", "translate(0,0) scale(1)");
  zoomedState = null;
  
  d3.selectAll("path").attr("fill", "#cccccc"); // Reset highlight
  tooltip.style("font-size", "12px")
         .style("padding", "5px");
  
  // Hide the state name text
  stateNameText.style("display", "none");
}

function zoomed(event) {
  g.attr("transform", event.transform);
}
