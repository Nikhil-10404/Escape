import * as Location from "expo-location";

export async function getPreciseLocationPayload() {
  // 1) ensure permission
  const { status } = await Location.getForegroundPermissionsAsync();
  if (status !== "granted") {
    throw new Error("Location permission not granted");
  }

  // 2) get GPS coords
  const position = await Location.getCurrentPositionAsync({
    accuracy: Location.Accuracy.Highest,
  });

  const { latitude, longitude } = position.coords;

  // 3) reverse geocode (city/state/country)
  const places = await Location.reverseGeocodeAsync({
    latitude,
    longitude,
  });

  const place = places?.[0];

  return {
    latitude,
    longitude,
    city: place?.city || "",
    region: place?.region || "",
    country: place?.country || "",
  };
}
