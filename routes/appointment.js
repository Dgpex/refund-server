const express = require('express');
const router = express.Router();
const Appointment = require('../model/appointment');

// Function to generate a token in the format DRxxxx where xxxx are random digits
const generateToken = () => {
  const randomDigits = Math.floor(1000 + Math.random() * 9000); // Generates a random 4-digit number
  return `DR${randomDigits}`;
};

// Helper function to get the start and end of today
const getStartOfDay = () => {
  const start = new Date();
  start.setHours(0, 0, 0, 0);
  return start;
};

const getEndOfDay = () => {
  const end = new Date();
  end.setHours(23, 59, 59, 999);
  return end;
};

const generateUniqueToken = async () => {
  let unique = false;
  let token;
  
  while (!unique) {
    token = generateToken();
    const existingToken = await Appointment.findOne({ token });
    if (!existingToken) {
      unique = true;
    }
  }
  
  return token;
};

// Create a new appointment
router.post('/create', async (req, res) => {
  const { name, phoneNumber, date, timeSlot } = req.body;

  if (!name || !phoneNumber || !date || !timeSlot) {
    return res.status(400).json({ message: 'All fields are required' });
  }

  try {
    const startOfDay = getStartOfDay();
    const endOfDay = getEndOfDay();

    const todayAppointmentsCount = await Appointment.countDocuments({
      createdAt: { $gte: startOfDay, $lte: endOfDay },
    });

    if (todayAppointmentsCount >= 30) {
      return res.status(429).json({ message: 'Daily token limit exceeded' });
    }

    const existingAppointment = await Appointment.findOne({ phoneNumber, status: 'open' });
    if (existingAppointment) {
      return res.status(400).json({ message: 'An appointment already exists with this phone number' });
    }

    // Generate a unique token
    const token = await generateUniqueToken();
    const newAppointment = new Appointment({ name, phoneNumber, date, timeSlot, token });
    await newAppointment.save();

    res.status(201).json({ message: 'Appointment created successfully', token: newAppointment.token });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});



// appointments.js (or your router file)
router.get('/token-count', async (req, res) => {
    try {
      const startOfDay = getStartOfDay();
      const endOfDay = getEndOfDay();
  
      const todayTokensCount = await Appointment.countDocuments({
        createdAt: { $gte: startOfDay, $lte: endOfDay },
      });
  
      res.status(200).json({ count: todayTokensCount });
    } catch (error) {
      res.status(500).json({ message: 'Server error', error: error.message });
    }
  });



// Get appointments with filters and pagination
router.get('/list', async (req, res) => {
    const { startDate, endDate, status, page = 1, limit = 10 } = req.query;
  
    const query = {};
    if (startDate && endDate) {
      query.date = { $gte: new Date(startDate), $lte: new Date(endDate) };
    }
    if (status) {
      query.status = status;
    }
  
    try {
      const appointments = await Appointment.find(query)
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(Number(limit));
  
      const totalAppointments = await Appointment.countDocuments(query);
      res.status(200).json({
        appointments,
        total: totalAppointments,
        pages: Math.ceil(totalAppointments / limit),
      });
    } catch (error) {
      res.status(500).json({ message: 'Server error', error: error.message });
    }
  });
  
  // API to update the status of an appointment
  router.put('/update-status/:id', async (req, res) => {
    const { id } = req.params;
    const { status } = req.body;
  
    try {
      const appointment = await Appointment.findById(id);
      if (!appointment) {
        return res.status(404).json({ message: 'Appointment not found' });
      }
  
      appointment.status = status;
      await appointment.save();
  
      res.status(200).json({ message: 'Status updated successfully', appointment });
    } catch (error) {
      res.status(500).json({ message: 'Server error', error: error.message });
    }
  });
  
  

module.exports = router;
