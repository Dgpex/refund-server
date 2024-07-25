const mongoose = require('mongoose');
const Schema = mongoose.Schema;

// Role Schema
const roleSchema = new Schema({
  name: {
    type: String,
    required: true,
    trim: true,
  },
  permissions: {
    userManagement: {
      view: { type: Boolean, default: false },
      edit: { type: Boolean, default: false },
      delete: { type: Boolean, default: false },
      create: { type: Boolean, default: false }
    },
    admindashboard: {
      view: { type: Boolean, default: false },
      edit: { type: Boolean, default: false },
      delete: { type: Boolean, default: false },
      create: { type: Boolean, default: false }
    },
    tokengenerator: {
      view: { type: Boolean, default: false },
      edit: { type: Boolean, default: false },
      delete: { type: Boolean, default: false },
      create: { type: Boolean, default: false }
    },
    accessManagement: {
      view: { type: Boolean, default: false },
      edit: { type: Boolean, default: false },
      delete: { type: Boolean, default: false },
      create: { type: Boolean, default: false }
    },
  },
  users: [{ type: Schema.Types.ObjectId, ref: 'User' }] 
}, { timestamps: true });

const Role = mongoose.model('Role', roleSchema);
module.exports = Role;
