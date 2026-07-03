const { Server } = require("socket.io");

// Initialize server
let onlineUsers = new Map();
let io;
function intializeSocket(server) {
    io = new Server(server, {
        cors: {
            origin: "*"
        }
    });
    // listen for connections
    io.on("connection", (socket) => {
        console.log("Connected: ", socket.id);
        socket.on("register", (userId) => {

            console.log("Register event received");

            console.log("UserId:", userId);

            onlineUsers.set(userId, socket.id);

            console.log(onlineUsers);

        });
        socket.on("disconnect", () => {
            for (const [userId, socketId] of onlineUsers.entries()) {
                if (socketId == socket.id) {
                    onlineUsers.delete(userId);
                    break;
                }
            }
        });
    });
}

module.exports = { intializeSocket, onlineUsers, getIO: () => io };

