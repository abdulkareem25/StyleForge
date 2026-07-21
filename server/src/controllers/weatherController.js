const { mapWeatherToSelection } = require('../services/weatherService');

async function getCurrentWeather(req, res) {
  try {
    const lat = Number(req.query.lat);
    const lon = Number(req.query.lon);

    if (!Number.isFinite(lat) || !Number.isFinite(lon)) {
      return res.status(400).json({
        success: false,
        data: null,
        error: 'lat and lon query parameters are required',
      });
    }

    const apiKey = process.env.WEATHER_API_KEY;
    if (!apiKey) {
      return res.status(200).json({
        success: false,
        data: null,
        error: 'Weather service is not configured',
      });
    }

    const url = new URL('https://api.openweathermap.org/data/2.5/weather');
    url.searchParams.set('lat', String(lat));
    url.searchParams.set('lon', String(lon));
    url.searchParams.set('appid', apiKey);
    url.searchParams.set('units', 'metric');

    const response = await fetch(url, { signal: AbortSignal.timeout(8000) });
    if (!response.ok) {
      throw new Error(`Weather API returned ${response.status}`);
    }

    const payload = await response.json();
    const weatherSelection = mapWeatherToSelection({
      temperature: payload.main?.temp,
      weather: payload.weather?.[0]?.main,
    });

    return res.json({
      success: true,
      data: {
        weather: weatherSelection,
        temperature: payload.main?.temp,
        source: 'openweather',
      },
      error: null,
    });
  } catch (error) {
    console.warn('[weather] lookup failed:', error.message || error);
    return res.status(200).json({
      success: false,
      data: null,
      error: 'Weather lookup unavailable',
    });
  }
}

module.exports = {
  getCurrentWeather,
};
