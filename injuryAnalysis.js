function initInjuryMap(data) {
    const width = window.innerWidth;
    const height = window.innerHeight - 400;
    const svg = d3.select("#injury-analysis-map").attr("width", width).attr("height", height);
    const g = svg.append("g");
    const tooltip = d3.select("#tooltip");
    const infoContainer = d3.select("#state-info-container");
    const loader = d3.select("#loader"); // Assume a loader element is present in HTML

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
    const years = [...new Set(data.map(d => d["Year"]))].sort((a, b) => a - b); // Get unique years

    laserColorFilter.selectAll("option").data(["All", ...laserColors]).enter().append("option").text(d => d);
    aircraftFilter.selectAll("option").data(["All", ...aircraftTypes]).enter().append("option").text(d => d);
    stateFilter.selectAll("option").data(["All", ...states]).enter().append("option").text(d => d);

    // Default date range values
    const minYear = Math.min(...years);
    const maxYear = Math.max(...years);
    
    dateRangeSlider.attr("min", minYear).attr("max", maxYear).attr("value", maxYear);
    const yearDisplay = d3.select("#year-display");

    dateRangeSlider.on("input", function() {
        const selectedYear = +dateRangeSlider.node().value;
        yearDisplay.text(`Selected Year: ${selectedYear}`);
        updateMap();
    });

    function filterData() {
        const selectedColor = laserColorFilter.node().value;
        const selectedAircraft = aircraftFilter.node().value;
        const selectedState = stateFilter.node().value;
        const selectedYear = +dateRangeSlider.node().value;

        return data.filter(d => {
            return (
                d["Year"] >= minYear &&
                d["Year"] <= selectedYear &&
                (selectedColor === "All" || d["Laser Color"] === selectedColor) &&
                (selectedAircraft === "All" || d["Aircraft"] === selectedAircraft) &&
                (selectedState === "All" || d["State"] === selectedState)
            );
        });
    }

    function getColorScale(selectedColor) {
        if (selectedColor === "All") {
            return () => "#808080";
        }

        const colorMap = {
            "Green": d3.interpolateGreens,
            "Red": d3.interpolateReds,
            "Blue": d3.interpolateBlues,
            "Purple": d3.interpolatePurples,
            "Yellow": d3.interpolateYlOrBr
        };
        return colorMap[selectedColor] || "#808080"; // Default to Grey
    }

    function updateMap() {
        loader.style("display", "block"); // Show loader
        const filteredData = filterData();
        console.log(filteredData); // Log filtered data for debugging
        const stateInjuryCounts = {};

        filteredData.forEach(d => {
            if (d.Injury && d.Injury.toLowerCase() !== "none") {
                stateInjuryCounts[d.State] = (stateInjuryCounts[d.State] || 0) + 1;
            }
        });

        const selectedColor = laserColorFilter.node().value;
        const colorScale = selectedColor === "All"
            ? () => "#808080"
            : d3.scaleSequential(getColorScale(selectedColor))
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

            loader.style("display", "none"); // Hide loader
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

    // Event listeners for filter changes
    laserColorFilter.on("change", updateMap);
    aircraftFilter.on("change", updateMap);
    stateFilter.on("change", updateMap);
    dateRangeSlider.on("input", updateMap);

    // Reset filters button
    d3.select("#reset-filters").on("click", () => {
        laserColorFilter.property("value", "All");
        aircraftFilter.property("value", "All");
        stateFilter.property("value", "All");
        dateRangeSlider.property("value", maxYear);
        yearDisplay.text(`Selected Year: ${maxYear}`);
        updateMap();
    });

    // Window resize event listener for responsiveness
    window.addEventListener('resize', () => {
        const width = window.innerWidth;
        const height = window.innerHeight - 400;
        svg.attr("width", width).attr("height", height);
        projection.translate([width / 2, height / 2]).scale(1000);
        updateMap();
    });

    updateMap();

    // Zoom & Pan functionality
    const zoom = d3.zoom().scaleExtent([1, 8]).on("zoom", (event) => g.attr("transform", event.transform));
    svg.call(zoom);
}
