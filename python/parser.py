import googlemaps
import pandas as pd
import time

# --- SETTINGS ---
API_KEY = 'AIzaSyB7-1_i-bxLcxRGvsy9O97R0twuZJcqzG0'

# Center: Theresienstraße 90, 80333 München
CENTER_LAT = 48.1523
CENTER_LNG = 11.5658
SEARCH_RADIUS = 2000  # 2 km per search point (smaller for better coverage)

# Grid of search points to cover 5km radius area
SEARCH_POINTS = [
    (CENTER_LAT, CENTER_LNG),                    # Center
    (CENTER_LAT + 0.018, CENTER_LNG),            # North
    (CENTER_LAT - 0.018, CENTER_LNG),            # South
    (CENTER_LAT, CENTER_LNG + 0.025),            # East
    (CENTER_LAT, CENTER_LNG - 0.025),            # West
    (CENTER_LAT + 0.013, CENTER_LNG + 0.018),    # NE
    (CENTER_LAT + 0.013, CENTER_LNG - 0.018),    # NW
    (CENTER_LAT - 0.013, CENTER_LNG + 0.018),    # SE
    (CENTER_LAT - 0.013, CENTER_LNG - 0.018),    # SW
]

# Place types to collect
PLACE_TYPES = [
    'cafe', 'bar', 'restaurant', 'museum', 'art_gallery',
    'night_club', 'bakery', 'book_store', 'library',
    'movie_theater', 'park', 'tourist_attraction',
    'shopping_mall', 'spa', 'gym', 'stadium',
    'church', 'synagogue', 'zoo', 'aquarium',
    'amusement_park', 'bowling_alley', 'casino'
]

# -----------------

def get_places():
    gmaps = googlemaps.Client(key=API_KEY)
    all_places = []
    seen_place_ids = set()

    print(f"Starting search with {len(SEARCH_POINTS)} grid points, {SEARCH_RADIUS/1000} km radius each...")

    for p_type in PLACE_TYPES:
        print(f"--> Searching category: {p_type}")

        for point_idx, (lat, lng) in enumerate(SEARCH_POINTS):
            next_page_token = None

            while True:
                try:
                    results = gmaps.places_nearby(
                        location=(lat, lng),
                        radius=SEARCH_RADIUS,
                        type=p_type,
                        language='en',
                        page_token=next_page_token
                    )
                except Exception as e:
                    print(f"API Error: {e}")
                    break

                for place in results.get('results', []):
                    place_id = place.get('place_id')

                    # Skip duplicates
                    if place_id in seen_place_ids:
                        continue
                    seen_place_ids.add(place_id)

                    name = place.get('name')
                    p_lat = place['geometry']['location']['lat']
                    p_lng = place['geometry']['location']['lng']
                    rating = place.get('rating', 'No rating')
                    address = place.get('vicinity', 'No address')

                    # Get place details for description
                    description = ""
                    try:
                        details = gmaps.place(place_id, language='en', fields=['editorial_summary'])
                        result = details.get('result', {})
                        editorial = result.get('editorial_summary', {})
                        description = editorial.get('overview', '')
                    except:
                        pass

                    if not description:
                        description = f"{p_type.capitalize()}. Rating: {rating}."

                    # Photo URL
                    photo_url = ""
                    if 'photos' in place:
                        photo_reference = place['photos'][0]['photo_reference']
                        photo_url = f"https://maps.googleapis.com/maps/api/place/photo?maxwidth=400&photoreference={photo_reference}&key={API_KEY}"

                    all_places.append({
                        'Name': name,
                        'Type': p_type,
                        'Latitude': p_lat,
                        'Longitude': p_lng,
                        'Address': address,
                        'Rating': rating,
                        'Description': description,
                        'Photo URL': photo_url,
                        'Google Maps Link': f"https://www.google.com/maps/place/?q=place_id:{place_id}"
                    })

                    print(f"    {name}")

                # Pagination - move to next page
                next_page_token = results.get('next_page_token')
                if not next_page_token:
                    break

                # Google requires 2 second delay before requesting next page
                time.sleep(2)
            
    return all_places

if __name__ == "__main__":
    data = get_places()

    # Save to CSV
    df = pd.DataFrame(data)
    # Remove duplicates (same place can be cafe and restaurant)
    df = df.drop_duplicates(subset=['Name', 'Latitude'])

    filename = 'munich_places_db.csv'
    df.to_csv(filename, index=False)

    print(f"\nDONE! Total places collected: {len(df)}")
    print(f"File saved as: {filename}")