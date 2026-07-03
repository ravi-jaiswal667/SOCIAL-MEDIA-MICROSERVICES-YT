const express = require("express");
const { authenticRequest } = require("../middlewares/authMiddleware");
const { createPost, getAllPost, getPost, deletePost, likePost, commentPost, getFeedPosts, topLikedPosts } = require('../controllers/post-controller');
const routes = express.Router();
console.log("PostRoutes");

// every request will pass through this authMiddleware
routes.use(authenticRequest);

routes.post('/createpost', createPost);
routes.get('/get-posts', getAllPost);
routes.get('/post/:id', getPost);
routes.delete('/delete/:id', deletePost);
routes.post('/like/:id', likePost);
routes.post('/comment/:id', commentPost);
routes.get('/top-liked', topLikedPosts);

routes.post('/feed', getFeedPosts);

module.exports = routes;

