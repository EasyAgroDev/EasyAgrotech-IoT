const mongoose = require("mongoose");

// Thing Schema
const ThingSchema = new mongoose.Schema({
  name: { type: String, required: true },
  thingId: { type: String, required: true },
  description: String,
  createdAt: { type: Date, default: Date.now },
});

// Group Schema
const GroupSchema = new mongoose.Schema({
  name: { type: String, required: true },
  things: [ThingSchema],
  createdAt: { type: Date, default: Date.now },
});

// User Schema
const UserSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true },
  phone: { type: String, required: true },
  city: String,
  username: { type: String, required: true },
  password: { type: String, required: true },
  groups: [GroupSchema],
  description: String,
  createdAt: { type: Date, default: Date.now },
});

module.exports = { UserSchema };