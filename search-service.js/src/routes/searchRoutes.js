const express = require('express');
const { authenticRequest } = require('../middlewares/authMiddleware');
const { searchPostController } = require('../controllers/SearchController');
const router = express.Router();

router.use(authenticRequest);

router.get('/post', searchPostController);

module.exports = router;
