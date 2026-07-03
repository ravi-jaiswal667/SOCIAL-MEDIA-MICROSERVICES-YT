const express = require("express");
const { authenticRequest } = require("../middlewares/authMiddleware");
const { followTheUser, unfollowTheUser, getFollowing, topUsersByFollowers } = require('../controllers/followController')
const router = express.Router();

router.use(authenticRequest);

router.post('/followUser/:id', followTheUser);

router.post('/unfollowUser/:id', unfollowTheUser);

router.get('/followings/:id', getFollowing);

router.get('/GetTopUsers', topUsersByFollowers);

module.exports = router;

