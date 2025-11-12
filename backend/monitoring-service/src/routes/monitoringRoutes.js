const express = require('express');
const router = express.Router();
const {
  getCurrentProduction,
  getHistoricalData,
  createProductionData,
  getAlerts,
  acknowledgeAlert,
  resolveAlert,

} = require('../controllers/monitoringController');

router.get('/production/current', getCurrentProduction);
router.get('/production/historical', getHistoricalData);
router.post('/production', createProductionData);

router.get('/alerts', getAlerts);

router.patch('/alerts/:id/acknowledge', acknowledgeAlert);
router.patch('/alerts/:id/resolve', resolveAlert);

module.exports = router;