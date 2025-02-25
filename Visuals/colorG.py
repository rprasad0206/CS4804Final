import pandas as pd
import plotly.express as px
import dash
from dash import dcc, html
from dash.dependencies import Input, Output

# Load your data
df = pd.read_csv('combined_output.csv')

# Convert 'Incident Date' to datetime and extract year
df['Incident Date'] = pd.to_datetime(df['Incident Date'])
df['Year'] = df['Incident Date'].dt.year

# Initialize Dash app
app = dash.Dash(__name__)

# Layout of the app
app.layout = html.Div([
    html.H1("Laser Incident Injury Analysis", style={'textAlign': 'center'}),
    
    # Filters
    html.Div([
        html.Label("Select Year:"),
        dcc.Dropdown(
            id='year-filter',
            options=[{'label': year, 'value': year} for year in df['Year'].unique()],
            value=df['Year'].max(),  # Default to the most recent year
            clearable=False
        ),
        html.Label("Select State:"),
        dcc.Dropdown(
            id='state-filter',
            options=[{'label': state, 'value': state} for state in df['State'].unique()],
            value='California',  # Default to a state with high incidents
            clearable=False
        ),
        html.Label("Select Aircraft Type:"),
        dcc.Dropdown(
            id='aircraft-filter',
            options=[{'label': aircraft, 'value': aircraft} for aircraft in df['Aircraft'].unique()],
            value='B738',  # Default to a common aircraft type
            clearable=False
        )
    ], style={'width': '30%', 'display': 'inline-block', 'padding': '20px'}),
    
    # Graphs
    html.Div([
        dcc.Graph(id='injury-bar-chart'),
        dcc.Graph(id='injury-pie-chart')
    ], style={'width': '70%', 'display': 'inline-block'})
])

# Callback to update graphs based on filters
@app.callback(
    [Output('injury-bar-chart', 'figure'),
     Output('injury-pie-chart', 'figure')],
    [Input('year-filter', 'value'),
     Input('state-filter', 'value'),
     Input('aircraft-filter', 'value')]
)
def update_graphs(selected_year, selected_state, selected_aircraft):
    # Filter data based on selections
    filtered_df = df[(df['Year'] == selected_year) & 
                     (df['State'] == selected_state) & 
                     (df['Aircraft'] == selected_aircraft)]
    
    # Grouped bar chart: Injuries by State
    injury_counts = filtered_df.groupby(['State', 'Injury']).size().reset_index(name='Count')
    bar_fig = px.bar(
        injury_counts, 
        x='State', 
        y='Count', 
        color='Injury', 
        barmode='group',
        title=f'Injury Analysis for {selected_state} in {selected_year} (Aircraft: {selected_aircraft})',
        labels={'Count': 'Number of Incidents', 'Injury': 'Injury Reported'},
        hover_data=['State', 'Injury', 'Count']
    )
    
    # Pie chart: Overall Injury Proportion
    injury_proportion = filtered_df['Injury'].value_counts().reset_index()
    injury_proportion.columns = ['Injury', 'Count']
    pie_fig = px.pie(
        injury_proportion, 
        values='Count', 
        names='Injury', 
        title=f'Proportion of Injuries in {selected_state} in {selected_year} (Aircraft: {selected_aircraft})',
        hover_data=['Count']
    )
    
    return bar_fig, pie_fig

# Run the app
if __name__ == '__main__':
    app.run_server(debug=True)