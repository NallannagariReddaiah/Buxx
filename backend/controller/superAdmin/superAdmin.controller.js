// controllers/superAdminController.js
import SuperAdmin from '../../models/superAdmin.model.js';
import Organization from '../../models/organization.model.js';
import Admin from '../../models/admin.model.js';
import bcrypt from 'bcrypt';
import TaxAuthority from '../../models/taxAuthority.model.js';
import {v2 as cloudinary} from 'cloudinary';
import SystemNotification from '../../models/notification.model.js';
export const resolveNotification = async (req, res) => {
  try {
    const notificationId = req.params.id;
    const userId = req.user?._id;
    const userRole = "SuperAdmin";

    if (!userId || !['Admin', 'SuperAdmin', 'TaxAuthority'].includes(userRole)) {
      return res.status(403).json({ error: 'Unauthorized access' });
    }

    const notification = await SystemNotification.findById(notificationId);

    if (!notification) {
      return res.status(404).json({ error: 'Notification not found' });
    }

    if (notification.isResolved) {
      return res.status(400).json({ error: 'Notification is already resolved' });
    }

    notification.isResolved = true;
    notification.resolvedBy = userId;
    notification.resolvedByType = userRole;

    await notification.save();

    res.status(200).json({
      message: 'Notification resolved successfully',
      notification
    });
  } catch (error) {
    console.error('Error resolving notification:', error);
    res.status(500).json({ error: 'Server error' });
  }
};
export const getNotificationsForRole = async (req, res) => {
  try {
    const userRole = 'SuperAdmin';

    if (!['Admin', 'SuperAdmin', 'TaxAuthority'].includes(userRole)) {
      return res.status(403).json({ error: 'Unauthorized role' });
    }

    const notifications = await SystemNotification.find({
      targetRoles: userRole
    }).sort({ timestamp: -1 }).lean();

    const enrichedNotifications = await Promise.all(
      notifications.map(async (notif) => {
        const enriched = { ...notif };

        // Handle fromType
        if (notif.from && notif.fromType) {
          let fromUser = null;
          if (notif.fromType === 'Admin') {
            fromUser = await Admin.findById(notif.from).select('name _id');
          } else if (notif.fromType === 'SuperAdmin') {
            fromUser = await SuperAdmin.findById(notif.from).select('name _id');
          } else if (notif.fromType === 'TaxAuthority') {
            fromUser = await TaxAuthority.findById(notif.from).select('name _id');
          }
          enriched.fromUser = fromUser;
        }

        // Handle resolvedByType
        if (notif.isResolved && notif.resolvedBy && notif.resolvedByType) {
          let resolvedByUser = null;
          if (notif.resolvedByType === 'Admin') {
            resolvedByUser = await Admin.findById(notif.resolvedBy).select('name _id');
          } else if (notif.resolvedByType === 'SuperAdmin') {
            resolvedByUser = await SuperAdmin.findById(notif.resolvedBy).select('name _id');
          } else if (notif.resolvedByType === 'TaxAuthority') {
            resolvedByUser = await TaxAuthority.findById(notif.resolvedBy).select('name _id');
          }
          enriched.resolvedByUser = resolvedByUser;
        }

        return enriched;
      })
    );

    res.status(200).json({ notifications: enrichedNotifications });
  } catch (error) {
    console.error('Error fetching notifications:', error);
    res.status(500).json({ error: 'Server error' });
  }
};
export const createNotification = async (req, res) => {
  try {
    const { from, fromType, targetRoles, subject, message } = req.body;

    // Basic validation
    if (!from || !fromType || !targetRoles || !subject || !message) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    if (!['Admin', 'SuperAdmin', 'TaxAuthority'].includes(fromType)) {
      return res.status(400).json({ error: 'Invalid fromType' });
    }

    const invalidRoles = targetRoles.filter(
      role => !['Admin', 'SuperAdmin', 'TaxAuthority'].includes(role)
    );

    if (invalidRoles.length > 0) {
      return res.status(400).json({ error: `Invalid roles: ${invalidRoles.join(', ')}` });
    }

    const newNotification = new SystemNotification({
      from,
      fromType,
      targetRoles,
      subject,
      message
    });

    await newNotification.save();

    res.status(201).json({
      message: 'Notification created successfully',
      notification: newNotification
    });
  } catch (error) {
    console.error('Error creating notification:', error);
    res.status(500).json({ error: 'Server error' });
  }
};
export const updateProfileImage = async (req, res) => {
  try {
    if (!req.file) {

      return res.status(400).json({ error: "No image uploaded" });
    }

    const currentSuperAdmin = await SuperAdmin.findById(req.user._id);
    if (!currentSuperAdmin) {
      return res.status(404).json({ error: "SuperAdmin not found" });
    }
    const currentImageUrl = currentSuperAdmin.profileImg;
    if (currentImageUrl) {
      const publicId = currentImageUrl.split("/").pop().split(".")[0];

      await cloudinary.uploader.destroy(`profile_images/${publicId}`);
    }

    const uploadStream = cloudinary.uploader.upload_stream(
      { folder: "profile_images" },
      async (error, result) => {
        if (error) {
          console.error("Cloudinary Upload Error:", error);
          return res.status(500).json({ error: "Failed to upload image to Cloudinary" });
        }

        try {
          const updatedSuperAdmin = await SuperAdmin.findByIdAndUpdate(
            req.user._id,
            {profileImg: result.secure_url },
            { new: true }
          );

          res.json({ success: true, profileImg: updatedSuperAdmin.profileImg });
        } catch (err) {
          console.error("Database Update Error:", err);
          res.status(500).json({ error: "Failed to update profile image" });
        }
      }
    );
    streamifier.createReadStream(req.file.buffer).pipe(uploadStream);
  } catch (err) {
    console.error("Internal Server Error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
};
export const getMe = async (req, res) => {
  try {
    const superAdmin = await SuperAdmin.findById(req.user.id).select('-password');
    if (!superAdmin) {
      return res.status(404).json({ message: 'SuperAdmin not found' });
    }
    res.json(superAdmin);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};
export const updateProfile = async (req, res) => {
  try {
    const { name, email, phoneNumber, password } = req.body;

    const superAdmin = await SuperAdmin.findById(req.user.id);
    if (!superAdmin) {
      return res.status(404).json({ message: 'SuperAdmin not found' });
    }

    if (name) superAdmin.name = name;
    if (email) superAdmin.email = email;
    if (phoneNumber) superAdmin.phoneNumber = phoneNumber;

    if (password) {
      const salt = await bcrypt.genSalt(10);
      superAdmin.password = await bcrypt.hash(password, salt);
    }

    const updatedSuperAdmin = await superAdmin.save();

    res.json({
      _id: updatedSuperAdmin._id,
      name: updatedSuperAdmin.name,
      email: updatedSuperAdmin.email,
      phoneNumber: updatedSuperAdmin.phoneNumber,
      createdAt: updatedSuperAdmin.createdAt,
      updatedAt: updatedSuperAdmin.updatedAt
    });
  } catch (error) {
    console.error('Error updating SuperAdmin profile:', error);
    res.status(500).json({ message: 'Server error' });
  }
};
export const createOrganization = async (req, res) => {
  try {
    const {
      name,
      address, 
      contactEmail,
      contactPhone,
    } = req.body;

    // Check if SuperAdmin exists
    const superAdminId=req.user._id;
    const superAdmin = await SuperAdmin.findById(superAdminId);
    if (!superAdmin) {
      return res.status(404).json({ message: 'SuperAdmin not found' });
    }

    // Create organization document
    const newOrg = new Organization({
      name,
      address,
      contactEmail,
      contactPhone,
      superAdmin: superAdminId
    });

    await newOrg.save();

    res.status(201).json({
      message: 'Organization created successfully',
      organization: newOrg
    });
  } catch (error) {
    console.error('Error creating organization:', error);
    res.status(500).json({ message: 'Internal Server Error', error });
  }
};
export const addAdminBySuperAdmin = async (req, res) => {
  try {
    const {
      name,
      email,
      phoneNumber,
      password,
      role = 'admin' 
    } = req.body;

    const superAdminId = req.user._id; 

  
    const organization = await Organization.findOne({ superAdmin: superAdminId });

    if (!organization) {
      return res.status(404).json({ message: 'Organization not found for this SuperAdmin' });
    }

    // Check if email is already taken
    const existingAdmin = await Admin.findOne({ email });
    if (existingAdmin) {
      return res.status(400).json({ message: 'Admin with this email already exists' });
    }

  
    const hashedPassword = await bcrypt.hash(password, 10);

    
    const newAdmin = new Admin({
      name,
      email,
      phoneNumber,
      password: hashedPassword,
      organization: organization._id,
      role
    });

    await newAdmin.save();

    res.status(201).json({
      message: 'Admin created successfully',
      admin: {
        id: newAdmin._id,
        name: newAdmin.name,
        email: newAdmin.email,
        role: newAdmin.role
      }
    });
  } catch (error) {
    console.error('Error adding admin:', error);
    res.status(500).json({ message: 'Internal server error', error });
  }
};
export const addTaxAuthorityBySuperAdmin = async (req, res) => {
    try {
      const {
        name,
        email,
        phoneNumber,
        password,
        designation = 'Tax Officer' // Optional, defaults to 'Tax Officer'
      } = req.body;
  
      const superAdminId = req.user._id; // from auth middleware
  
      // Find the organization owned by this superAdmin
      const organization = await Organization.findOne({ superAdmin: superAdminId });
  
      if (!organization) {
        return res.status(404).json({ message: 'Organization not found for this SuperAdmin' });
      }
  
      // Check if email already exists
      const existingTaxAuth = await TaxAuthority.findOne({ email });
      if (existingTaxAuth) {
        return res.status(400).json({ message: 'Tax Authority with this email already exists' });
      }
  
      // Hash the password
      const hashedPassword = await bcrypt.hash(password, 10);
  
      // Create new Tax Authority
      const newTaxAuthority = new TaxAuthority({
        name,
        email,
        phoneNumber,
        password: hashedPassword,
        designation,
        organization: organization._id
      });
  
      await newTaxAuthority.save();
  
      res.status(201).json({
        message: 'Tax Authority created successfully',
        taxAuthority: {
          id: newTaxAuthority._id,
          name: newTaxAuthority.name,
          email: newTaxAuthority.email,
          designation: newTaxAuthority.designation
        }
      });
    } catch (error) {
      console.error('Error creating tax authority:', error);
      res.status(500).json({ message: 'Internal server error', error });
    }
};
export const getAllAdmins = async (req, res) => {
  try {
    const admins = await Admin.find().populate('organization');
    res.status(200).json(admins);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching admins', error });
  }
};
export const getAllTaxAuthorities = async (req, res) => {
  try {
    const authorities = await TaxAuthority.find().populate('organization');
    res.status(200).json(authorities);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching tax authorities', error });
  }
};
export const deleteAdminByEmail = async (req, res) => {
  const { email } = req.params;
  try {
    const deletedAdmin = await Admin.findOneAndDelete({ email });
    if (!deletedAdmin) {
      return res.status(404).json({ message: 'Admin not found' });
    }
    res.status(200).json({ message: 'Admin deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Error deleting admin', error });
  }
};
export const deleteTaxAuthorityByEmail = async (req, res) => {
  const { email } = req.params;
  try {
    const deletedTaxAuthority = await TaxAuthority.findOneAndDelete({ email });
    if (!deletedTaxAuthority) {
      return res.status(404).json({ message: 'Tax Authority not found' });
    }
    res.status(200).json({ message: 'Tax Authority deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Error deleting tax authority', error });
  }
};