// const mongoose = require('mongoose');
// const passportLocalMongoose = require('passport-local-mongoose');

// // ======================
// // User Schema
// // ======================
// const UserSchema = new mongoose.Schema({
//   name: { type: String, required: true },
//   email: { type: String, required: true, unique: true },
//   username: { type: String, required: true, unique: true },
//   password: { type: String, required: true, unique: true },
//   phoneno: { type: String, required: true, unique: true },
//   city: { type: String, required: true, unique: true },
//   description: { type: String, required: true, unique: true },
//   thingid: { type: Number, required: true, unique: true },
//   remoteid: { type: String, required: true, unique: true },
//   group: { type: String, required: true, unique: true },
//   info: { type: mongoose.Schema.Types.Mixed } // flexible user info
// });

// // ======================
// // Thing Schema
// // ======================
// const ThingSchema = new mongoose.Schema({
//   name: { type: String, required: true },
//    thingid: { type: Number, required: true, unique: true },
//   description: String
// });

// // ======================
// // Group Schema
// // ======================
// const GroupSchema = new mongoose.Schema({
//   name: { type: String, required: true },
//   users: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }], // multiple users
//   things: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Thing' }] // multiple things
// });

// // ======================
// // Project Schema
// // ======================
// const ProjectSchema = new mongoose.Schema({
//   name: { type: String, required: true },
//   users: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
//   groups: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Group' }],
//   things: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Thing' }]
// });

// // ======================
// // Admin Schema
// // ======================
// const AdminSchema = new mongoose.Schema({
//   username: { type: String, required: true, unique: true },
//   // password will be handled by passport-local-mongoose
//   projects: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Project' }]
// });

// // APPLY passport-local-mongoose to Admin for authentication
// AdminSchema.plugin(passportLocalMongoose, { usernameField: 'username' });

// // ======================
// // Create Models
// // ======================
// const User = mongoose.model('User', UserSchema);
// const Thing = mongoose.model('Thing', ThingSchema);
// const Group = mongoose.model('Group', GroupSchema);
// const Project = mongoose.model('Project', ProjectSchema);
// const Admin = mongoose.model('Admin', AdminSchema);

// // ======================
// // Export all models
// // ======================
// module.exports = { User, Thing, Group, Project, Admin };
