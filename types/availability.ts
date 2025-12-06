// types/availability.ts

export type Kind = 'available' | 'unavailable';

export type DayAvailability = {
  id: string;
  userId: string;
  date: string; // 'YYYY-MM-DD'
  startTime: string; // 'HH:MM'
  endTime: string; // 'HH:MM'
  kind: Kind;
};

export type DefaultAvailability = {
  id: string;
  userId: string;
  dayOfWeek: number; // 0 = Lundi, 1 = Mardi, ...
  startTime: string;
  endTime: string;
};

export type Slot = {
  id: string;
  dogsitterUserId: string | null;
  clientUserId: string | null;
  serviceId: string | null;
  date: string;
  startTime: string;
  endTime: string;
  durationMinutes: number;
  timeRangeLabel: string | null;

  formatted_address: string | null;
  lat: number | null;
  lng: number | null;
  street: string | null;
  street_number: string | null;
  postal_code: string | null;
  city: string | null;
  country: string | null;
  country_code: string | null;
  google_place_id: string | null;
  raw_input: string | null;
  address_label: string | null;

  clientName: string | null; // SELECT u_client.name AS "clientName"
  dogsitterName: string | null; // SELECT u_dogsitter.name AS "dogsitterName"
  serviceName: string | null; // SELECT sp.name AS "serviceName"
  servicePrice: number | string | null; // SELECT sp.price AS "servicePrice"
};

// Ajoute ceci dans @/types/availability.ts
export interface Travel {
  id: string;

  dogsitterUserId: string;
  clientUserId: string;

  // plus de serviceId ici

  date: string;
  startTime: string;
  endTime: string;
  durationMinutes: number;
  timeRangeLabel: string | null;

  // Adresse côté CLIENT (destination)
  client_formatted_address: string | null;
  client_lat: number | null;
  client_lng: number | null;
  client_street: string | null;
  client_street_number: string | null;
  client_postal_code: string | null;
  client_city: string | null;
  client_country: string | null;
  client_country_code: string | null;
  client_google_place_id: string | null;
  client_raw_input: string | null;
  client_address_label: string | null;
  client_is_primary: boolean;

  // Adresse côté DOGSITTER (origine)
  dogsitter_formatted_address: string | null;
  dogsitter_lat: number | null;
  dogsitter_lng: number | null;
  dogsitter_street: string | null;
  dogsitter_street_number: string | null;
  dogsitter_postal_code: string | null;
  dogsitter_city: string | null;
  dogsitter_country: string | null;
  dogsitter_country_code: string | null;
  dogsitter_google_place_id: string | null;
  dogsitter_raw_input: string | null;
  dogsitter_address_label: string | null;
  dogsitter_is_primary: boolean;

  createdAt: string;
  updatedAt: string;
}
