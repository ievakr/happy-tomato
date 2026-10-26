import React from 'react';
import Icon from '../common/Icon';
import { useTranslation } from '../../i18n/LanguageContext';
import { useDaySky } from '../../hooks/useDaySky';
import { formatTemperature } from '../../utils/daySky';

function WeatherIcon({ kind }) {
  if (kind === 'clear') {
    return <Icon name="wb_sunny" className="daily-sky-icon" />;
  }
  if (kind === 'partly' || kind === 'cloudy' || kind === 'fog') {
    return <Icon name="cloud" className="daily-sky-icon" />;
  }
  if (kind === 'snow') {
    return <Icon name="ac_unit" className="daily-sky-icon" />;
  }
  if (kind === 'storm') {
    return <Icon name="thunderstorm" className="daily-sky-icon" />;
  }
  return (
    <svg className="daily-sky-icon daily-sky-icon--rain" viewBox="0 0 24 24" aria-hidden="true">
      <path
        d="M7.2 15.2h8.8a3.2 3.2 0 0 0 .3-6.4 4.6 4.6 0 0 0-8.8 1.3 2.8 2.8 0 0 0-.3 5.1z"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinejoin="round"
      />
      <path
        d="M9 17.6v2.1M12 17.6v2.1M15 17.6v2.1"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
      />
    </svg>
  );
}

export default function DailySkyChips({ day }) {
  const { t } = useTranslation();
  const { phaseKey, weather } = useDaySky(day);
  const temperature = weather ? formatTemperature(weather.temp) : '';

  return (
    <div className="daily-sky">
      <span className="daily-sky-chip">
        <Icon name="dark_mode" className="daily-sky-icon" />
        <span>{t(`calendar.moon.${phaseKey}`)}</span>
      </span>
      {temperature && (
        <span className="daily-sky-chip">
          <WeatherIcon kind={weather.kind} />
          <span>{temperature}</span>
        </span>
      )}
    </div>
  );
}
