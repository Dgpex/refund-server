const express = require('express');
const axios = require('axios');
const Claim = require('../model/claim'); // Adjust the path as needed
const router = express.Router();
const multer = require('multer');
const path = require('path');
const User = require("../model/userModel")


const userAuth = require("../middleware/authMiddleware")



// Configure multer storage
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
      cb(null, 'uploads/'); // Specify the directory to save uploaded files
    },
    filename: function (req, file, cb) {
      cb(null, Date.now() + path.extname(file.originalname)); // Generate a unique file name
    }
  });

  const upload = multer({ storage: storage });

router.post('/send-aadhar-otp', async (req, res) => {
  const { aadharNumber } = req.body;

  try {
    const response = await axios.post(
      'https://api.signzy.app/api/v3/getOkycOtp',
      { aadhaarNumber: aadharNumber },
      {
        headers: {
          Authorization: process.env.BANKFREE_SECRET_TOKEN,
          'Content-Type': 'application/json',
        },
      }
    );

    if (response.status === 200) {
      const { requestId } = response.data.data;
      res.status(200).json({ message: 'OTP sent successfully', requestId });
    } else {
      res.status(500).json({ message: 'Failed to send OTP' });
    }
  } catch (error) {
    res.status(500).json({ message: 'Error sending OTP', error: error.message });
  }
});

router.post('/verify-aadhar-otp', async (req, res) => {
  const { requestId, otp, claimId } = req.body;

  try {
    const response = await axios.post(
      'https://api.signzy.app/api/v3/fetchOkycData',
      { requestId, otp },
      {
        headers: {
          Authorization: process.env.BANKFREE_SECRET_TOKEN,
          'Content-Type': 'application/json',
        },
      }
    );

    if (response.data.statusCode === 200) {
      const { full_name, address, aadhaar_number } = response.data.data;
      const aadharDetails = {
        aadhaar_number,
        fullName: full_name,
        isVerified: true,
        address: {
          country: address.country,
          district: address.dist,
          state: address.state,
          postOffice: address.po,
          locality: address.loc,
          villageTownCity: address.vtc,
          pinCode: response.data.data.zip
        }
      };

      // Save Aadhar details to the Claim model
      const claim = await Claim.findById(claimId);
      if (claim) {
        claim.aadharDetails = aadharDetails;
        await claim.save();
        res.status(200).json({ message: 'Aadhar verified successfully', aadharDetails });
      } else {
        res.status(404).json({ message: 'Claim not found' });
      }
    } else {
      res.status(500).json({ message: 'Failed to verify Aadhar' });
    }
  } catch (error) {
    res.status(500).json({ message: 'Error verifying OTP', error: error.message });
  }
});

router.post('/bank-verification', async (req, res) => {
  try {
    const { ac_no, ifsc, mobno, claimId } = req.body;

    const response = await axios.post(
      "https://api.signzy.app/api/v3/bankaccountverifications/advancedverification",
      {
        beneficiaryAccount: ac_no,
        beneficiaryIFSC: ifsc,
        beneficiaryMobile: mobno,
        nameFuzzy: "true",
      },
      {
        headers: {
          Authorization: process.env.BANKFREE_SECRET_TOKEN,
          'Content-Type': 'application/json',
        },
      }
    );

    // Check if verification is successful
    if (response.data.result && response.data.result.reason === "success") {
      const bankDetails = {
        accountNumber: ac_no,
        ifscCode: ifsc,
        isVerified: true,
        beneName: response.data.result.bankTransfer.beneName
      };

      // Save bank details to the Claim model
      const claim = await Claim.findById(claimId);
      if (claim) {
        claim.bankDetails = bankDetails;
        await claim.save();
        res.status(200).json({ message: 'Bank details verified and added successfully', bankDetails });
      } else {
        res.status(404).json({ message: 'Claim not found' });
      }
    } else {
      res.status(400).json({ message: 'Bank verification failed', details: response.data });
    }
  } catch (error) {
    res.status(error.response ? error.response.status : 500).json({
      message: error.message,
    });
  }
});

router.post('/save-claim-details', userAuth, upload.fields([{ name: 'paymentFile' }, { name: 'bondFile' }]), async (req, res) => {
  try {
    const {
      name, mobile_number, houseAddress, city, state, country, postal_code,
      name_as_per_bond, fathers_name, invested_amount, invested_date,
      monthly_received_amount, agent_name, agent_mobile_number, sub_agent_name,
      bond_reference_number
    } = req.body;

    const { id } = req.user;

    const paymentFile = req.files['paymentFile'] ? req.files['paymentFile'][0].path : '';
    const bondFile = req.files['bondFile'] ? req.files['bondFile'][0].path : '';

    const claim = new Claim({
      name,
      mobile_number,
      houseAddress,
      city,
      state,
      country,
      postal_code,
      name_as_per_bond,
      fathers_name,
      invested_amount,
      invested_date,
      monthly_received_amount,
      agent_name,
      agent_mobile_number,
      sub_agent_name,
      bond_reference_number,
      paymentFile,
      bondFile,
      userId: id
    });

    await claim.save();

    // Update the user's claims array
    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    user.claims.push(claim._id);
    await user.save();

    res.status(201).json({ message: 'Claim details saved successfully', claimId: claim._id });
  } catch (error) {
    res.status(500).json({ message: 'Error saving claim details', error: error.message });
  }
});


router.get('/get-user-claims', userAuth, async (req, res) => {
  try {
    const { id } = req.user;

    const user = await User.findById(id).populate('claims');
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.status(200).json({ claims: user.claims });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching user claims', error: error.message });
  }
});

router.get('/view-claim/:id', userAuth, async (req, res) => {
  try {
    const { id } = req.params;

    const claim = await Claim.findById(id).populate('userId');
    if (!claim) {
      return res.status(404).json({ message: 'Claim not found' });
    }

    if (claim.userId._id.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Unauthorized access' });
    }

    res.status(200).json({ claim });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching claim', error: error.message });
  }
});







module.exports = router;
