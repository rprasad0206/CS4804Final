import pandas as pd
import plotly.express as px

# --- Data Loading & Preprocessing ---

# Load the CSV file; ensure 'Incident Date' is parsed as a datetime
df = pd.read_csv("combined_output.csv", parse_dates=["Incident Date"])

# Optional: If Incident Time is in minutes after midnight (as in the sample), 
# you might want to leave it as is or convert it to a time format.
# For now we assume it remains a numeric field.

# --- Visualization 1: FAA Laser Incidents by State ---
# Count the number of incidents per state
state_counts = df['State'].value_counts().reset_index()
state_counts.columns = ['State', 'Incident Count']

fig_state = px.bar(state_counts,
                   x='State',
                   y='Incident Count',
                   title='FAA Laser Incidents by State',
                   labels={'State': 'State', 'Incident Count': 'Number of Incidents'},
                   template='plotly_white')
fig_state.update_layout(xaxis={'categoryorder':'total descending'})
fig_state.show()

# --- Visualization 2: Altitude vs. Incident Time ---
# Explore if there is any pattern between incident time (e.g., minutes after midnight) and the altitude at which the incident occurred.
fig_scatter = px.scatter(df,
                         x='Incident Time',
                         y='Altitude',
                         color='State',
                         hover_data=['Flight ID', 'Aircraft', 'City'],
                         title='Altitude vs. Incident Time for FAA Laser Incidents',
                         labels={'Incident Time': 'Incident Time (minutes after midnight)',
                                 'Altitude': 'Altitude (ft)'},
                         template='plotly_white')
fig_scatter.show()

# --- Visualization 3: FAA Laser Incidents Over Time ---
# If your data spans multiple dates/years, a time series histogram can show trends over time.
fig_time = px.histogram(df,
                        x='Incident Date',
                        nbins=30,
                        title='FAA Laser Incidents Over Time',
                        labels={'Incident Date': 'Incident Date', 'count': 'Number of Incidents'},
                        template='plotly_white')
fig_time.update_layout(bargap=0.1)
fig_time.show()
