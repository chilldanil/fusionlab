export type CategoryType =
  | 'cafe'
  | 'bar'
  | 'restaurant'
  | 'museum'
  | 'art_gallery'
  | 'spa'
  | 'gym'
  | 'bakery'
  | 'church'
  | 'tourist_attraction'
  | 'park'
  | 'book_store'
  | 'night_club'
  | 'library'
  | 'shopping_mall'
  | 'movie_theater'
  | 'casino'
  | 'amusement_park'
  | 'stadium'
  | 'bowling_alley'
  | 'aquarium'
  | 'zoo'
  | 'synagogue';

export interface Location {
  id: number;
  name: string;
  category: CategoryType;
  address: string;
  description: string;
  coordinates: [number, number];
  rating?: number;
  photoUrl?: string;
  googleMapsLink?: string;
}
