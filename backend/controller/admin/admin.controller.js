import Admin from '../../models/admin.model.js';
import Department from '../../models/department.model.js';
import Organization from '../../models/organization.model.js';
import Transaction from '../../models/transaction.model.js'
import bcrypt from 'bcryptjs'
import {v2 as cloudinary} from 'cloudinary';
import SystemNotification from '../../models/notification.model.js';
import Employee from '../../models/employee.model.js';
import superAdmin from '../../models/superAdmin.model.js';
import mongoose from 'mongoose';
// import moment from 'moment';

export const resolveNotification = async (req, res) => {
  try {
    const notificationId = req.params.id;
    const userId = req.user?._id;
    const userRole = "Admin";

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
    const userRole = 'Admin';

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

    
    const currentAdmin = await Admin.findById(req.user._id);
    if (!currentAdmin) {
      return res.status(404).json({ error: "Admin not found" });
    }
    const currentImageUrl = currentAdmin.profileImg;
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
          const updatedAdmin = await Admin.findByIdAndUpdate(
            req.user._id,
            {profileImg: result.secure_url },
            { new: true }
          );

          res.json({ success: true, profileImg: updatedAdmin.profileImg });
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
    const admin = await Admin.findById(req.user.id).select('-password').populate('organization');
    if (!admin) {
      return res.status(404).json({ message: 'Admin not found' });
    }
    res.json(admin);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};
export const updateProfile = async (req, res) => {
  try {
    const { name, email, phoneNumber, password } = req.body;

    const admin = await Admin.findById(req.user.id);
    if (!admin) {
      return res.status(404).json({ message: 'Admin not found' });
    }

    // Update basic info
    if (name) admin.name = name;
    if (email) admin.email = email;
    if (phoneNumber) admin.phoneNumber = phoneNumber;

    // Update and hash new password if provided
    if (password) {
      const salt = await bcrypt.genSalt(10);
      admin.password = await bcrypt.hash(password, salt);
    }

    const updatedAdmin = await admin.save();

    res.json({
      _id: updatedAdmin._id,
      name: updatedAdmin.name,
      email: updatedAdmin.email,
      phoneNumber: updatedAdmin.phoneNumber,
      role: updatedAdmin.role,
      organization: updatedAdmin.organization
    });
  } catch (error) {
    console.error('Error updating profile:', error);
    res.status(500).json({ message: 'Server error' });
  }
};
export const createDepartment = async (req, res) => {
  try {
    const { deptname, budget, deptHead } = req.body;
    const userId = req.user._id;

    let organizationId;
    let createdBy;

    // Try to fetch as Admin
    const admin = await Admin.findById(userId);
    if (admin) {
      organizationId = admin.organization;
      createdBy = userId;
    } else {
      // If not Admin, try fetching org by SuperAdmin
      const org = await Organization.findOne({ superAdmin: userId });
      if (!org) {
        return res.status(404).json({ message: 'Organization not found for this user' });
      }
      organizationId = org._id;
      createdBy = userId; // could be superAdmin in this case
    }

    const newDepartment = new Department({
      deptname,
      budget,
      organization: organizationId,
      createdBy,
      deptHead,
    });

    await newDepartment.save();

    res.status(201).json({
      message: 'Department created successfully',
      department: newDepartment,
    });
  } catch (error) {
    console.error('Error creating department:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};
export const addEmployee = async (req, res) => {
  try {
    const { empname, salary, phoneNumber, hireDate,position } = req.body;
    const { deptname } = req.params;

    const userId = req.user._id;

    let organization;

    // Determine if the user is an Admin or SuperAdmin
    const admin = await Admin.findById(userId);
    if (admin) {
      organization = await Organization.findById(admin.organization);
    } else {
      organization = await Organization.findOne({ superAdmin: userId });
    }

    if (!organization) {
      return res.status(403).json({ message: 'Unauthorized access. Organization not found.' });
    }

    // Find the department within the same organization
    const department = await Department.findOne({
      deptname,
      organization: organization._id,
    });

    if (!department) {
      return res.status(404).json({ message: 'Department not found in your organization' });
    }

    // Create the employee
    const newEmployee = new Employee({
      empname,
      salary,
      phoneNumber,
      hireDate,
      department: department._id,
      addEmpBy: userId,
      position
    });

    await newEmployee.save();

    res.status(201).json({
      message: 'Employee added successfully',
      employee: newEmployee,
    });
  } catch (error) {
    console.error('Error adding employee:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};
export const addTransaction = async (req, res) => {
    try {
      const {
        type,
        transactionType,
        amount,
        description,
        employeeId,
        departmentId,
        salary,
        bonus,
        from,
        to
      } = req.body;
  
      const enteredBy = req.user._id; // From auth middleware
      const enteredByModel = req.user.role; // Expecting 'Admin' or 'SuperAdmin' set in middleware
  
      let organizationId;
  
      if (enteredByModel === "Admin") {
        const admin = await Admin.findById(enteredBy);
        if (!admin) return res.status(404).json({ message: "Admin not found" });
        organizationId = admin.organization;
      } else if (enteredByModel === "superAdmin") {
        const superadmin = await superAdmin.findById(enteredBy);
        if (!superadmin) return res.status(404).json({ message: "SuperAdmin not found" });
        organizationId = superadmin.organization;
      } else {
        return res.status(403).json({ message: "Unauthorized role" });
      }
  
      const transactionData = {
        type,
        transactionType,
        amount,
        description,
        enteredBy,
        enteredByModel
      };
  
      if (type === 'payroll') {
        if (!employeeId || !departmentId || !salary) {
          return res.status(400).json({ message: 'Payroll requires employeeId, departmentId, and salary' });
        }
  
        const emp = await Employee.findById(employeeId);
        const dept = await Department.findById(departmentId);
  
        if (!emp || !dept) {
          return res.status(404).json({ message: 'Employee or Department not found' });
        }
        if(type==='payroll'){
          dept.expenditure+=amount;
          await dept.save();
        }
        transactionData.employeeId = employeeId;
        transactionData.departmentId = departmentId;
        transactionData.salary = salary;
        transactionData.bonus = bonus;
        transactionData.organization = organizationId;
      } else {
        // For non-payroll transactions, require from and to
        if (!from || !to) {
          return res.status(400).json({ message: '"from" and "to" are required for non-payroll transactions' });
        }
        transactionData.from = from;
        transactionData.to = to;
        transactionData.organization = organizationId;
      }
  
      const transaction = new Transaction(transactionData);
      await transaction.save();
  
      res.status(201).json({
        message: 'Transaction recorded successfully',
        transaction
      });
    } catch (error) {
      console.error('Transaction creation failed:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
};  
export const getAllDepartments = async (req, res) => {
  try {
    let organizationId;

    const admin = await Admin.findById(req.user._id);
    if (admin) {
      organizationId = admin.organization;
    } else {
      const org = await Organization.findOne({ superAdmin: req.user._id });
      if (!org) {
        return res.status(404).json({ message: "Associated organization not found" });
      }
      organizationId = org._id;
    }

    const departments = await Department.find({ organization: organizationId })
      .populate("deptHead", "empname")
      .populate("organization", "name");

    const formattedDepartments = await Promise.all(
      departments.map(async (dept) => {
        const empCount = await Employee.countDocuments({ department: dept._id });
        return {
          id: dept._id.toString(),
          name: dept.deptname,
          head: dept.deptHead?.empname || "Not Assigned",
          budget: dept.budget || 0,
          expenditure: dept.expenditure || 0,
          employees: empCount,
        };
      })
    );

    res.status(200).json(formattedDepartments);
  } catch (error) {
    console.error("Error fetching departments:", error);
    res.status(500).json({ message: "Error fetching departments", error });
  }
};
export const getDepartmentById = async (req, res) => {
    const { deptId } = req.params;
    const adminId = req.user._id;
  
    try {
      // Get the admin's organization
      const admin = await Admin.findById(adminId);
      if (!admin) {
        return res.status(404).json({ message: 'Admin not found' });
      }
  
      // Find department and populate
      const department = await Department.findById(deptId)
        .populate('deptHead', 'empname phoneNumber')
        .populate('organization', 'name');
  
      if (!department) {
        return res.status(404).json({ message: 'Department not found' });
      }
  
      // Check if department belongs to same organization
      if (!department.organization._id.equals(admin.organization)) {
        return res.status(403).json({ message: 'Access denied: Unauthorized organization' });
      }
  
      res.status(200).json(department);
    } catch (error) {
      res.status(500).json({ message: 'Error fetching department', error });
    }
};
export const searchEmployees = async (req, res) => {
  try {
    let organizationId;

    // Try as Admin
    const admin = await Admin.findById(req.user._id);
    if (admin && admin.organization) {
      organizationId = admin.organization;
    } else {
      // Try as SuperAdmin
      const org = await Organization.findOne({ superAdmin: req.user._id });
      if (!org) {
        return res.status(404).json({ message: 'Organization not found for user' });
      }
      organizationId = org._id;
    }

    // Fetch employees belonging to this organization via their department
    const employees = await Employee.find()
      .populate({
        path: 'department',
        match: { organization: organizationId }, // filter departments by org
        select: 'deptname organization'
      })
      .populate('addEmpBy', 'name') // Optionally populate addedBy admin name
      .lean();

    // Filter out employees whose department doesn't match organization (in case of mismatch)
    const filteredEmployees = employees.filter(emp => emp.department !== null);

    res.status(200).json(filteredEmployees);
  } catch (error) {
    console.error('Error searching employees:', error);
    res.status(500).json({ message: 'Internal server error', error });
  }
};
export const getEmployeeDetailsById = async (req, res) => {
    const { empId } = req.params;
    const adminId = req.user._id;
  
    try {
      // Fetch employee and verify access
      const employee = await Employee.findOne({ _id: empId, addEmpBy: adminId })
        .populate('department', 'dpetname');
  
      if (!employee) {
        return res.status(404).json({ message: 'Employee not found or unauthorized access' });
      }
  
      // Fetch all transactions linked to this employee
      const transactions = await Transaction.find({ employeeId: empId })
        .sort({ createdAt: -1 });
  
      res.status(200).json({
        employee,
        transactions
      });
    } catch (error) {
      console.error('Error fetching employee details:', error);
      res.status(500).json({ message: 'Internal server error', error });
    }
};
export const updateDepartment = async (req, res) => {
    const { deptId } = req.params;
    const adminId = req.user._id;
    const { dpetname, budget, expenditure, deptHead } = req.body;
  
    try {
      // Find the organization linked to the current admin
      const organization = await Organization.findOne({ superAdmin: adminId });
      if (!organization) {
        return res.status(403).json({ message: 'Unauthorized access to update department' });
      }
  
      // Check if department belongs to this organization
      const department = await Department.findOne({ _id: deptId, organization: organization._id });
      if (!department) {
        return res.status(404).json({ message: 'Department not found in your organization' });
      }
  
      // Update allowed fields
      if (dpetname) department.dpetname = dpetname;
      if (budget !== undefined) department.budget = budget;
      if (expenditure !== undefined) department.expenditure = expenditure;
      if (deptHead) department.deptHead = deptHead;
  
      await department.save();
  
      res.status(200).json({ message: 'Department updated successfully', department });
    } catch (error) {
      console.error('Error updating department:', error);
      res.status(500).json({ message: 'Failed to update department', error });
    }
};
export const deleteDepartment = async (req, res) => {
  const { deptId } = req.params;
  const userId = req.user._id;

  try {
    let organization;

    // Check if the user is an admin
    const admin = await Admin.findById(userId);
    if (admin) {
      organization = await Organization.findById(admin.organization);
    } else {
      // If not admin, check if the user is a superAdmin
      organization = await Organization.findOne({ superAdmin: userId });
    }

    if (!organization) {
      return res.status(403).json({ message: 'Unauthorized access. Organization not found.' });
    }

    // Ensure the department belongs to the user’s organization
    const department = await Department.findOne({ _id: deptId, organization: organization._id });
    if (!department) {
      return res.status(404).json({ message: 'Department not found in your organization' });
    }

    // Delete all employees of the department
    await Employee.deleteMany({ department: deptId });

    // Delete the department
    await Department.findByIdAndDelete(deptId);

    res.status(200).json({ message: 'Department and related employees deleted successfully' });
  } catch (error) {
    console.error('Error deleting department:', error);
    res.status(500).json({ message: 'Failed to delete department', error });
  }
};
export const deleteEmployee = async (req, res) => {
  const { empId } = req.params;
  const userId = req.user._id;

  try {
    const employee = await Employee.findById(empId).populate('department');
    if (!employee) {
      return res.status(404).json({ message: 'Employee not found' });
    }

    // Get the department and organization
    const department = await Department.findById(employee.department._id);
    const organization = await Organization.findById(department.organization);

    if (!organization) {
      return res.status(403).json({ message: 'Unauthorized access. Organization not found.' });
    }

    let isAuthorized = false;

    // Check if the user is a superAdmin of this organization
    if (organization.superAdmin.equals(userId)) {
      isAuthorized = true;
    }

    // If not, check if the user is an admin of this organization
    const admin = await Admin.findById(userId);
    if (admin && admin.organization.equals(organization._id)) {
      isAuthorized = true;
    }

    if (!isAuthorized) {
      return res.status(403).json({ message: 'Unauthorized to delete this employee' });
    }

    await Employee.findByIdAndDelete(empId);

    res.status(200).json({ message: 'Employee deleted successfully' });
  } catch (error) {
    console.error('Error deleting employee:', error);
    res.status(500).json({ message: 'Failed to delete employee', error });
  }
};
export const getAllTransactions = async (req, res) => {
  try {
    const transactions = await Transaction.find()
      .populate('employeeId', 'empname')       
      .populate('departmentId', 'deptname')
      .sort({ createdAt: -1 });
    const formatted = transactions.map((tx, index) => ({
      id: index + 1,
      date: tx.timestamp.toISOString().split('T')[0], // Format as YYYY-MM-DD
      type: tx.type,
      transactionType: tx.transactionType,
      description: tx.description,
      from: tx.type === 'payroll' ? tx.employeeId.empname : tx.from,
      to: tx.type === 'payroll' ? tx.departmentId.deptname : tx.to,
      amount: tx.amount,
    }));
    res.status(200).json(formatted);
  } catch (error) {
    console.error('Error fetching transactions:', error);
    res.status(500).json({ message: 'Server error fetching transactions' });
  }
};
export const getTotalDepartments = async (req, res) => {
  try {
    let organizationId;

    // Check if user is Admin
    const admin = await Admin.findById(req.user._id);
    if (admin && admin.organization) {
      organizationId = admin.organization;
    } else {
      // Otherwise, assume user is SuperAdmin
      const org = await Organization.findOne({ superAdmin: req.user._id });
      if (!org) {
        return res.status(404).json({ message: 'Organization not found for user' });
      }
      organizationId = org._id;
    }

    const totalDepartments = await Department.countDocuments({ organization: organizationId });

    res.status(200).json({ totalDepartments });
  } catch (err) {
    console.error('Error in getTotalDepartments:', err);
    res.status(500).json({ message: 'Internal server error' });
  }
};
export const getTotalEmployees = async (req, res) => {
  try {
    let organizationId;

    // Check if user is Admin
    const admin = await Admin.findById(req.user._id);
    if (admin && admin.organization) {
      organizationId = admin.organization;
    } else {
      // Otherwise, try as SuperAdmin
      const org = await Organization.findOne({ superAdmin: req.user._id });
      if (!org) {
        return res.status(404).json({ message: 'Organization not found for user' });
      }
      organizationId = org._id;
    }

    // Fetch employees and filter by department's organization
    const employees = await Employee.find()
      .populate({
        path: 'department',
        match: { organization: organizationId },
        select: '_id organization'
      })
      .lean();

    // Only count those whose department is in this organization
    const totalEmployees = employees.filter(emp => emp.department !== null).length;

    res.status(200).json({ totalEmployees });
  } catch (error) {
    console.error('Error getting total employees:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};
export const getDepartmentSpending = async (req, res) => {
  try {
    let organizationId;

    // Get organization ID from Admin or SuperAdmin
    const admin = await Admin.findById(req.user._id);
    if (admin && admin.organization) {
      organizationId = admin.organization;
    } else {
      const org = await Organization.findOne({ superAdmin: req.user._id });
      if (!org) {
        return res.status(404).json({ message: 'Organization not found for user' });
      }
      organizationId = org._id;
    }

    // Date 6 months ago
    const sixMonthsAgo = moment().subtract(6, 'months').startOf('month').toDate();

    // Aggregation pipeline to get department spending
    const spending = await Transaction.aggregate([
      {
        $match: {
          type: 'payroll',
          organization: new mongoose.Types.ObjectId(organizationId),
          createdAt: { $gte: sixMonthsAgo }
        }
      },
      {
        $group: {
          _id: '$departmentId',
          totalSpending: { $sum: { $add: ['$salary', { $ifNull: ['$bonus', 0] }] } }
        }
      },
      {
        $lookup: {
          from: 'departments',
          localField: '_id',
          foreignField: '_id',
          as: 'department'
        }
      },
      {
        $unwind: '$department'
      },
      {
        $project: {
          _id: 0,
          department: '$department.deptname',
          totalSpending: 1
        }
      }
    ]);

    res.status(200).json({ departmentSpending: spending });
  } catch (error) {
    console.error('Error getting department spending:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};
export const getMonthlyRevenue = async (req, res) => {
  try {
    let organizationId;

    // Determine organization from Admin or SuperAdmin
    // Try as Admin
      const admin = await Admin.findById(req.user._id);
      if (admin && admin.organization) {
        organizationId = admin.organization;
      } else {
        // Fallback to SuperAdmin
        const org = await Organization.findOne({ superAdmin: req.user._id });
        if (!org) {
          return res.status(404).json({ message: 'Organization not found for user' });
        }
        organizationId = org._id;
      }


    // Start of current year
    const startOfYear = moment().startOf('year').toDate();
    const endOfYear = moment().endOf('year').toDate();

    const monthlyData = await Transaction.aggregate([
      {
        $match: {
          organization: new mongoose.Types.ObjectId(organizationId),
          createdAt: { $gte: startOfYear, $lte: endOfYear }
        }
      },
      {
        $group: {
          _id: {
            month: { $month: '$createdAt' },
            transactionType: '$transactionType'
          },
          totalAmount: { $sum: '$amount' }
        }
      }
    ]);

    // Initialize revenue object for all 12 months
    const monthlyRevenue = Array.from({ length: 12 }, (_, i) => ({
      name: moment().month(i).format('MMM'),
      revenue: 0
    }));

    // Calculate net revenue: credit - debit
    monthlyData.forEach(entry => {
      const monthIndex = entry._id.month - 1;
      const isCredit = entry._id.transactionType === 'credit';
      if (isCredit) {
        monthlyRevenue[monthIndex].revenue += entry.totalAmount;
      } else {
        monthlyRevenue[monthIndex].revenue -= entry.totalAmount;
      }
    });

    res.status(200).json({ monthlyRevenueData: monthlyRevenue });
  } catch (error) {
    console.error('Error calculating monthly revenue:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};