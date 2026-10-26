import dayjs from 'dayjs';

const SYNODIC_MONTH_DAYS = 29.530588853;
// A known new moon, used to count lunar age.
const KNOWN_NEW_MOON_MS = Date.UTC(2000, 0, 6, 18, 14, 0);

const PHASE_KEYS = [
  'new',
  'waxingCrescent',
  'firstQuarter',
  'waxingGibbous',
  'full',
  'waningGibbous',
  'lastQuarter',
  'waningCrescent',
];

export function moonPhaseKey(day) {
  const days = (dayjs(day).valueOf() - KNOWN_NEW_MOON_MS) / 86400000;
  const age = ((days % SYNODIC_MONTH_DAYS) + SYNODIC_MONTH_DAYS) % SYNODIC_MONTH_DAYS;
  const index = Math.floor((age / SYNODIC_MONTH_DAYS) * 8 + 0.5) % 8;
  return PHASE_KEYS[index];
}

export function weatherKind(code) {
  const n = Number(code);
  if (n === 0) return 'clear';
  if (n === 1 || n === 2) return 'partly';
  if (n === 3) return 'cloudy';
  if (n === 45 || n === 48) return 'fog';
  if ((n >= 71 && n <= 77) || n === 85 || n === 86) return 'snow';
  if (n >= 95) return 'storm';
  return 'rain';
}

export function formatTemperature(celsius) {
  const rounded = Math.round(Number(celsius));
  if (!Number.isFinite(rounded)) return '';
  const sign = rounded > 0 ? '+' : '';
  return `${sign}${rounded} °C`;
}

export function weatherForDay(forecast, day) {
  if (!forecast) return null;
  const key = dayjs(day).format('YYYY-MM-DD');
  const isCurrentDay = key === dayjs().format('YYYY-MM-DD');
  if (isCurrentDay && forecast.current && forecast.current.temperature_2m != null) {
    return {
      kind: weatherKind(forecast.current.weather_code),
      temp: forecast.current.temperature_2m,
    };
  }
  const times = forecast.daily?.time || [];
  const index = times.indexOf(key);
  if (index < 0) return null;
  const temp = forecast.daily.temperature_2m_max?.[index];
  if (temp == null) return null;
  return {
    kind: weatherKind(forecast.daily.weather_code?.[index]),
    temp,
  };
}
