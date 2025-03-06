Laser Incident Analysis Dashboard
Overview:
This project is a web-based dashboard for analyzing laser incident data. It provides interactive visualizations to explore trends and patterns in laser incidents reported over time. The dashboard is built using HTML, CSS, and JavaScript, with the help of libraries such as D3.js and Plotly.js for data manipulation and visualization. The interface allows the users to filter data by year and select different types of visualizations to gain insights into the dataset.


Project Structure
Code:
index.html: The main HTML file that defines the structure of the dashboard. It includes the dropdown menu, year slider, and visualization container.
Javascript: Data loading and processing, visualizaiton functions, and event listeners for user interactions.
CSS: basic styling for the dashboard layout and componenets.


Libraries:
D3.js: Used for data manipulation and aggregation.
Plotly.js: Used for creating interactive visualizations (bar charts, choropleth maps, histograms, pie charts)


Data:
combined_output.json: The dataset containing all of the laser incident records from 2016-2024.
top_cities_by_year.json: The dataset containing the top cities by laser incidents for each year.
top_aircraft_by_year.json: The dataset containing the top aircrafts by laser incidents for each year.


Project Website:
Link to website -->


Screencast Video:
Link to video -->


Non-Obvious Features:
1. State abbreviations:
    Incidents by state visualization converts full state names to their 2-letter abbreviations
2. Pre-processing data:
    top_cities_by_year.json and top_aircraft_by_year.json helps improve performance and simplify the code