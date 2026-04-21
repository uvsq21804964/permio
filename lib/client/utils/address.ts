export type AddressDetails = {
  formattedAddress: string;
  lat: number;
  lng: number;
  street: string;
  streetNumber: string;
  postalCode: string;
  city: string;
  country: string;
  countryCode: string;
  googlePlaceId?: string;
};

type ProfileAddressSource = {
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
};

export type GoogleAddressComponent = {
  long_name?: string;
  short_name?: string;
  types?: string[];
};

export type GooglePlaceResult = {
  formatted_address?: string;
  geometry?: {
    location?: {
      lat: () => number;
      lng: () => number;
    };
  };
  address_components?: GoogleAddressComponent[];
  place_id?: string;
};

export function extractAddressComponent(
  components: GoogleAddressComponent[] | undefined,
  type: string,
  useShort?: boolean,
): string {
  if (!components) return '';

  const found = components.find((component) => component.types?.includes(type));
  if (!found) return '';

  return useShort ? found.short_name ?? '' : found.long_name ?? '';
}

export function mapGooglePlaceToAddress(
  place: GooglePlaceResult,
  fallbackFormattedAddress = '',
): AddressDetails | null {
  if (!place.geometry?.location) {
    return null;
  }

  const components = place.address_components;

  return {
    formattedAddress: place.formatted_address ?? fallbackFormattedAddress,
    lat: place.geometry.location.lat(),
    lng: place.geometry.location.lng(),
    street: extractAddressComponent(components, 'route'),
    streetNumber: extractAddressComponent(components, 'street_number'),
    postalCode: extractAddressComponent(components, 'postal_code'),
    city:
      extractAddressComponent(components, 'locality') ||
      extractAddressComponent(components, 'postal_town'),
    country: extractAddressComponent(components, 'country'),
    countryCode: extractAddressComponent(components, 'country', true),
    googlePlaceId: place.place_id,
  };
}

export function toAddressAssociationPayload(
  address: AddressDetails,
  rawInput: string,
) {
  return {
    formattedAddress: address.formattedAddress,
    lat: address.lat,
    lng: address.lng,
    street: address.street,
    streetNumber: address.streetNumber,
    postalCode: address.postalCode,
    city: address.city,
    country: address.country,
    countryCode: address.countryCode,
    googlePlaceId: address.googlePlaceId,
    rawInput,
  };
}

export function matchesFormattedAddress(
  address: AddressDetails | null,
  value: string,
) {
  return Boolean(address && address.formattedAddress === value);
}

export function mapProfileAddressToDetails(
  source: ProfileAddressSource,
): AddressDetails | null {
  if (!source.formatted_address || source.lat == null || source.lng == null) {
    return null;
  }

  return {
    formattedAddress: source.formatted_address,
    lat: source.lat,
    lng: source.lng,
    street: source.street ?? '',
    streetNumber: source.street_number ?? '',
    postalCode: source.postal_code ?? '',
    city: source.city ?? '',
    country: source.country ?? '',
    countryCode: source.country_code ?? '',
    googlePlaceId: source.google_place_id ?? undefined,
  };
}
