const WEATHER_SELECTIONS = {
  summer: 'summer',
  winter: 'winter',
  monsoon: 'monsoon',
  any: 'any',
};

function mapWeatherToSelection(weatherData = {}) {
  const temperature = Number(weatherData.temperature);
  const weatherCode = (weatherData.weather || '').toLowerCase();

  if (weatherCode.includes('snow')) {
    return WEATHER_SELECTIONS.winter;
  }

  if (weatherCode.includes('rain') || weatherCode.includes('drizzle') || weatherCode.includes('thunder')) {
    return WEATHER_SELECTIONS.monsoon;
  }

  if (!Number.isNaN(temperature) && temperature <= 12) {
    return WEATHER_SELECTIONS.winter;
  }

  if (!Number.isNaN(temperature) && temperature >= 28) {
    return WEATHER_SELECTIONS.summer;
  }

  return WEATHER_SELECTIONS.any;
}

module.exports = {
  mapWeatherToSelection,
};
