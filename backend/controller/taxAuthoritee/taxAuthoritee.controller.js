import Transaction from '../../models/transaction.model'
import Organization from '../../models/organization.model.js';
import TaxAuthority from '../../models/taxAuthoritee.model.js';
import {v2 as cloudinary} from 'cloudinary';
import SystemNotification from '../../models/notification.model.js';
export const resolveNotification = async (req, res) => {
  try {
    const notificationId = req.params.id;
    const userId = req.user?._id;
    const userRole = "TaxAuthority";

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
    const userRole = 'TaxAuthority';

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

    // Fetch the current profile image URL from the database
    const currentTaxAuthority = await TaxAuthority.findById(req.user._id);
    if (!currentTaxAuthority) {
      return res.status(404).json({ error: "TaxAuthority not found" });
    }
    const currentImageUrl = currentTaxAuthority.profileImg;
    if (currentImageUrl) {
      // Extract public ID from Cloudinary URL
      const publicId = currentImageUrl.split("/").pop().split(".")[0];

      // Delete previous image from Cloudinary
      await cloudinary.uploader.destroy(`profile_images/${publicId}`);
    }
  //   Upload the new image to Cloudinary
    const uploadStream = cloudinary.uploader.upload_stream(
      { folder: "profile_images" },
      async (error, result) => {
        if (error) {
          console.error("Cloudinary Upload Error:", error);
          return res.status(500).json({ error: "Failed to upload image to Cloudinary" });
        }

        try {
          // Update profile image in database
          const updatedTaxAuthority = await TaxAuthority.findByIdAndUpdate(
            req.user._id,
            {profileImg: result.secure_url },
            { new: true }
          );

          res.json({ success: true, profileImg: updatedTaxAuthority.profileImg });
        } catch (err) {
          console.error("Database Update Error:", err);
          res.status(500).json({ error: "Failed to update profile image" });
        }
      }
    );

    // Pipe the uploaded image file (buffer) to Cloudinary
    streamifier.createReadStream(req.file.buffer).pipe(uploadStream);
  } catch (err) {
    console.error("Internal Server Error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
};
export const getMe = async (req, res) => {
  try {
    const taxAuthority = await TaxAuthority.findById(req.user.id)
      .select('-password')
      .populate('organization');

    if (!taxAuthority) {
      return res.status(404).json({ message: 'TaxAuthority not found' });
    }

    res.json(taxAuthority);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};
export const updateProfile = async (req, res) => {
  try {
    const { name, email, phoneNumber, designation, password } = req.body;

    const taxAuthority = await TaxAuthority.findById(req.user.id);
    if (!taxAuthority) {
      return res.status(404).json({ message: 'TaxAuthority not found' });
    }

    if (name) taxAuthority.name = name;
    if (email) taxAuthority.email = email;
    if (phoneNumber) taxAuthority.phoneNumber = phoneNumber;
    if (designation) taxAuthority.designation = designation;

    if (password) {
      const salt = await bcrypt.genSalt(10);
      taxAuthority.password = await bcrypt.hash(password, salt);
    }

    const updated = await taxAuthority.save();

    res.json({
      _id: updated._id,
      name: updated.name,
      email: updated.email,
      phoneNumber: updated.phoneNumber,
      designation: updated.designation,
      organization: updated.organization,
      createdAt: updated.createdAt,
      updatedAt: updated.updatedAt
    });
  } catch (error) {
    console.error('Error updating TaxAuthority:', error);
    res.status(500).json({ message: 'Server error' });
  }
};
export const viewAllTransactions = async (req, res) => {
    try {
      const taxAuthorityId = req.user._id; 
      const taxAuthority = await TaxAuthority.findById(taxAuthorityId);
  
      if (!taxAuthority) {
        return res.status(404).json({ message: "TaxAuthority not found" });
      }
  
      const organizationId = taxAuthority.organization;
  
      const transactions = await Transaction.find()
        .populate({
          path: 'enteredBy',
          select: 'name email'
        })
        .populate({
          path: 'employeeId',
          select: 'empname phoneNumber'
        })
        .populate({
          path: 'departmentId',
          select: 'deptname'
        });
  
      const orgTransactions = transactions.filter(txn =>
        txn.enteredBy && txn.enteredBy.organization?.toString() === organizationId.toString()
      );
  
      res.status(200).json(orgTransactions);
    } catch (error) {
      console.error('Error fetching transactions:', error);
      res.status(500).json({ message: "Error fetching transactions", error });
    }
};
export const viewTransactionsByType = async (req, res) => {
    const { type } = req.body; // e.g., payroll, tax, etc.
    try {
      if (!type) return res.status(400).json({ message: "Transaction type is required" });
  
      const taxAuthority = await TaxAuthority.findById(req.user._id);
      const organizationId = taxAuthority.organization;
  
      const transactions = await Transaction.find({ type })
        .populate('enteredBy employeeId departmentId');
  
      const filtered = transactions.filter(txn =>
        txn.enteredBy?.organization?.toString() === organizationId.toString()
      );
  
      res.status(200).json(filtered);
    } catch (error) {
      res.status(500).json({ message: "Error filtering by type", error });
    }
};
export const viewTransactionsByDate = async (req, res) => {
    const { startDate, endDate } = req.body;
  
    try {
      if (!startDate || !endDate) return res.status(400).json({ message: "Start and End dates required" });
  
      const taxAuthority = await TaxAuthority.findById(req.user._id);
      const organizationId = taxAuthority.organization;
  
      const transactions = await Transaction.find({
        timestamp: {
          $gte: new Date(startDate),
          $lte: new Date(endDate)
        }
      }).populate('enteredBy employeeId departmentId');
  
      const filtered = transactions.filter(txn =>
        txn.enteredBy?.organization?.toString() === organizationId.toString()
      );
  
      res.status(200).json(filtered);
    } catch (error) {
      res.status(500).json({ message: "Error filtering by date", error });
    }
};
export const viewTransactionsByAmount = async (req, res) => {
    const { min, max } = req.query;
    try {
      if (!min || !max) return res.status(400).json({ message: "Min and Max amount required" });
  
      const taxAuthority = await TaxAuthority.findById(req.user._id);
      const organizationId = taxAuthority.organization;
  
      const transactions = await Transaction.find({
        amount: {
          $gte: parseFloat(min),
          $lte: parseFloat(max)
        }
      }).populate('enteredBy employeeId departmentId');
  
      const filtered = transactions.filter(txn =>
        txn.enteredBy?.organization?.toString() === organizationId.toString()
      );
  
      res.status(200).json(filtered);
    } catch (error) {
      res.status(500).json({ message: "Error filtering by amount", error });
    }
};
export const viewTransactionsByDepartmentName = async (req, res) => {
    const { deptname } = req.params;
  
    try {
      if (!deptname) return res.status(400).json({ message: "Department name is required" });
  
      const taxAuthority = await TaxAuthority.findById(req.user._id);
      const organizationId = taxAuthority.organization;
  
      // Find department with the given name in the same organization
      const department = await Department.findOne({ 
        dpetname: deptname,
        organization: organizationId
      });
  
      if (!department) {
        return res.status(404).json({ message: "Department not found in your organization" });
      }
  
      const transactions = await Transaction.find({ departmentId: department._id })
        .populate('enteredBy employeeId departmentId');
  
      res.status(200).json(transactions);
    } catch (error) {
      res.status(500).json({ message: "Error filtering by department name", error });
    }
};
export const generateTaxSummaryReport = async (req, res) => {
    try {
      const taxAuthority = await TaxAuthority.findById(req.user._id);
      const organizationId = taxAuthority.organization;
  
      
      const transactions = await Transaction.find()
        .populate({
          path: 'enteredBy',
          match: { organization: organizationId },
          select: '_id organization'
        });
  
     
      const orgTransactions = transactions.filter(txn => txn.enteredBy !== null);
  
      
      let summary = {
        totalTransactions: orgTransactions.length,
        totalTaxPaid: 0,
        totalTaxableAmount: 0,
        breakdownByType: {}
      };
  
      orgTransactions.forEach(txn => {
        if (!summary.breakdownByType[txn.type]) {
          summary.breakdownByType[txn.type] = {
            count: 0,
            totalAmount: 0
          };
        }
  
        summary.breakdownByType[txn.type].count += 1;
        summary.breakdownByType[txn.type].totalAmount += txn.amount;
  
        if (txn.type === 'tax') {
          summary.totalTaxPaid += txn.amount;
        } else {
          summary.totalTaxableAmount += txn.amount;
        }
      });
  
      res.status(200).json(summary);
    } catch (error) {
      res.status(500).json({ message: "Error generating tax summary report", error });
    }
};
export const addTaxTransaction = async (req, res) => {
    const { amount, description, departmentId } = req.body;
  
    try {
      const taxAuthority = await TaxAuthority.findById(req.user._id);
      if (!taxAuthority) {
        return res.status(403).json({ message: 'Unauthorized: Tax Authority not found' });
      }
  
      const newTransaction = new Transaction({
        type: 'tax',
        amount,
        description,
        departmentId: departmentId || null,
        enteredBy: req.user._id
      });
  
      await newTransaction.save();
  
      res.status(201).json({
        message: 'Tax transaction recorded successfully',
        transaction: newTransaction
      });
    } catch (error) {
      res.status(500).json({
        message: 'Failed to record tax transaction',
        error: error.message
      });
    }
};
  