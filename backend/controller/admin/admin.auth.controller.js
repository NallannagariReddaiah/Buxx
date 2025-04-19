import Admin from '../../models/admin.model.js';

import bcrypt from 'bcryptjs';

import generateTokenAndSetCookie from '../../lib/utils/generateTokenAndSetcookie.js';

export const loginAdmin = async (req, res) => {
  try {
    const { email, password } = req.body;
    const admin = await Admin.findOne({ email });
    if (!admin) return res.status(404).json({ message: 'Admin not found' });

    const isMatch = await bcrypt.compare(password, admin.password);
    if (!isMatch) return res.status(400).json({ message: 'Invalid credentials' });

    generateTokenAndSetCookie(admin._id,"Admin",res);
    res.status(200).json({
      admin: {
        id: admin._id,
        name: admin.name,
        email: admin.email,
        phoneNumber: admin.phoneNumber,
        organization: admin.organization,
        role: admin.role
      }
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: 'Login failed', error });
  }
};

export const logoutAdmin = (req, res) => {
  res.clearCookie('token').json({ message: 'Logged out successfully' });
};
