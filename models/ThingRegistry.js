const mongoose = require("mongoose");

const ThingRegistrySchema = new mongoose.Schema({
  thingId: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model("ThingRegistry", ThingRegistrySchema);
