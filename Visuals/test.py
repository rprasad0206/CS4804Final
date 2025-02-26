# Import required libraries
import pandas as pd
import plotly.express as px
from dash import Dash, dcc, html, Input, Output
import us
# Step 1: Load the data from the CSV file
try:
    # Load the CSV file
    df = pd.read_csv("combined_output.csv")
    
    # Display the first few rows to verify the data
    print("Data loaded successfully:")
    print(df.head())
except Exception as e:
    print(f"Error loading the data: {e}")
    exit()

# Step 2: Parse the "Incident Time" column
def parse_incident_time(time_value):
    """
    Parse the custom time format:
    - Last 2 digits are minutes.
    - First 1 or 2 digits are hours in military time.
    """
    try:
        # Convert the time value to a string
        time_str = str(time_value).strip()
        
        # Pad with leading zeros if necessary to ensure 4 digits
        time_str = time_str.zfill(4)
        
        # Extract hours and minutes
        hours = int(time_str[:-2])  # First 1 or 2 digits
        minutes = int(time_str[-2:])  # Last 2 digits
        
        # Validate hours and minutes
        if hours < 0 or hours > 23 or minutes < 0 or minutes > 59:
            return None
        
        # Convert to total hours (e.g., 1230 -> 12.5 hours)
        total_hours = hours + (minutes / 60)
        return total_hours
    except Exception as e:
        print(f"Error parsing time '{time_value}': {e}")
        return None

# Apply the parsing function to the "Incident Time" column
df["Incident Time"] = df["Incident Time"].apply(parse_incident_time)

# Drop rows where "Incident Time" is NaN (invalid values)
df = df.dropna(subset=["Incident Time"])

# Step 3: Clean and standardize the data
df["State"] = df["State"].str.strip()  # Remove leading/trailing spaces
df["Laser Color"] = df["Laser Color"].str.strip()  # Remove leading/trailing spaces

# Ensure "Altitude" is numeric and drop rows with invalid values
df["Altitude"] = pd.to_numeric(df["Altitude"], errors="coerce")
df = df.dropna(subset=["Altitude"])

# Step 4: Create a color mapping for laser colors
laser_color_map = {
    "Green": "green",
    "Red": "red",
    "Blue": "blue",
    "Yellow": "yellow",
    "White": "white",
    "Purple": "purple",
    "Orange": "orange",
}

# Map laser colors to their corresponding colors
df["Laser Color Mapped"] = df["Laser Color"].map(laser_color_map)

# Step 5: Create visualizations

# Visualization 1: Top 5 Most Common Laser Colors
def plot_top_laser_colors(data):
    top_colors = data["Laser Color"].value_counts().nlargest(5).reset_index()
    top_colors.columns = ["Laser Color", "Count"]
    fig = px.bar(
        top_colors,
        x="Laser Color",
        y="Count",
        title="Top 5 Most Common Laser Colors",
        labels={"Laser Color": "Laser Color", "Count": "Number of Incidents"},
        color="Laser Color",
        color_discrete_map=laser_color_map,
    )
    return fig

# Visualization 2: Laser Incidents by State (Choropleth Map)
# Step 3: Clean and standardize the data
df["State"] = df["State"].str.strip()  # Remove leading/trailing spaces
df["Laser Color"] = df["Laser Color"].str.strip()  # Remove leading/trailing spaces

# Convert full state names to 2-letter abbreviations
def get_state_abbreviation(state_name):
    try:
        return us.states.lookup(state_name).abbr
    except:
        return None

df["State Abbr"] = df["State"].apply(get_state_abbreviation)

# Drop rows where state abbreviation is NaN
df = df.dropna(subset=["State Abbr"])
def plot_incidents_by_state(data):
    state_counts = data["State Abbr"].value_counts().reset_index()
    state_counts.columns = ["State Abbr", "Count"]
    fig = px.choropleth(
        state_counts,
        locations="State Abbr",
        locationmode="USA-states",
        color="Count",
        scope="usa",
        title="Laser Incidents by State",
        labels={"Count": "Number of Incidents"},
    )
    return fig


# Visualization 3: Laser Incidents Over Time (Line Chart)
def plot_incidents_over_time(data):
    # Group by hour and count incidents
    data["Hour"] = data["Incident Time"].astype(int)
    time_counts = data["Hour"].value_counts().sort_index().reset_index()
    time_counts.columns = ["Hour", "Count"]
    fig = px.line(
        time_counts,
        x="Hour",
        y="Count",
        title="Laser Incidents by Hour of the Day",
        labels={"Hour": "Hour of the Day", "Count": "Number of Incidents"},
    )
    return fig

# Visualization 4: Altitude vs. Incident Time (2D Scatter Plot)
def plot_altitude_vs_time(data):
    fig = px.scatter(
        data,
        x="Altitude",
        y="Incident Time",
        color="Laser Color",
        color_discrete_map=laser_color_map,
        hover_data=["City", "State", "Flight ID"],
        title="Altitude vs. Incident Time",
        labels={
            "Altitude": "Altitude (ft)",
            "Incident Time": "Incident Time (hours)",
            "Laser Color": "Laser Color",
        },
    )
    return fig

# Step 6: Initialize the Dash app
app = Dash(__name__)

# Step 7: Define the layout of the app
app.layout = html.Div([
    html.H1("Laser Incident Analysis Dashboard"),
    
    # Dropdown to select visualization
    dcc.Dropdown(
        id="visualization-dropdown",
        options=[
            {"label": "Top 5 Laser Colors", "value": "top_colors"},
            {"label": "Incidents by State", "value": "state_map"},
            {"label": "Incidents Over Time", "value": "time_series"},
            {"label": "Altitude vs. Time", "value": "altitude_time"},
        ],
        value="top_colors",  # Default value
        placeholder="Select a Visualization",
    ),
    
    # Graph to display the selected visualization
    dcc.Graph(id="selected-visualization"),
])

# Step 8: Callback to update the graph based on the selected visualization
@app.callback(
    Output("selected-visualization", "figure"),
    Input("visualization-dropdown", "value"),
)
def update_visualization(selected_visualization):
    if selected_visualization == "top_colors":
        return plot_top_laser_colors(df)
    elif selected_visualization == "state_map":
        return plot_incidents_by_state(df)
    elif selected_visualization == "time_series":
        return plot_incidents_over_time(df)
    elif selected_visualization == "altitude_time":
        return plot_altitude_vs_time(df)
    else:
        return px.scatter()  # Return an empty scatter plot if no selection is made

# Step 9: Run the app
if __name__ == "__main__":
    app.run_server(debug=True)