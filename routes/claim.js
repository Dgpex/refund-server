const express = require('express');
const axios = require('axios');
const Claim = require('../model/claim'); // Adjust the path as needed
const router = express.Router();
const multer = require('multer');
const path = require('path');


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
    const { ac_no, ifsc, mobno, nominee, claimId } = req.body;

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
        nominee: nominee || {},
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

router.post('/save-claim-details',userAuth, upload.single('paymentFile'), async (req, res) => {
    try {
      const {
        name, mobile_number, address, city, state, country, postal_code,
        name_as_per_bond, fathers_name, invested_amount, invested_date,
        monthly_received_amount, agent_name, agent_mobile_number, sub_agent_name,
        bond_reference_number
      } = req.body;

      const id = req.user.id;
  
      const paymentFile = req.file ? req.file.path : '';
  
      const claim = new Claim({
        name,
        mobile_number,
        address,
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
        userId:id
      });
  
      await claim.save();
      res.status(201).json({ message: 'Claim details saved successfully', claim });
    } catch (error) {
      res.status(500).json({ message: 'Error saving claim details', error: error.message });
    }
  });








module.exports = router;
