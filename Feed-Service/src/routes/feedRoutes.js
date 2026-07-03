const express = require("express");
const { authenticRequest } = require("../../../follow-service/src/middlewares/authMiddleware");
const { getFeed } = require('../controllers/feedController');
const router = express.Router();

router.use(authenticRequest);
console.log("feedRoutes");
router.get('/get', getFeed);

module.exports = router;

