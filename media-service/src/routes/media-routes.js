const express = require('express');
const router = express.Router();
const logger = require('../utils/logger');
const { authenticRequest } = require("../middlewares/authMiddleware");
const multer = require('multer');
const { uploadMedia, getAllMedia } = require('../controllers/media-controller');

// configure multer for file upload
const upload = multer({
    storage: multer.memoryStorage(),
    limits: {
        fileSize: 5 * 1024 * 1024,
    }
}).single('file');

router.post('/upload', authenticRequest, (req, res, next) => {
    upload(req, res, function (err) {
        logger.error("Multer error while uploading", err);
        if (err instanceof multer.MulterError) {
            res.status(400).json({
                message: "Multer error while uploading",
                error: err.message,
                stack: err.stack
            })
        }
        else if (err) {
            logger.error("Unknown error while uploading", err);
            res.status(500).json({
                message: "Unknown error while uploading",
                error: err.message,
                stack: err.stack
            })
        }
        if (!req.file) {
            res.status(400).json({
                message: "No file found!!",
            })
        }
        next();
    })
}, uploadMedia);

router.get('/get', getAllMedia);

module.exports = router;




