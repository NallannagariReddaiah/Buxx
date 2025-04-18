import Admin from '../../models/admin.model.js';
import Department from '../../models/department.model.js';
import Organization from '../../models/organization.model.js';
import Transaction from '../../models/transaction.model.js'
import bcrypt from 'bcryptjs'
import {v2 as cloudinary} from 'cloudinary';
import SystemNotification from '../../models/notification.model.js';
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
    const { dpetname, budget, deptHead } = req.body;
    const adminId = req.user._id; // from auth middleware

    
    const organization = await Organization.findOne({ _id: req.user.organization });

    if (!organization) {
      return res.status(404).json({ message: 'Organization not found for this admin' });
    }

    // Create department
    const newDepartment = new Department({
      dpetname,
      budget,
      deptHead,
      organization: organization._id,
      createdBy: adminId,
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
      const { empname, salary, phoneNumber, hireDate} = req.body;
      const department=req.params;
      const adminId = req.user._id; // from auth middleware
  
      // Validate department
      const deptExists = await Department.findById(department);
      if (!deptExists) {
        return res.status(404).json({ message: 'Department not found' });
      }
  
      // Create employee
      const newEmployee = new Employee({
        empname,
        salary,
        phoneNumber,
        hireDate,
        department,
        addEmpBy: adminId,
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
  
      const enteredBy = req.user._id; // From auth middleware (admin)
  
      const transactionData = {
        type,
        transactionType,
        amount,
        description,
        enteredBy
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
  
        transactionData.employeeId = employeeId;
        transactionData.departmentId = departmentId;
        transactionData.salary = salary;
        transactionData.bonus = bonus;
      } else {
        // For non-payroll transactions, require from and to
        if (!from || !to) {
          return res.status(400).json({ message: '"from" and "to" are required for non-payroll transactions' });
        }
        transactionData.from = from;
        transactionData.to = to;
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
      const adminId = req.user._id; // req.user should be set by auth middleware
  
      // Fetch admin to get the organization
      const admin = await Admin.findById(adminId);
      if (!admin) {
        return res.status(404).json({ message: 'Admin not found' });
      }
  
      const departments = await Department.find({ organization: admin.organization })
        .populate('deptHead', 'empname phoneNumber')
        .populate('organization', 'name');
  
      res.status(200).json(departments);
    } catch (error) {
      res.status(500).json({ message: 'Error fetching departments', error });
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
    const { search } = req.body;
    const adminId = req.user._id;
  
    try {
      // Find admin's organization
      const adminOrg = await Organization.findOne({ superAdmin: adminId });
      if (!adminOrg) {
        return res.status(404).json({ message: 'Organization not found for the admin' });
      }
  
      let employees = [];
  
      if (search) {
        // Find departments that match search term (case-insensitive)
        const matchingDepartments = await Department.find({
          organization: adminOrg._id,
          dpetname: { $regex: search, $options: 'i' }
        }).select('_id');
  
        const departmentIds = matchingDepartments.map(dept => dept._id);
  
        // Find employees that match either department or name
        employees = await Employee.find({
          $and: [
            { addEmpBy: adminId },
            {
              $or: [
                { empname: { $regex: search, $options: 'i' } },
                { department: { $in: departmentIds } }
              ]
            }
          ]
        })
          .populate('department', 'dpetname')
          .sort({ createdAt: -1 });
      } else {
        // Return all employees for the organization
        employees = await Employee.find({ addEmpBy: adminId })
          .populate('department', 'dpetname')
          .sort({ createdAt: -1 });
      }
  
      res.status(200).json(employees);
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
    const adminId = req.user._id;
  
    try {
      const organization = await Organization.findOne({ superAdmin: adminId });
      if (!organization) {
        return res.status(403).json({ message: 'Unauthorized access' });
      }
  
      const department = await Department.findOne({ _id: deptId, organization: organization._id });
      if (!department) {
        return res.status(404).json({ message: 'Department not found in your organization' });
      }
  
      await Department.findByIdAndDelete(deptId);
  
      res.status(200).json({ message: 'Department deleted successfully' });
    } catch (error) {
      console.error('Error deleting department:', error);
      res.status(500).json({ message: 'Failed to delete department', error });
    }
};
export const deleteEmployee = async (req, res) => {
    const { empId } = req.params;
    const adminId = req.user._id;
  
    try {
      const employee = await Employee.findById(empId).populate('department');
      if (!employee) {
        return res.status(404).json({ message: 'Employee not found' });
      }
  
      const department = await Department.findById(employee.department._id);
      const organization = await Organization.findOne({ _id: department.organization });
  
      if (!organization || !organization.superAdmin.equals(adminId)) {
        return res.status(403).json({ message: 'Unauthorized to delete this employee' });
      }
  
      await Employee.findByIdAndDelete(empId);
  
      res.status(200).json({ message: 'Employee deleted successfully' });
    } catch (error) {
      console.error('Error deleting employee:', error);
      res.status(500).json({ message: 'Failed to delete employee', error });
    }
};  