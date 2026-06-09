require("dotenv").config();
const cloudinary = require("cloudinary").v2;

cloudinary.config({
    cloud_name: process.env.cloud_name,
    api_key: process.env.api_key,
    api_secret: process.env.api_secret,
});

(async () => {
    try {
        const result = await cloudinary.api.ping();
        console.log("SUCCESS:", result);
    } catch (err) {
        console.error("PING ERROR:", err);
    }
})();