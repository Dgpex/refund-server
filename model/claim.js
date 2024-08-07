const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const claimSchema = new mongoose.Schema({
  name: { type: String, trim: true },
  mobile_number: { type: String, trim: true },
  houseAddress: { type: String, trim: true },
  city: { type: String, trim: true },
  state: { type: String, trim: true },
  country: { type: String, trim: true, default: "INDIA" },
  postal_code: { type: String, trim: true },
  name_as_per_bond: { type: String, trim: true },
  fathers_name: { type: String, trim: true },
  invested_amount: { type: String, trim: true },
  invested_date: { type: String, trim: true },
  monthly_received_amount: { type: String, trim: true },
  agent_name: { type: String, trim: true },
  agent_mobile_number: { type: String, trim: true },
  sub_agent_name: { type: String, trim: true },
  bond_reference_number: { type: String, trim: true, unique: true },
  paymentFile: { type: String, trim: true },
  bondFile: { type: String, trim: true },
  created_at: { type: Date, default: Date.now },
  status: { type: String, default: "processing" },
  userId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
  },
  aadharDetails: {
    aadhaar_number: { type: String, trim: true },
    fullName: { type: String, trim: true },
    isVerified: { type: Boolean, default: false },
    address: {
      country: { type: String, trim: true },
      district: { type: String, trim: true },
      state: { type: String, trim: true },
      postOffice: { type: String, trim: true },
      locality: { type: String, trim: true },
      villageTownCity: { type: String, trim: true },
      pinCode: { type: String, trim: true }
    }
  },
  bankDetails: {
    accountNumber: { type: String, trim: true },
    ifscCode: { type: String, trim: true },
    isVerified: { type: Boolean, default: false },
    beneName: { type: String, trim: true }
  }
});

module.exports = mongoose.model("Claim", claimSchema);
