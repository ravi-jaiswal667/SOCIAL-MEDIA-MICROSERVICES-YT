const express = require("express");
const { authenticRequest } = require("../middlewares/authMiddleware");
const { createPost, getAllPost, getPost, deletePost } = require('../controllers/post-controller');
const routes = express.Router();
console.log("PostRoutes");

// every request will pass through this authMiddleware
routes.use(authenticRequest);

routes.post('/createpost', createPost);
routes.get('/get-posts', getAllPost);
routes.get('/post/:id', getPost);
routes.delete('/delete/:id', deletePost);

module.exports = routes;

