const test = require('node:test');
const assert = require('node:assert/strict');

const { mapWeatherToSelection } = require('../src/services/weatherService');

test('maps warm conditions to summer', () => {
  assert.equal(
    mapWeatherToSelection({ temperature: 33, weather: 'Clear' }),
    'summer',
  );
});

test('maps cold conditions to winter', () => {
  assert.equal(
    mapWeatherToSelection({ temperature: 5, weather: 'Snow' }),
    'winter',
  );
});

test('maps rainy conditions to monsoon', () => {
  assert.equal(
    mapWeatherToSelection({ temperature: 24, weather: 'Rain' }),
    'monsoon',
  );
});

test('defaults to any when conditions are neutral', () => {
  assert.equal(
    mapWeatherToSelection({ temperature: 21, weather: 'Clouds' }),
    'any',
  );
});
