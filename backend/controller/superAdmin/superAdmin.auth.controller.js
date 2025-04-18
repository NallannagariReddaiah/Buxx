import SuperAdmin from '../../models/superAdmin.model.js'
import bcrypt from 'bcrypt';


import generateTokenAndSetCookie from '../../lib/utils/generateTokenAndSetcookie.js';

export const registerSuperAdmin = async (req, res) => {
  try {
    const { name, email, phoneNumber, password } = req.body;

    const existing = await SuperAdmin.findOne({ email });
    if (existing) return res.status(400).json({ message: 'Super Admin already exists' });

    const newSuperAdmin = new SuperAdmin({ name, email, phoneNumber, password });
    await newSuperAdmin.save();

    generateTokenAndSetCookie(newSuperAdmin._id,"superAdmin",res);
    res.status(201).json({ token, superAdmin: { id: newSuperAdmin._id, name, email, phoneNumber } });
  } catch (error) {
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

    generateTokenAndSetCookie(newSuperAdmin._id,"superAdmin",res);
    res.status(200).json({ token, superAdmin: { id: superAdmin._id, name: superAdmin.name, email: superAdmin.email } });
  } catch (error) {
    res.status(500).json({ message: 'Login failed', error });
  }
};

export const logoutSuperAdmin = (req, res) => {
  res.clearCookie('jwt').json({ message: 'Logged out successfully' });
};
