const express = require('express');
const router = express.Router();
const Role = require('../model/role');
const User = require("../model/userModel")

const adminCheck = require("../middleware/adminMiddleware")

router.get('/get-roles', async (req, res) => {
  try {
    const roles = await Role.find();
    res.status(200).json(roles);
  } catch (error) {
    res.status(500).json({ message: 'Error retrieving roles', error: error.message });
  }
});


router.post('/create-roles', adminCheck, async (req, res) => {
    try {
      const { name} = req.body;
  
      if (!name) {
        return res.status(400).json({ message: 'Role name and permissions are required' });
      }
  
      const newRole = new Role({ name});
      await newRole.save();
  
      res.status(201).json({ message: 'Role created successfully', role: newRole });
    } catch (error) {
      res.status(500).json({ message: 'Error creating role', error: error.message });
    }
  });

router.put('/roles/:id', async (req, res) => {
  try {
    const { permissions } = req.body;
    const updatedRole = await Role.findByIdAndUpdate(req.params.id, { permissions }, { new: true });
    res.status(200).json({ message: 'Role updated successfully', role: updatedRole });
  } catch (error) {
    res.status(500).json({ message: 'Error updating role', error: error.message });
  }
});

router.patch('/update-permissions/:roleId', adminCheck, async (req, res) => {
  const { roleId } = req.params;
  const { permissions } = req.body;

  try {
    // Find the role by ID and update its permissions
    const role = await Role.findByIdAndUpdate(
      roleId,
      { $set: { permissions } },
      { new: true }
    );

    if (!role) {
      return res.status(404).json({ message: 'Role not found' });
    }

    res.status(200).json(role);
  } catch (err) {
    res.status(400).json({ message: 'Error updating permissions' });
  }
});
// Fetch users associated with the 'rootadmin' role
router.get('/getuserByRole', adminCheck, async (req, res) => {
  try {
    const role = await Role.findOne({ name: 'rootadmin' })
      .populate({
        path: 'users',
        select: '-password', // Exclude the password field
        populate: {
          path: 'role', // Assumes your User schema has a `role` field
          select: 'name' // Specify the fields you want to include from the Role model
        }
      });

    if (!role) return res.status(404).json({ message: 'Role not found' });
    
    // Format the data if needed
    const usersWithRoles = role.users.map(user => ({
      ...user.toObject(),
      role: user.role ? user.role.name : 'No Role' // Adjust according to your role field
    }));

    res.status(200).json(usersWithRoles);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});




// Add user and assign role
router.post('/addUserToRole', adminCheck, async (req, res) => {
  const { email,name,password, role } = req.body;

  try {
    // Create a new user
    const newUser = new User({ email, password,name, role, isAdmin: true });
    await newUser.save();

    // Add user to rootadmin role
    const roleDoc = await Role.findOne({ name: 'rootadmin' });
    if (!roleDoc) return res.status(404).json({ message: 'Role not found' });

    if (!roleDoc.users.includes(newUser._id)) {
      roleDoc.users.push(newUser._id);
      await roleDoc.save();
    }

    res.status(200).json({ message: 'User added and isAdmin set to true', user: newUser });
  } catch (err) {
    console.log(err.message);
    res.status(500).json({ message: 'Server error' });
  }
});


// Remove a user from the 'rootadmin' role
router.delete('/removeUserFromRole/:userId', adminCheck, async (req, res) => {
  const { userId } = req.params;
  try {
    const role = await Role.findOne({ name: 'rootadmin' });
    if (!role) return res.status(404).json({ message: 'Role not found' });

    role.users = role.users.filter((id) => id.toString() !== userId);
    await role.save();

    await User.findByIdAndUpdate(userId, { isAdmin: false });

    res.status(200).json({ message: 'User removed and isAdmin set to false' });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});


module.exports = router;
