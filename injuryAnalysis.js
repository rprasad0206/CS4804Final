function initInjuryMap(data) {
  const width = window.innerWidth;
  const height = window.innerHeight - 400;
  const svg = d3.select("#injury-analysis-map").attr("width", width).attr("height", height);
  const g = svg.append("g");
  const tooltip = d3.select("#tooltip");
  const infoContainer = d3.select("#state-info-container");

  const projection = d3.geoAlbersUsa().translate([width / 2, height / 2]).scale(1000);
  const path = d3.geoPath().projection(projection);

  // Filter elements
  const laserColorFilter = d3.select("#laser-color-filter");
  const aircraftFilter = d3.select("#aircraft-filter");
  const stateFilter = d3.select("#state-filter");
  const dateRangeSlider = d3.select("#date-range");

  // Extract unique values for dropdowns
  const laserColors = [...new Set(data.map(d => d["Laser Color"]))].filter(Boolean);
  const aircraftTypes = [...new Set(data.map(d => d["Aircraft"]))].filter(Boolean);
  const states = [...new Set(data.map(d => d["State"]))].filter(Boolean);

  laserColorFilter.selectAll("option").data(["All", ...laserColors]).enter().append("option").text(d => d);
  aircraftFilter.selectAll("option").data(["All", ...aircraftTypes]).enter().append("option").text(d => d);
  stateFilter.selectAll("option").data(["All", ...states]).enter().append("option").text(d => d);

  // Convert Excel date serial to JavaScript Date object
  function convertExcelDate(serial) {
      return new Date((serial - 25569) * 86400 * 1000);
  }

  // Default date range values
  dateRangeSlider.attr("min", 2016).attr("max", 2024).attr("value", 2024);

  function filterData() {
      const selectedColor = laserColorFilter.node().value;
      const selectedAircraft = aircraftFilter.node().value;
      const selectedState = stateFilter.node().value;
      const selectedYear = +dateRangeSlider.node().value;

      return data.filter(d => {
          const incidentDate = convertExcelDate(d["Incident Date"]);
          return (
              incidentDate.getFullYear() >= 2016 && incidentDate.getFullYear() <= selectedYear &&
              (selectedColor === "All" || d["Laser Color"] === selectedColor) &&
              (selectedAircraft === "All" || d["Aircraft"] === selectedAircraft) &&
              (selectedState === "All" || d["State"] === selectedState)
          );
      });
  }

  function getColorScale(selectedColor) {
      const colorMap = {
          "Green": d3.interpolateGreens,
          "Red": d3.interpolateReds,
          "Blue": d3.interpolateBlues,
          "Purple": d3.interpolatePurples,
          "Yellow": d3.interpolateYlOrBr
      };
      return colorMap[selectedColor] || d3.interpolateReds; // Default to Reds
  }

  function updateMap() {
      const filteredData = filterData();
      const stateInjuryCounts = {};

      filteredData.forEach(d => {
          if (d.Injury && d.Injury.toLowerCase() !== "none") {
              stateInjuryCounts[d.State] = (stateInjuryCounts[d.State] || 0) + 1;
          }
      });

      const selectedColor = laserColorFilter.node().value;
      const colorScale = d3.scaleSequential(getColorScale(selectedColor))
                           .domain([0, d3.max(Object.values(stateInjuryCounts)) || 1]);

      // Load GeoJSON for US states
      d3.json("ne_110m_admin_1_states_provinces.json").then(geoData => {
          g.selectAll("path").remove();

          g.selectAll("path")
              .data(geoData.features)
              .enter()
              .append("path")
              .attr("d", path)
              .attr("fill", d => {
                  const injuryCount = stateInjuryCounts[d.properties.name] || 0;
                  return injuryCount > 0 ? colorScale(injuryCount) : "#cccccc";
              })
              .attr("stroke", "#333")
              .on("mouseover", (event, d) => {
                  const injuryCount = stateInjuryCounts[d.properties.name] || 0;
                  tooltip.style("display", "block")
                         .html(`<strong>${d.properties.name}</strong><br>Injuries: ${injuryCount}`)
                         .style("left", (event.pageX + 10) + "px")
                         .style("top", (event.pageY + 10) + "px");
              })
              .on("mouseout", () => tooltip.style("display", "none"))
              .on("click", (event, d) => showStateInfo(d.properties.name));
      });
  }

  function showStateInfo(stateName) {
      const stateData = filterData().filter(d => d.State === stateName);
      const injuryCount = stateData.filter(d => d.Injury && d.Injury.toLowerCase() !== "none").length;

      infoContainer.html(`
          <h3>State: ${stateName}</h3>
          <p>Number of injuries: ${injuryCount}</p>
          <button id="reset-zoom">Reset Zoom</button>
          <table>
              <thead>
                  <tr><th>Laser Color</th><th>Aircraft</th><th>Altitude</th><th>City</th><th>Injury</th><th>Flight ID</th></tr>
              </thead>
              <tbody>
                  ${stateData.map(d => `
                      <tr>
                          <td>${d["Laser Color"]}</td>
                          <td>${d["Aircraft"]}</td>
                          <td>${d["Altitude"]}</td>
                          <td>${d["City"]}</td>
                          <td>${d["Injury"]}</td>
                          <td>${d["Flight ID"]}</td>
                      </tr>
                  `).join('')}
              </tbody>
          </table>
      `);
      infoContainer.style("display", "block");

      // Zoom into the state
      const stateFeature = g.selectAll("path").filter(d => d.properties.name === stateName);
      const [[x0, y0], [x1, y1]] = path.bounds(stateFeature.datum());
      svg.transition().duration(750).call(
          zoom.transform,
          d3.zoomIdentity.translate(width / 2, height / 2).scale(2).translate(-((x0 + x1) / 2), -((y0 + y1) / 2))
      );

      d3.select("#reset-zoom").on("click", () => {
          svg.transition().duration(750).call(zoom.transform, d3.zoomIdentity);
      });
  }

  // Event listeners
  laserColorFilter.on("change", updateMap);
  aircraftFilter.on("change", updateMap);
  stateFilter.on("change", updateMap);
  dateRangeSlider.on("input", updateMap);

  updateMap();

  // Zoom & Pan functionality
  const zoom = d3.zoom()
                 .scaleExtent([1, 8])
                 .on("zoom", (event) => g.attr("transform", event.transform));

  svg.call(zoom);
}
