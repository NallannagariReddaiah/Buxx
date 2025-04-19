import SuperAdmin from '../../models/superAdmin.model.js'
import bcrypt from 'bcryptjs';


import generateTokenAndSetCookie from '../../lib/utils/generateTokenAndSetcookie.js';
import Admin from '../../models/admin.model.js';

export const registerSuperAdmin = async (req, res) => {
  try {
    const { name, email, phoneNumber, password } = req.body;

    const existing = await SuperAdmin.findOne({ email });
    if (existing) return res.status(400).json({ message: 'Super Admin already exists' });

    // Create SuperAdmin
    const newSuperAdmin = new SuperAdmin({ name, email, phoneNumber, password });
    await newSuperAdmin.save();

    // Create corresponding Admin record
    const newAdmin = new Admin({
      name,
      email,
      phoneNumber,
      password,
      organization: null, // to be updated later
      role: "admin",
    });
    await newAdmin.save();

    // Generate token
    generateTokenAndSetCookie(newSuperAdmin._id, "superAdmin", res);

    res.status(201).json({
      superAdmin: {
        id: newSuperAdmin._id,
        name,
        email,
        phoneNumber
      },
      admin: {
        id: newAdmin._id,
        email
      }
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: 'Registration failed', error });
  }
};



export const loginSuperAdmin = async (req, res) => {
  try {
    const { email, password } = req.body;
    const superAdmin = await SuperAdmin.findOne({ email });
    if (!superAdmin) return res.status(404).json({ message: 'Super Admin not found' });

    const isMatch = await bcrypt.compare(password, superAdmin.password);
    if (!isMatch) return res.status(400).json({ message: 'Invalid credentials' });

    generateTokenAndSetCookie(superAdmin._id,"superAdmin",res);
    res.status(200).json({superAdmin: { id: superAdmin._id, name: superAdmin.name, email: superAdmin.email } });
  } catch (error) {
      console.log(error);
    res.status(500).json({ message: 'Login failed', error });
  }
};

export const logoutSuperAdmin = (req, res) => {
  res.clearCookie('jwt').json({ message: 'Logged out successfully' });
};
