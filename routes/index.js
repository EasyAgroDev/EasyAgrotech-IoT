// ==========================
// Imports & Setup
// ==========================
const express = require("express");
const router = express.Router();
const mongoose = require("mongoose"); // Required for DB operations
const { UserSchema } = require("../models/project"); // Generic User Schema
const { ObjectId } = require("mongodb");


// ==========================
// Utility: Fetch Users from Active Project
// ==========================
async function getAllUsersFromActiveProject(req) {
  const activeProject = req.session.activeProject;

  if (!activeProject) {
    throw new Error("No active project selected");
  }

  const collectionName = activeProject.toLowerCase().replace(/\s+/g, "_");

  const ProjectUser =
    mongoose.models[collectionName] ||
    mongoose.model(collectionName, UserSchema, collectionName);

  // Return all users
  return await ProjectUser.find({}).lean();
}

// --------------------------
// Admin Credentials (Dummy)
// --------------------------
const ADMIN_USERNAME = process.env.ADMIN_USERNAME;
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD;


// 🔒 APPLY PROTECTION HERE

function isAdmin(req, res, next) {
  if (req.session.isAdmin) return next();
  res.redirect("/admin");
}
// ==========================
// Utility Functions
// ==========================

// Generate unique 8-digit Thing ID
async function generateUniqueThingId() {
  let uniqueId;
  let exists = true;

  while (exists) {
    uniqueId = Math.floor(10000000 + Math.random() * 90000000).toString();
    exists = await User.exists({ "groups.things.thingId": uniqueId });
  }

  return uniqueId;
}


// ==========================
// PUBLIC ROUTES
// ==========================

// Home Page
router.get("/", (req, res) => {
  res.render("user_auth", { title: "Home" });
});

// Admin Login Page
router.get("/admin", (req, res) => {
  res.render("login", { title: "Login" });
});

// Example Admin Login (Commented Out)
router.post('/admin', (req, res) => {
  const { username, password } = req.body;
  if (username === ADMIN_USERNAME && password === ADMIN_PASSWORD) {
    req.session.isAdmin = true; // Save session
    res.redirect('/home');
  } else {
    res.redirect('/admin');
  }
});

// Admin LogOut 
router.get('/admin/logout', (req, res) => {
  req.session.destroy(err => {
    if (err) {
      console.error(err);
      return res.send('Error logging out');
    }
    res.redirect('/admin'); // Redirect to login page after logout
  });
});
// User Login ,Authentication
router.get("/user_auth", (req, res) => {
  res.render("user_auth", { title: "User Login", error: null });
});


router.post("/user_auth", async (req, res) => {
  try {
    const { username, password } = req.body;

    // Get all collections
    const collections = await mongoose.connection.db.listCollections().toArray();

    let foundUser = null;
    let foundCollection = null;

    for (const col of collections) {
      const collection = mongoose.connection.db.collection(col.name);
      const user = await collection.findOne({ username: username });

      if (user) {
        foundUser = user;
        foundCollection = col.name;
        break;
      }
    }

    if (!foundUser) {
      return res.render("user_auth", {
        title: "User Login",
        error: "User not found",
      });
    }

    if (foundUser.password !== password) {
      return res.render("user_auth", {
        title: "User Login",
        error: "Incorrect password",
      });
    }

    // ✅ Save authenticated user in session
    req.session.user = {
      _id: foundUser._id,
      username: foundUser.username,
      fromCollection: foundCollection
    };

    res.redirect("/app_data");

  } catch (err) {
    console.error(err);
    res.render("user_auth", { title: "User Login", error: "Something went wrong." });
  }
});


router.get("/app_data", async (req, res) => {
  try {
    const userSession = req.session.user;
    if (!userSession) return res.redirect("/user_auth");

    const collectionName = userSession.fromCollection;
    const collection = mongoose.connection.db.collection(collectionName);

    const userData = await collection.findOne({ _id: new ObjectId(userSession._id) });
    if (!userData) return res.render("app_data", { title: "Dashboard", error: "User data not found!" });

    // ✅ Collect all things and count total
    let allThings = [];
    if (userData.groups && userData.groups.length > 0) {
      userData.groups.forEach(group => {
        if (group.things && group.things.length > 0) {
          group.things.forEach(thing => {
            allThings.push({
              groupName: group.name,
              thingName: thing.name,
              thingId: thing.thingId,
              description: thing.description || "N/A"
            });
          });
        }
      });
    }

    const totalThings = allThings.length;

    res.render("app_data", {
      title: "Dashboard",
      user: userData,
      project: collectionName,
      totalThings,
      allThings
    });

  } catch (err) {
    console.error(err);
    res.status(500).send("Server Error");
  }
});


router.get("/app_data/profile", (req, res) => res.render("profile", { title: "Profile" }));




// ==========================
// APPLY ADMIN PROTECTION
// ==========================
router.use(isAdmin);


// ==========================
// ADMIN PROTECTED ROUTES
// ==========================

router.get('/home', async (req, res) => {
  try {
    let users = [];
    const activeProject = req.session.activeProject;

    if (activeProject) {
      const collectionName = activeProject.toLowerCase().replace(/\s+/g, "_");

      const ProjectUser =
        mongoose.models[collectionName] ||
        mongoose.model(collectionName, UserSchema, collectionName);

      users = await ProjectUser.find({}).lean();
    }

    res.render('index', { title: 'Home', users, activeProject });
  } catch (err) {
    console.error(err);
    res.status(500).send('Server Error');
  }
});


// ==========================
// User Routes
// ==========================

router.get("/user", async (req, res) => {
  try {
    const activeProject = req.session.activeProject;

    if (!activeProject) {
      return res.send(`
  <div style="
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    min-height: 100vh;
    background: linear-gradient(to right, #fbc2eb, #a6c1ee);
    font-family: Arial, sans-serif;
    text-align: center;
    padding: 20px;
  ">
    <div style="
      background-color: white;
      padding: 30px 40px;
      border-radius: 20px;
      box-shadow: 0 8px 20px rgba(0,0,0,0.2);
      max-width: 400px;
    ">
      <div style="font-size: 50px;">⚠️</div>
      <h2 style="color: #333; margin: 10px 0;">No Active Project</h2>
      <p style="color: #555; margin-bottom: 20px;">
        Please activate a project first to continue.
      </p>
      <a href="/project" style="
        display: inline-block;
        padding: 10px 20px;
        background-color: #6c63ff;
        color: white;
        text-decoration: none;
        border-radius: 10px;
        transition: background 0.3s;
      " onmouseover="this.style.backgroundColor='#5751d9'" onmouseout="this.style.backgroundColor='#6c63ff'">
        Go to Projects
      </a>
    </div>
  </div>
`);
    }

    // Convert project name to collection name
    const collectionName = activeProject.toLowerCase().replace(/\s+/g, "_");

    // Use existing or create model dynamically
    const ProjectUser =
      mongoose.models[collectionName] ||
      mongoose.model(collectionName, UserSchema, collectionName);

    // Fetch all users
    const allUsers = await ProjectUser.find({}).lean();

    res.render("user", {
      title: "User Management",
      users: allUsers,
      projectName: activeProject,
    });
  } catch (err) {
    console.error(err);
    res.status(500).send("❌ Error loading users");
  }
});
// Create User Page
router.get("/user/create_user", (req, res) => {
  res.render("create_user", { 
    error: null, 
    success: null, 
    formData: {} 
  });
});


// POST route to handle form submission
router.post("/user/save", async (req, res) => {
  try {
    const {
      name,
      email,
      phone,
      city,
      username,
      password,
      groupName,
      projectName,
      description
    } = req.body;

    // Validate required fields
    if (!projectName || !name || !email || !username || !password || !groupName || !phone) {
      return res.render("create_user", { error: "⚠️ All required fields must be provided!", formData: req.body, success: null });
    }

    // Check username across ALL collections (projects)
    const collections = await mongoose.connection.db.listCollections().toArray();
    for (let coll of collections) {
      const ProjectModel = mongoose.models[coll.name] || mongoose.model(coll.name, UserSchema, coll.name);
      const existingUser = await ProjectModel.findOne({ username });
      if (existingUser) {
        return res.render("create_user", { error: "⚠️ Username already exists in another project!", formData: req.body, success: null });
      }
    }

    // Generate collection name for the project
    const collectionName = projectName.toLowerCase().replace(/\s+/g, "_");
    const ProjectUser = mongoose.models[collectionName] || mongoose.model(collectionName, UserSchema, collectionName);

    // Check for duplicate user in current project (email or username)
    const existingInProject = await ProjectUser.findOne({ $or: [{ email }, { username }] });
    if (existingInProject) {
      return res.render("create_user", { error: "⚠️ User already exists in this project!", formData: req.body, success: null });
    }

    // Check for duplicate group name in this project
    const existingGroup = await ProjectUser.findOne({ "groups.name": groupName });
    if (existingGroup) {
      return res.render("create_user", { error: "⚠️ Group name already exists in this project!", formData: req.body, success: null });
    }

    // Create new user
    const newUser = new ProjectUser({
      name,
      email,
      phone,
      city,
      username,
      password,
      groups: [{ name: groupName, things: [] }],
      description
    });

    await newUser.save();

    // Render the same form with success message
    res.render("create_user", { success: `🎉 User successfully created in project: ${projectName}`, formData: {}, error: null });

  } catch (err) {
    console.error(err);
    res.render("create_user", { error: `❌ Server Error: ${err.message}`, formData: req.body, success: null });
  }
});



// User Edit 
// ✅ GET: Edit user form
router.get("/user/edit/:id", async (req, res) => {
  try {
    const activeProject = req.session.activeProject;
    if (!activeProject)
      return res.status(400).send("⚠️ No active project selected");

    const collectionName = activeProject.toLowerCase().replace(/\s+/g, "_");

    const ProjectUser =
      mongoose.models[collectionName] ||
      mongoose.model(collectionName, UserSchema, collectionName);

    const user = await ProjectUser.findById(req.params.id);
    if (!user) return res.status(404).send("⚠️ User not found");

    res.render("edit_user", { user });
  } catch (err) {
    console.error(err);
    res.status(500).send("Server error loading user");
  }
});

// POST: Update user details with inline validation
router.post("/user/edit/:id", async (req, res) => {
  try {
    const activeProject = req.session.activeProject;
    if (!activeProject)
      return res.status(400).send("⚠️ No active project selected");

    const collectionName = activeProject.toLowerCase().replace(/\s+/g, "_");

    const ProjectUser =
      mongoose.models[collectionName] ||
      mongoose.model(collectionName, UserSchema, collectionName);

    const { name, username, email, phone, city, password, description, groupNames } = req.body;

    const user = await ProjectUser.findById(req.params.id);
    if (!user) return res.status(404).send("⚠️ User not found");

    // Keep track of error messages
    let errors = [];

    // -----------------------------
    // Check uniqueness of phone
    // -----------------------------
    if (phone) {
      const existingPhone = await ProjectUser.findOne({
        phone,
        _id: { $ne: user._id },
      });
      if (existingPhone) errors.push("Phone number already exists");
    }

    // -----------------------------
    // Check uniqueness of username
    // -----------------------------
    if (username) {
      const existingUsername = await ProjectUser.findOne({
        username,
        _id: { $ne: user._id },
      });
      if (existingUsername) errors.push("Username already exists");
    }

    // -----------------------------
    // Check uniqueness of group names
    // -----------------------------
    let updatedGroups = [];
    if (groupNames) {
      const groupArray = Array.isArray(groupNames) ? groupNames : [groupNames];

      const allOtherGroups = await ProjectUser.aggregate([
        { $match: { _id: { $ne: user._id } } },
        { $unwind: "$groups" },
        { $project: { groupName: "$groups.name" } },
      ]);

      const existingGroupNames = allOtherGroups.map(g => g.groupName.toLowerCase());

      groupArray.forEach((gName, i) => {
        if (existingGroupNames.includes(gName.toLowerCase())) {
          errors.push(`Group name "${gName}" already exists`);
        } else {
          updatedGroups.push({ ...user.groups[i].toObject(), name: gName });
        }
      });

      // Detect duplicate group names in same user submission
      const duplicates = groupArray.filter((v, i, a) => a.indexOf(v) !== i);
      if (duplicates.length > 0) errors.push(`Duplicate group name "${duplicates[0]}" in your input`);
    }

    // If there are errors, re-render form with entered values & errors
    if (errors.length > 0) {
      return res.render("edit_user", {
        user: {
          _id: user._id,
          name,
          username,
          email,
          phone,
          city,
          password,
          description,
          groups: updatedGroups.length > 0 ? updatedGroups : user.groups,
        },
        errors,
      });
    }

    // -----------------------------
    // Update user info
    // -----------------------------
    user.name = name;
    user.username = username;
    user.email = email;
    user.phone = phone;
    user.city = city;
    user.password = password;
    user.description = description;

    if (updatedGroups.length > 0) {
      user.groups = updatedGroups;
    }

    await user.save();
    res.redirect("/user");
  } catch (err) {
    console.error(err);
    res.status(500).send("❌ Error updating user details");
  }
});

// User Delete
router.delete("/user/delete/:phone", async (req, res) => {
  try {
    const activeProject = req.session.activeProject;
    if (!activeProject) return res.status(400).send("No active project selected");

    const collectionName = activeProject.toLowerCase().replace(/\s+/g, "_");

    // Use dynamic model for this project
    const ProjectUser =
      mongoose.models[collectionName] ||
      mongoose.model(collectionName, UserSchema, collectionName);

    const phoneNumber = req.params.phone.trim();

    // Delete user
    const deletedUser = await ProjectUser.findOneAndDelete({ phone: phoneNumber });

    if (!deletedUser) return res.status(404).send("User not found");

    res.status(200).send("User deleted successfully");
  } catch (err) {
    console.error(err);
    res.status(500).send("Failed to delete user");
  }
});




// ==========================
// Group Routes
// ==========================

router.get("/group", async (req, res) => {
  try {
    const activeProject = req.session.activeProject;

    if (!activeProject) {
      return res.send(`
  <div style="
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    min-height: 100vh;
    background: linear-gradient(to right, #fbc2eb, #a6c1ee);
    font-family: Arial, sans-serif;
    text-align: center;
    padding: 20px;
  ">
    <div style="
      background-color: white;
      padding: 30px 40px;
      border-radius: 20px;
      box-shadow: 0 8px 20px rgba(0,0,0,0.2);
      max-width: 400px;
    ">
      <div style="font-size: 50px;">⚠️</div>
      <h2 style="color: #333; margin: 10px 0;">No Active Project</h2>
      <p style="color: #555; margin-bottom: 20px;">
        Please activate a project first to continue.
      </p>
      <a href="/project" style="
        display: inline-block;
        padding: 10px 20px;
        background-color: #6c63ff;
        color: white;
        text-decoration: none;
        border-radius: 10px;
        transition: background 0.3s;
      " onmouseover="this.style.backgroundColor='#5751d9'" onmouseout="this.style.backgroundColor='#6c63ff'">
        Go to Projects
      </a>
    </div>
  </div>
`);
    }

    // Convert project name to collection name
    const collectionName = activeProject.toLowerCase().replace(/\s+/g, "_");

    // Use existing or create model dynamically
    const ProjectUser =
      mongoose.models[collectionName] ||
      mongoose.model(collectionName, UserSchema, collectionName);

    // Fetch all users
    const allUsers = await ProjectUser.find({}).lean();

    res.render("group", {
      title: "Group Management",
      users: allUsers,
      projectName: activeProject,
    });
  } catch (err) {
    console.error(err);
    res.status(500).send("❌ Error loading users");
  }
});

// ==========================
// Project Routes
// ==========================

// Project List Page
router.get("/project", async (req, res) => {
  try {
    const collections = await mongoose.connection.db.listCollections().toArray();
    const projectNames = collections.map(col => col.name);
    const activeProject = req.session.activeProject || null;

    res.render("project", {
      title: "Project",
      projects: projectNames,
      activeProject
    });
  } catch (err) {
    console.error(err);
    res.status(500).send("Error fetching collections");
  }
});
// Create Project Page
router.get("/project/create_project", (req, res) =>
  res.render("create_project", { title: "Create Project" })
);
// Save New Project
router.post("/project/save", async (req, res) => {
  try {
    let { projectName } = req.body;
    if (!projectName) return res.status(400).send("Project name is required");

    // Sanitize project name
    projectName = projectName.trim().replace(/\s+/g, "_").toLowerCase();

    // Check if project exists
    const existingCollections = await mongoose.connection.db.listCollections({ name: projectName }).toArray();
    if (existingCollections.length > 0) return res.status(400).send("Project with this name already exists");

    // Create a new collection dynamically
    const projectSchema = new mongoose.Schema({
      data: Object,
      createdAt: { type: Date, default: Date.now }
    });

    mongoose.model(projectName, projectSchema);
    res.redirect("/project");
  } catch (err) {
    console.error(err);
    res.status(500).send("Error creating project");
  }
});
// Delete Project
router.get("/project/delete/:name", async (req, res) => {
  try {
    const collectionName = req.params.name;
    await mongoose.connection.db.dropCollection(collectionName);
    console.log(`Collection ${collectionName} deleted`);
    res.redirect("/project");
  } catch (err) {
    console.error("Error deleting collection:", err);
    res.status(500).send("Error deleting collection");
  }
});
// Activate Project
router.get("/project/use/:name", async (req, res) => {
  const projectName = req.params.name;
  req.session.activeProject = projectName;
  res.redirect("/project");
});
// Fetch All Projects (API)
router.get("/project/all", async (req, res) => {
  try {
    const collections = await mongoose.connection.db.listCollections().toArray();
    const projectNames = collections.map(col => col.name);
    res.json(projectNames);
  } catch (err) {
    console.error(err);
    res.status(500).send("Error fetching collections");
  }
});

// ==========================
// Thing Routes
// ==========================

// Create Thing Page
router.get("/project/create_thing", (req, res) =>
  res.render("create_thing", { title: "Create Thing" })
);
// Handle Thing Creation
router.post("/project/create_thing", async (req, res) => {
  try {
    const { thingName, thingId, thingDescription, groupName, projectName } = req.body;
    if (!thingName || !thingId || !thingDescription || !groupName || !projectName)
      return res.status(400).send("All fields are required");

    const collectionName = projectName.toLowerCase().replace(/\s+/g, "_");
    const ProjectUser = mongoose.models[collectionName] || mongoose.model(collectionName, UserSchema, collectionName);

    // Find user with the group
    const user = await ProjectUser.findOne({ "groups.name": groupName });
    if (!user) return res.status(404).send(`Group "${groupName}" not found in project "${projectName}"`);

    const group = user.groups.find(g => g.name === groupName);

    // Prevent duplicate Thing IDs
    const existingThing = await ProjectUser.findOne({ "groups.things.thingId": thingId });
    if (existingThing) return res.status(400).send("Thing ID already exists in this project");

    group.things.push({
      name: thingName,
      thingId,
      description: thingDescription
    });

    await user.save();
    console.log(`✅ Thing "${thingName}" added to group "${groupName}" in project "${projectName}"`);
    res.send(` <html>
    <head>
      <title>Thing Created</title>
      <script src="https://cdn.tailwindcss.com"></script>
    </head>
    <body class="bg-gradient-to-br from-indigo-100 via-purple-100 to-pink-100 min-h-screen flex items-center justify-center">
      <div class="bg-white p-10 rounded-3xl shadow-2xl text-center max-w-lg w-full transform transition-transform hover:scale-105">
        <h1 class="text-3xl font-bold text-indigo-600 mb-4">✅ Thing Created Successfully!</h1>
        <p class="text-lg text-gray-700 mb-8">
          Thing has been added to <span class="font-semibold text-purple-600">"${groupName}"</span><br>
          in project <span class="font-semibold text-pink-600">"${projectName}"</span>.
        </p>
        <a href="/project" class="inline-block bg-gradient-to-r from-indigo-500 to-purple-500 text-white px-6 py-3 rounded-xl text-lg font-medium hover:from-purple-600 hover:to-pink-500 transition-all shadow-md hover:shadow-lg">
          🔙 Back to Project
        </a>
      </div>
    </body>
  </html>"`);
  } catch (err) {
    console.error(err);
    res.status(500).send("Server Error");
  }
});
//  Thing list
router.get("/project/thing_list", async (req, res) => {
  try {
    const activeProject = req.session.activeProject;

    if (!activeProject) {
      return res.send(`
  <div style="
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    min-height: 100vh;
    background: linear-gradient(to right, #fbc2eb, #a6c1ee);
    font-family: Arial, sans-serif;
    text-align: center;
    padding: 20px;
  ">
    <div style="
      background-color: white;
      padding: 30px 40px;
      border-radius: 20px;
      box-shadow: 0 8px 20px rgba(0,0,0,0.2);
      max-width: 400px;
    ">
      <div style="font-size: 50px;">⚠️</div>
      <h2 style="color: #333; margin: 10px 0;">No Active Project</h2>
      <p style="color: #555; margin-bottom: 20px;">
        Please activate a project first to continue.
      </p>
      <a href="/project" style="
        display: inline-block;
        padding: 10px 20px;
        background-color: #6c63ff;
        color: white;
        text-decoration: none;
        border-radius: 10px;
        transition: background 0.3s;
      " onmouseover="this.style.backgroundColor='#5751d9'" onmouseout="this.style.backgroundColor='#6c63ff'">
        Go to Projects
      </a>
    </div>
  </div>
`);

    }

    // Convert project name to collection name
    const collectionName = activeProject.toLowerCase().replace(/\s+/g, "_");

    // Use existing model or create dynamically
    const ProjectUser =
      mongoose.models[collectionName] ||
      mongoose.model(collectionName, UserSchema, collectionName);

    // Fetch all users in this project
    const users = await ProjectUser.find({}, { groups: 1 }).lean();

    // Flatten all things
    const allThings = [];
    users.forEach(user => {
      user.groups.forEach(group => {
        group.things.forEach(thing => {
          allThings.push({
            name: thing.name,
            thingId: thing.thingId,
            groupName: group.name,
          });
        });
      });
    });

    res.render("thing_list", { things: allThings });
  } catch (err) {
    console.error(err);
    res.status(500).send("Server error");
  }
});
// Delete Thing directly from /project/thing_list/:thingId
router.get("/project/thing_list/:thingId", async (req, res) => {
  try {
    const { thingId } = req.params;
    const activeProject = req.session.activeProject;

    if (!activeProject) {
      return res.redirect("/project");
    }

    // Get dynamic project collection
    const collectionName = activeProject.toLowerCase().replace(/\s+/g, "_");
    const ProjectUser =
      mongoose.models[collectionName] ||
      mongoose.model(collectionName, UserSchema, collectionName);

    // Find the user that has this thing
    const user = await ProjectUser.findOne({ "groups.things.thingId": thingId });
    if (!user) {
      return res.status(404).send("Thing not found in any user group");
    }

    // Remove the thing from the specific user's groups
    user.groups.forEach(group => {
      group.things = group.things.filter(thing => thing.thingId !== thingId);
    });

    await user.save();

    console.log(`✅ Thing ${thingId} deleted from user ${user.username} in project ${activeProject}`);
    res.redirect("/project/thing_list");
  } catch (err) {
    console.error("❌ Error deleting Thing:", err);
    res.status(500).send("Server error while deleting Thing");
  }
});
// Generate Unique Thing ID API
router.get("/generate-unique-id", async (req, res) => {
  try {
    let uniqueId;
    let exists = true;
    while (exists) {
      uniqueId = Math.floor(10000000 + Math.random() * 90000000).toString();
      exists = await User.exists({ "groups.things.thingId": uniqueId });
    }
    res.json({ uniqueId });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to generate unique ID" });
  }
});
//Thing   lock   by  cange  secret key 
router.get("/project/thing_lock", async (req, res) => {
  try {
    const activeProject = req.session.activeProject;

    if (!activeProject) {
      return res.send(`
        <div style="display:flex; flex-direction:column; align-items:center; justify-content:center; min-height:100vh; background: linear-gradient(to right,#fbc2eb,#a6c1ee); font-family:Arial,sans-serif; text-align:center; padding:20px;">
          <div style="background:white; padding:30px 40px; border-radius:20px; box-shadow:0 8px 20px rgba(0,0,0,0.2); max-width:400px;">
            <div style="font-size:50px;">⚠️</div>
            <h2 style="color:#333; margin:10px 0;">No Active Project</h2>
            <p style="color:#555; margin-bottom:20px;">Please activate a project first to continue.</p>
            <a href="/project" style="display:inline-block; padding:10px 20px; background-color:#6c63ff; color:white; text-decoration:none; border-radius:10px; transition:background 0.3s;"
              onmouseover="this.style.backgroundColor='#5751d9'" onmouseout="this.style.backgroundColor='#6c63ff'">
              Go to Projects
            </a>
          </div>
        </div>
      `);
    }

    const collectionName = activeProject.toLowerCase().replace(/\s+/g, "_");

    const ProjectUser =
      mongoose.models[collectionName] ||
      mongoose.model(collectionName, UserSchema, collectionName);

    const users = await ProjectUser.find({}, { groups: 1 }).lean();

    const allThings = [];
    users.forEach(user => {
      user.groups.forEach(group => {
        group.things.forEach(thing => {
          allThings.push({
            name: thing.name,
            thingId: thing.thingId,
            groupName: group.name,
          });
        });
      });
    });

    res.render("thing_lock", { things: allThings });
  } catch (err) {
    console.error(err);
    res.status(500).send("Server error");
  }
});


// ==========================
// Other Pages / App Data
// ==========================
router.get("/some-other-page", async (req, res) => {
  const activeProject = req.session.activeProject;
  if (!activeProject) return res.send("No project selected");
  const collection = mongoose.connection.db.collection(activeProject);
  const data = await collection.find().toArray();

  res.render("other_page", { data, activeProject });
});

// router.get("/user_auth", (req, res) => res.render("user_auth", { title: "User Auth" }));

// ==========================
// Admin Dashboard (Protected)
// ==========================
router.get("/dashboard", isAdmin, (req, res) => {
  res.send("Welcome Admin Dashboard");
});
// ==========================
// Export Router
// ==========================
module.exports = router;
