import { useQuery } from '@tanstack/react-query';
import { moonPhaseKey, weatherForDay } from '../utils/daySky';

function roundCoord(value) {
  return Math.round(value * 100) / 100;
}

function readDeviceLocation() {
  return new Promise((resolve) => {
    if (typeof navigator === 'undefined' || !navigator.geolocation) {
      resolve(null);
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) =>
        resolve({
          latitude: pos.coords.latitude,
          longitude: pos.coords.longitude,
        }),
      () => resolve(null),
      { enableHighAccuracy: false, timeout: 8000, maximumAge: 60 * 60 * 1000 },
    );
  });
}

async function resolveLocation() {
  const device = await readDeviceLocation();
  if (device) return device;

  const res = await fetch('https://get.geojs.io/v1/ip/geo.json');
  if (!res.ok) throw new Error('location unavailable');
  const data = await res.json();
  const latitude = Number(data.latitude);
  const longitude = Number(data.longitude);
  if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) {
    throw new Error('location unavailable');
  }
  return { latitude, longitude };
}

async function fetchForecast(latitude, longitude) {
  const params = new URLSearchParams({
    latitude: String(latitude),
    longitude: String(longitude),
    current: 'temperature_2m,weather_code',
    daily: 'weather_code,temperature_2m_max',
    timezone: 'auto',
    forecast_days: '16',
    past_days: '92',
  });
  const res = await fetch(`https://api.open-meteo.com/v1/forecast?${params}`);
  if (!res.ok) throw new Error('weather unavailable');
  return res.json();
}

export function useDaySky(day) {
  const locationQuery = useQuery({
    queryKey: ['sky-location'],
    queryFn: resolveLocation,
    staleTime: 6 * 60 * 60 * 1000,
    retry: false,
  });

  const latitude = locationQuery.data ? roundCoord(locationQuery.data.latitude) : null;
  const longitude = locationQuery.data ? roundCoord(locationQuery.data.longitude) : null;

  const forecastQuery = useQuery({
    queryKey: ['sky-weather', latitude, longitude],
    queryFn: () => fetchForecast(latitude, longitude),
    enabled: latitude != null && longitude != null,
    staleTime: 30 * 60 * 1000,
    retry: 1,
  });

  return {
    phaseKey: moonPhaseKey(day),
    weather: weatherForDay(forecastQuery.data, day),
  };
}
