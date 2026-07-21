const router = require('express').Router();
const { getCurrentWeather } = require('../controllers/weatherController');

router.get('/', getCurrentWeather);

module.exports = router;
