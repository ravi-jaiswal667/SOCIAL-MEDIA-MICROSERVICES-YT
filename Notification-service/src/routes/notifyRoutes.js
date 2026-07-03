const express = require("express");
const router = express.Router();
const { getNotifications } = require('../controllers/notifyController');
const { authenticRequest } = require("../middlewares/authMiddleware");
router.use(authenticRequest);
router.get('/get', getNotifications);

module.exports = router;