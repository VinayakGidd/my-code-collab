// models/Room.js
const mongoose = require('mongoose');

const RoomSchema = new mongoose.Schema({
    roomId: { type: String, required: true, unique: true },
    code: { type: String, default: "" }, // Stores the code
    language: { type: String, default: "javascript" }, // Stores current language
    createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Room', RoomSchema);