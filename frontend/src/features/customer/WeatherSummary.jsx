import { useEffect, useState } from 'react';
import { CloudSun, Wind } from 'lucide-react';
import { weatherApi } from '../../services/api.js';
import styles from './Customer.module.css';

function weatherDescription(code) {
  if (code === 0) return 'Clear sky';
  if (code <= 2) return 'Partly cloudy';
  if (code === 3) return 'Overcast';
  if (code === 45 || code === 48) return 'Fog';
  if (code >= 51 && code <= 57) return 'Drizzle';
  if (code >= 61 && code <= 67) return 'Rain';
  if (code >= 71 && code <= 77) return 'Snow';
  if (code >= 80 && code <= 82) return 'Rain showers';
  if (code === 85 || code === 86) return 'Snow showers';
  if (code >= 95) return 'Thunderstorms';
  return 'Current conditions';
}

export function WeatherSummary({ city }) {
  const [state, setState] = useState({ city: '', weather: null, error: false });
  const loading = state.city !== city;

  useEffect(() => {
    const controller = new AbortController();
    weatherApi
      .current(city, controller.signal)
      .then((weather) => setState({ city, weather, error: false }))
      .catch((error) => {
        if (error.code !== 'ERR_CANCELED')
          setState({ city, weather: null, error: true });
      });
    return () => controller.abort();
  }, [city]);

  if (loading)
    return (
      <div className={styles.weatherSummary} aria-live="polite">
        <CloudSun size={22} aria-hidden="true" />
        <p>Checking current conditions.</p>
      </div>
    );

  if (state.error)
    return (
      <div className={styles.weatherSummary} aria-live="polite">
        <CloudSun size={22} aria-hidden="true" />
        <p>Current weather is temporarily unavailable.</p>
      </div>
    );

  const { weather } = state;
  return (
    <section
      className={styles.weatherSummary}
      aria-label={`Weather in ${city}`}
    >
      <CloudSun size={24} aria-hidden="true" />
      <div>
        <p className={styles.weatherTemperature}>
          {Math.round(weather.temperature)}
          {weather.units.temperature}
        </p>
        <p>
          {weatherDescription(weather.weatherCode)}. Feels like{' '}
          {Math.round(weather.apparentTemperature)}
          {weather.units.temperature}.
        </p>
      </div>
      <p className={styles.weatherWind}>
        <Wind size={16} aria-hidden="true" />
        {Math.round(weather.windSpeed)} {weather.units.windSpeed}
      </p>
    </section>
  );
}
