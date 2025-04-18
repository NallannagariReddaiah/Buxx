import TaxAuthority from '../../models/taxAuthoritee.model.js';

import bcrypt from 'bcryptjs';

import generateTokenAndSetCookie from '../../lib/utils/generateTokenAndSetcookie.js';

// Login Tax Authority
export const loginTaxAuthority = async (req, res) => {
  try {
    const { email, password } = req.body;

    const taxAuthority = await TaxAuthority.findOne({ email });
    if (!taxAuthority) {
      return res.status(404).json({ message: 'Tax Authority not found' });
    }

    const isMatch = await bcrypt.compare(password, taxAuthority.password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    generateTokenAndSetCookie(taxAuthority._id,"taxAuthoritee",res);
    res.status(200).json({
      token,
      taxAuthority: {
        id: taxAuthority._id,
        name: taxAuthority.name,
        email: taxAuthority.email,
        phoneNumber: taxAuthority.phoneNumber,
        organization: taxAuthority.organization,
        designation: taxAuthority.designation
      }
    });
  } catch (error) {
    res.status(500).json({ message: 'Login failed', error });
  }
};

// Logout Tax Authority (if using cookies)
export const logoutTaxAuthority = (req, res) => {
  res.clearCookie('token').json({ message: 'Logged out successfully' });
};
