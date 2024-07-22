const express = require('express');
const router = express.Router();
const User = require('../model/userModel');
const jwt = require('jsonwebtoken');
const twilio = require('twilio');




const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const client = new twilio(accountSid, authToken);


// Send OTP
const sendOtp = async (phone, otp) => {
  try {
    await client.messages.create({
      body: `Your OTP is ${otp}`,
      to: `+91${phone}`,
      from: process.env.TWILIO_PHONE_NUMBER,
    });
  } catch (error) {
    console.error('Error sending OTP:', error);
    throw new Error('Failed to send OTP');
  }
};


// Generate OTP
const generateOtp = () => Math.floor(1000 + Math.random() * 9000).toString();

// Login/Register User
router.post('/login', async (req, res) => {
  const { phone } = req.body;

  if (!phone || phone.length !== 10) {
    return res.status(400).json({ msg: 'Phone number must be 10 digits' });
  }

  try {
    let user = await User.findOne({ phone });
    const otp = generateOtp();

    if (!user) {
      user = new User({ phone, otp });
    } else {
      user.otp = otp;
    }

    await user.save();
    await sendOtp(phone, otp);

    res.status(200).json({ msg: 'OTP sent successfully' });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

// Verify OTP
router.post('/verify', async (req, res) => {
  const { phone, otp } = req.body;

  if (!phone || phone.length !== 10) {
    return res.status(400).json({ msg: 'Phone number must be 10 digits' });
  }

  if (!otp || otp.length !== 4) {
    return res.status(400).json({ msg: 'OTP must be 6 digits' });
  }

  try {
    let user = await User.findOne({ phone });

    if (!user || user.otp !== otp) {
      return res.status(400).json({ msg: 'Invalid OTP' });
    }

    user.otp = null; // Clear OTP after successful verification
    await user.save();

    const payload = {
      user: {
        id: user.id,
        role: user.role
      }
    };

    jwt.sign(
      payload,
      process.env.JWT_SECRET,
      { expiresIn: '2d' },
      (err, token) => {
        if (err) throw err;
        res.json({ token });
      }
    );
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});
module.exports = router;
