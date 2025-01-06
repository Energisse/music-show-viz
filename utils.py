# Utils function

import pandas as pd
import ast
import json
import requests

def fetch_tags(title, artist):
    """
    Function to fetch tags from Last.fm API
    :param title:
    :param artist:
    """
    api_key = "e27dd1592fbede0ff3a29b940b5d1935"  # Replace with your Last.fm API key
    url = "http://ws.audioscrobbler.com/2.0/"
    params = {
        "method": "track.getInfo",
        "artist": artist,
        "track": title,
        "api_key": api_key,
        "format": "json"
    }
    try:
        response = requests.get(url, params=params)
        if response.status_code == 200:
            data = response.json()
            tags = [tag['name'] for tag in data.get('track', {}).get('toptags', {}).get('tag', [])]
            return tags
        else:
            return ["Error: " + response.text]
    except Exception as e:
        return [f"Error: {e}"]


def export_music_data_to_json(input_filename, output_filename):
    """
    Function to process music data csv file and save it to a JSON file
    :param input_filename:
    :param output_filename:
    """

    # Read CSV file
    df = pd.read_csv(input_filename)
    df['Date'] = pd.to_datetime(df['Date'])
    df["Tags"] = df["Tags"].apply(ast.literal_eval)

    json_data = {
        "users": [
            {
                "user_id": "clement",
                "username": "Clément Laurent",
                "top_artists": [],
                "top_genres": [],
                "top_tracks": [],
                "average_listening_time": {
                    "dataMonth": [],
                    "dataYear": [],
                    "dataDay": []
                }
            }
        ]
    }

    timespans = [
        ("4 weeks", ('2024-11-22', '2024-12-22')),
        ("3 months", ('2024-09-22', '2024-12-22')),
        ("6 months", ('2024-06-22', '2024-12-22')),
        ("1 year", ('2023-11-22', '2024-12-22')),
        ("all time", ('2002-01-01', '2024-12-22'))
    ]

    # Process for each timespan
    for timespan in timespans:
        copy = df.copy()

        # Filter data for the given timespan
        copy = copy[(copy['Date'] >= timespan[1][0]) & (copy['Date'] <= timespan[1][1])]

        # Retrieve top artists by listening time and count
        df_top_artists_lt = (
            copy.groupby('Artist')['Listening Time']
            .sum()
            .reset_index(name='Listening Time')
            .sort_values('Listening Time', ascending=False)
            .head(15)
        )
        df_top_artists_count = (
            copy.groupby('Artist')
            .size()
            .reset_index(name='Count')
            .sort_values('Count', ascending=False)
            .head(15)
        )

        # Retrieve top genres by listening time
        expanded_df = copy.explode("Tags")  # Expands the DataFrame for genres
        df_top_genres_lt = (
            expanded_df.groupby("Tags")["Listening Time"]
            .sum()
            .reset_index()
            .sort_values(by="Listening Time", ascending=False)
            .head(15)
        )

        # Retrieve top tracks by listening time and count
        df_top_songs_lt = (
            copy.groupby(['Song Title', 'Artist'])['Listening Time']
            .sum()
            .reset_index(name='Listening Time')
            .sort_values('Listening Time', ascending=False)
            .head(15)
        )
        df_top_songs_count = (
            copy.groupby('Song Title')
            .size()
            .reset_index(name='Count')
            .sort_values('Count', ascending=False)
            .head(15)
        )

        # Construct JSON objects for top artists
        obj_top_artists_lt = {
            "start": timespan[1][0],
            "end": timespan[1][1],
            "label": timespan[0],
            "count": len(df_top_artists_lt),
            "ranking": df_top_artists_lt.to_dict(orient="records")
        }
        json_data['users'][0]["top_artists"].append(obj_top_artists_lt)

        # Construct JSON object for top genres with intervals
        top_genres_ranking = []
        for _, genre_row in df_top_genres_lt.iterrows():
            genre = genre_row['Tags']
            genre_list = []

            # Filter tracks associated with this genre
            genre_tracks = copy[copy['Tags'].apply(lambda tags: genre in tags)]

            # Get top tracks associated with the genre
            df_genre_top_tracks = (
                genre_tracks.groupby(['Song Title', 'Artist'])['Listening Time']
                .sum()
                .reset_index(name='Listening Time')
                .sort_values('Listening Time', ascending=False)
                .head(5)  # Get top 5 tracks for the genre
            )

            # Add the tracks to the genre's list
            genre_list = df_genre_top_tracks[['Song Title', 'Listening Time']].to_dict(orient="records")

            # Append genre object with the "list" field
            top_genres_ranking.append({
                "Tags": genre,
                "Listening Time": genre_row['Listening Time'],
                "list": genre_list
            })

        # Add the top genres object with the interval details
        obj_top_genres_lt = {
            "start": timespan[1][0],
            "end": timespan[1][1],
            "label": timespan[0],
            "count": len(df_top_genres_lt),
            "ranking": top_genres_ranking
        }
        json_data['users'][0]["top_genres"].append(obj_top_genres_lt)

        # Construct JSON objects for top tracks
        obj_top_tracks_lt = {
            "start": timespan[1][0],
            "end": timespan[1][1],
            "label": timespan[0],
            "count": len(df_top_songs_lt),
            "ranking": df_top_songs_lt.to_dict(orient="records")
        }
        json_data['users'][0]["top_tracks"].append(obj_top_tracks_lt)

    # Calculate daily listening time and prepare the output
    daily_listening_time = df.groupby(df['Date'].dt.date)['Listening Time'].sum().reset_index()
    daily_listening_time = daily_listening_time.rename(columns={
        "Date": "period",
        "Listening Time": "listens"
    }).sort_values("period", ascending=False)

    daily_listening_time['period'] = daily_listening_time['period'].astype(str)
    json_data['users'][0]["average_listening_time"]["dataMonth"] = daily_listening_time.to_dict(orient="records")

    # Calculate average monthly sums
    average_monthly_sums = df.groupby(df['Date'].dt.to_period('M'))['Listening Time'].sum().reset_index()
    average_monthly_sums['Date'] = average_monthly_sums['Date'].astype(str)
    json_data['users'][0]["average_listening_time"]["dataYear"] = average_monthly_sums.to_dict(orient="records")

    # Calculate hourly sums
    hourly_sums = df.groupby(df['Date'].dt.hour)['Listening Time'].mean().reset_index()
    hourly_sums = hourly_sums[["Date", "Listening Time"]].rename(
        columns={"Date": "Hour", "Listening Time": "Average Listening Time"})
    json_data['users'][0]["average_listening_time"]["dataDay"] = hourly_sums.to_dict(orient="records")

    # Serializing json
    output_json = json.dumps(json_data, ensure_ascii=False, indent=4)

    # Writing to output JSON file
    with open(output_filename, "w", encoding='utf8') as outfile:
        outfile.write(output_json)

    print(f"Data has been processed and saved to {output_filename}")
