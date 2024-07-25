const mongoose = require('mongoose');
const Schema = mongoose.Schema;

// User Schema
const userSchema = new Schema({
  phone: {
    type: String,
    trim: true,
  },
  name: {
    type:String
  },
  email: {
    type: String,
    trim: true,
  },
  otp: {
    type: String,
    required: false,
    trim: true,
  },
  role: {
    type: Schema.Types.ObjectId,
    ref: 'Role',
  },
  isAdmin: {
    type:Boolean,
    default:false
  },
  claims: [{
    type: Schema.Types.ObjectId,
    ref: 'Claim'
  }],
 password: { type: String, required: false },
}, { timestamps: true });

const User = mongoose.model('User', userSchema);
module.exports = User;
