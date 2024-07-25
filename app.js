require('dotenv').config();
const express = require("express")
const mongoose = require("mongoose");
const cors = require("cors");
const userRoutes = require("./routes/user")
const claimsRoutes = require("./routes/claim")
const roleRoutes = require("./routes/role")
const adminRoutes = require("./routes/admin")
const appointmentsRoutes = require("./routes/appointment")
const path = require('path');



const app = express();
app.use(express.json({ limit: "50mb" }));

// Serve static files from the 'uploads' directory
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

const corsOptions = {
  origin: "*", 
  methods: ["GET", "POST", "PUT","PATCH", "DELETE"], // Allowed methods
  allowedHeaders: ["Content-Type", "Authorization"], // Allowed headers
};
app.use(cors(corsOptions));
app.use(express.urlencoded({ limit: "50mb", extended: true }));

// Mongoose connect with error handling
const connectDb = async () => {
    try {
      await mongoose.connect(process.env.MONGODB_URI);
      console.log("Database connected successfully");
    } catch (error) {
      console.error("Error connecting to database:", error.message);
      process.exit(1); // Exit the application if unable to connect to MongoDB
    }
  };
  
  connectDb();


  app.use("/api/user",userRoutes);
  app.use("/api/claim",claimsRoutes);
  app.use("/api/role",roleRoutes);
  app.use("/api/admin",adminRoutes);
  app.use("/api/appointments",appointmentsRoutes);







  app.listen(8000, () => {
    console.log("Express server is running on port 8000");
  });