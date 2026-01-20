import type { CategoryType, Location } from '../types';

const TYPE_MAP: Record<string, CategoryType> = {
  cafe: 'cafe',
  bar: 'bar',
  restaurant: 'restaurant',
  museum: 'museum',
  art_gallery: 'art_gallery',
  spa: 'spa',
  gym: 'gym',
  bakery: 'bakery',
  church: 'church',
  tourist_attraction: 'tourist_attraction',
  park: 'park',
  book_store: 'book_store',
  night_club: 'night_club',
  library: 'library',
  shopping_mall: 'shopping_mall',
  movie_theater: 'movie_theater',
  casino: 'casino',
  amusement_park: 'amusement_park',
  stadium: 'stadium',
  bowling_alley: 'bowling_alley',
  aquarium: 'aquarium',
  zoo: 'zoo',
  synagogue: 'synagogue',
};

const parseCSVRow = (row: string): string[] => {
  const result: string[] = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < row.length; i++) {
    const char = row[i];

    if (char === '"') {
      inQuotes = !inQuotes;
    } else if (char === ',' && !inQuotes) {
      result.push(current.trim());
      current = '';
    } else {
      current += char;
    }
  }
  result.push(current.trim());

  return result;
};

const getHeaderIndex = (headers: string[], name: string) => {
  const index = headers.indexOf(name);
  if (index === -1) {
    throw new Error(`CSV is missing required header: ${name}`);
  }
  return index;
};

export const parseLocationsCSV = (csvText: string): Location[] => {
  const lines = csvText.trim().split('\n').filter(Boolean);
  if (lines.length < 2) return [];

  const headers = parseCSVRow(lines[0]);

  const nameIdx = getHeaderIndex(headers, 'Name');
  const typeIdx = getHeaderIndex(headers, 'Type');
  const latIdx = getHeaderIndex(headers, 'Latitude');
  const lngIdx = getHeaderIndex(headers, 'Longitude');
  const addressIdx = getHeaderIndex(headers, 'Address');
  const ratingIdx = headers.indexOf('Rating');
  const descIdx = headers.indexOf('Description');
  const photoIdx = headers.indexOf('Photo URL');
  const mapsIdx = headers.indexOf('Google Maps Link');

  const locations: Location[] = [];

  for (let i = 1; i < lines.length; i++) {
    const row = parseCSVRow(lines[i]);
    if (row.length < 5) continue;

    const typeRaw = row[typeIdx]?.toLowerCase().trim();
    if (!typeRaw) continue;

    const category = TYPE_MAP[typeRaw] ?? 'cafe';

    const lat = Number.parseFloat(row[latIdx]);
    const lng = Number.parseFloat(row[lngIdx]);
    if (!Number.isFinite(lat) || !Number.isFinite(lng)) continue;

    const ratingStr = ratingIdx >= 0 ? row[ratingIdx] : undefined;
    const rating = ratingStr ? Number.parseFloat(ratingStr) : undefined;

    const address = row[addressIdx]?.replace(/^"|"$/g, '') || '';

    let description = descIdx >= 0 ? row[descIdx]?.replace(/^"|"$/g, '') || '' : '';
    description = description
      .replace(/Rating:\s*[\d.]+\.?\s*/gi, '')
      .replace(/\.\s*Rating:\s*[\d.]+\.?\s*/gi, '')
      .replace(/,\s*Rating:\s*[\d.]+\.?\s*/gi, '')
      .replace(/\s*Rating:\s*[\d.]+\.?\s*/gi, '')
      .replace(/\.\s*$/, '')
      .trim();

    if (!description || description.length < 10) {
      description = address || '';
    }

    locations.push({
      id: i,
      name: row[nameIdx]?.replace(/^"|"$/g, '') || `Location ${i}`,
      category,
      address,
      description,
      coordinates: [lng, lat],
      rating: Number.isFinite(rating) ? rating : undefined,
      photoUrl: photoIdx >= 0 ? row[photoIdx] || undefined : undefined,
      googleMapsLink: mapsIdx >= 0 ? row[mapsIdx] || undefined : undefined,
    });
  }

  return locations;
};
