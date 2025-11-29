import Loan from "../model/loan.model.js";
import Payment from "../model/payment.model.js";
import Task from "../model/task.model.js";
import User from "../model/user.model.js";
export const createEmployee = async (req, res) => {
  try {
    let {
      firstName,
      lastName,
      email,
      password,
      phoneNumber,
      nationalId,
      kraPin,
      citizenship,
      jobType,
      gender,
      address,
      emergencyContact,
      nextOfKin,
      employmentType
    } = req.body;
    const capitalizeWords = (str) => {
      if (!str) return str;
      return str
        .toLowerCase()
        .split(/(\s|,)/)
        .map(word => {
          if (word === " " || word === ",") return word;
          return word.charAt(0).toUpperCase() + word.slice(1);
        })
        .join("");
    };
    firstName = capitalizeWords(firstName);
    lastName = capitalizeWords(lastName);
    if (address) {
      address.location = capitalizeWords(address.location);
      address.county = capitalizeWords(address.county);
      address.subLocation = capitalizeWords(address.subLocation);
      if (address.street) {
        address.street = capitalizeWords(address.street);
      }
    }
    if (emergencyContact) {
      emergencyContact.firstName = capitalizeWords(emergencyContact.firstName);
      emergencyContact.lastName = capitalizeWords(emergencyContact.lastName);
    }
    if (nextOfKin) {
      nextOfKin.fullName = capitalizeWords(nextOfKin.fullName);
    }
    const employeeExists = await User.findOne({ 
      $or: [
        { email },
        { nationalId },
        { kraPin }
      ]
    });
    if (employeeExists) {
      if (employeeExists.email === email) {
        return res.status(400).json({ message: 'Employee with this email already exists' });
      }
      if (employeeExists.nationalId === nationalId) {
        return res.status(400).json({ message: 'Employee with this national ID already exists' });
      }
      if (employeeExists.kraPin === kraPin) {
        return res.status(400).json({ message: 'Employee with this KRA PIN already exists' });
      }
    }
if (employmentType?.type === 'permanent') {
  delete employmentType.duration;
} else if (employmentType?.type === 'contract') {
  if (!employmentType.duration?.unit || !employmentType.duration?.value) {
    return res.status(400).json({ 
      message: 'Contract employees must have duration unit and value.' 
    });
  }
}
const employee = await User.create({
  firstName,
  lastName,
  email,
  password,
  phoneNumber,
  nationalId,
  kraPin,
  citizenship,
  jobType,
  gender,
  address,
  emergencyContact,
  nextOfKin,
  employmentType,
  role: 'employee'
});
    if (employee) {
      res.status(201).json({
        _id: employee._id,
        firstName: employee.firstName,
        lastName: employee.lastName,
        nationalId: employee.nationalId,
        kraPin: employee.kraPin,
        citizenship: employee.citizenship,
        email: employee.email,
        role: employee.role,
        jobType: employee.jobType,
        employmentType: employee.employmentType
      });
    } else {
      res.status(400).json({ message: 'Invalid employee data' });
    }
  } catch (error) {
    console.error('Error in createEmployee:', error.message);
    res.status(500).json({ message: 'Server error' });
  }
}; 

export const getEmployees = async (req, res) => {
  try {
    const { page = 1, limit = 10, search = '', jobType = '' } = req.query;
    const currentUserId = req.user._id;
    
    const query = {
      _id: { $ne: currentUserId },
      ...(search && {
        $or: [
          { firstName: { $regex: search, $options: 'i' } },
          { lastName: { $regex: search, $options: 'i' } },
          { email: { $regex: search, $options: 'i' } },
          { kraPin: { $regex: search, $options: 'i' } },
          { citizenship: { $regex: search, $options: 'i' } }
        ]
      }),
      ...(jobType && { jobType })
    };

    const employees = await User.find(query)
      .select('-password')
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .sort({ createdAt: -1 });

    // Get performance data for each employee
    const employeesWithStats = await Promise.all(
      employees.map(async (employee) => {
        const employeeId = employee._id;

        // Get loans registered by this employee
        const loansRegistered = await Loan.find({ createdBy: employeeId });
        const totalLoansRegistered = loansRegistered.length;
        
        // Get total amount managed (totalAmount of all loans)
        const totalAmountManaged = loansRegistered.reduce((sum, loan) => sum + (loan.totalAmount || 0), 0);
        
        // Get payments recorded by this employee
        const paymentsRecorded = await Payment.find({ receivedBy: employeeId, status: 'completed' });
        const totalAmountRecovered = paymentsRecorded.reduce((sum, payment) => sum + (payment.amount || 0), 0);
        
        // Calculate recovery rate
        const recoveryRate = totalAmountManaged > 0 ? (totalAmountRecovered / totalAmountManaged) * 100 : 0;
        
        // Get loan status breakdown
        const completedLoans = loansRegistered.filter(loan => loan.status === 'completed').length;
        const activeLoans = loansRegistered.filter(loan => loan.status === 'active').length;
        const defaultedLoans = loansRegistered.filter(loan => loan.status === 'defaulted').length;
        
        // Get pending tasks
        const pendingTasks = await Task.countDocuments({ 
          assignedTo: employeeId, 
          status: { $in: ['pending', 'in-progress'] } 
        });

        // Get recent tasks (for display)
        const recentTasks = await Task.find({ assignedTo: employeeId })
          .populate('loan', 'loanNumber')
          .sort({ dueDate: 1 })
          .limit(3)
          .select('title taskType priority dueDate amountCollected loan');

        return {
          ...employee.toObject(),
          performance: {
            totalLoansRegistered,
            completedLoans,
            activeLoans,
            defaultedLoans,
            totalAmountManaged,
            totalAmountRecovered,
            recoveryRate: Math.round(recoveryRate * 100) / 100
          },
          pendingTasks,
          recentTasks: recentTasks.map(task => ({
            _id: task._id,
            title: task.title,
            taskType: task.taskType,
            priority: task.priority,
            dueDate: task.dueDate,
            amountCollected: task.amountCollected || 0,
            loanNumber: task.loan?.loanNumber
          }))
        };
      })
    );

    const count = await User.countDocuments(query);

    // Calculate team stats
    const teamStats = {
      totalMembers: employeesWithStats.length,
      totalLoansRegistered: employeesWithStats.reduce((sum, emp) => sum + emp.performance.totalLoansRegistered, 0),
      totalAmountManaged: employeesWithStats.reduce((sum, emp) => sum + emp.performance.totalAmountManaged, 0),
      totalAmountRecovered: employeesWithStats.reduce((sum, emp) => sum + emp.performance.totalAmountRecovered, 0),
      avgRecoveryRate: employeesWithStats.length > 0 
        ? employeesWithStats.reduce((sum, emp) => sum + emp.performance.recoveryRate, 0) / employeesWithStats.length 
        : 0,
      pendingTasks: employeesWithStats.reduce((sum, emp) => sum + emp.pendingTasks, 0)
    };

    res.json({
      employees: employeesWithStats,
      teamStats,
      totalPages: Math.ceil(count / limit),
      currentPage: parseInt(page),
      totalEmployees: count
    });
  } catch (error) {
    console.error('Error in getEmployees:', error.message);
    res.status(500).json({ 
      message: 'Server error',
      error: error.message 
    });
  }
};
export const getEmployeeById = async (req, res) => {
  try {
    const employee = await User.findById(req.params.id).select('-password');
    if (employee && employee.role === 'employee') {
      res.json(employee);
    } else {
      res.status(404).json({ message: 'Employee not found' });
    }
  } catch (error) {
    console.error('Error in getEmployeeById:', error.message);
    res.status(500).json({ message: 'Server error' });
  }
};
export const toggleEmployeeActiveStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { isActive } = req.body;
    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({ message: 'Employee not found' });
    }
    if (user._id.toString() === req.user._id.toString()) {
      return res.status(400).json({ message: 'Cannot change your own active status' });
    }
    user.isActive = isActive;
    await user.save();
    res.json({
      message: `Employee ${isActive ? 'activated' : 'deactivated'} successfully`,
      user: {
        _id: user._id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        isActive: user.isActive
      }
    });
  } catch (error) {
    console.error('Error toggling employee active status:', error.message);
    res.status(500).json({ message: 'Server error' });
  }
};
export const deleteEmployee = async (req, res) => {
  try {
    const employee = await User.findById(req.params.id);

    if (employee) {
      if (employee.role === 'admin') {
        return res.status(400).json({ message: 'Cannot delete admin user' });
      }
      await employee.deleteOne();
      res.json({ message: 'Employee removed' });
    } else {
      res.status(404).json({ message: 'Employee not found' });
    }
  } catch (error) {
    console.error('Error in deleteEmployee:', error.message);
    res.status(500).json({ message: 'Server error' });
  }
};
export const bulkDeleteEmployees = async (req, res) => {
  try {
    const { ids } = req.body;
    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({ message: 'Invalid employee IDs' });
    }
    const result = await User.deleteMany({
      _id: { $in: ids },
      role: { $ne: 'admin' }
    });

    if (result.deletedCount === 0) {
      return res.status(404).json({ message: 'No employees found to delete' });
    }
    res.json({
      message: `${result.deletedCount} employees deleted successfully`,
      deletedCount: result.deletedCount
    });
  } catch (error) {
    console.error('Error in bulkDeleteEmployees:', error.message);
    res.status(500).json({ message: 'Server error' });
  }
};
export const getEmployeeStats = async (req, res) => {
  try {
    const statsByJobType = await User.aggregate([
      { $match: { role: 'employee' } },
      { $group: { _id: '$jobType', count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ]);
    const statsByGender = await User.aggregate([
      { $match: { role: 'employee' } },
      { $group: { _id: '$gender', count: { $sum: 1 } } }
    ]);
    const totalEmployees = await User.countDocuments({ role: 'employee' });
    const totalAdmins = await User.countDocuments({ role: 'admin' });
    const activeEmployees = await User.countDocuments({ role: 'employee', isActive: true });
    res.json({
      byJobType: statsByJobType,
      byGender: statsByGender,
      totalEmployees,
      totalAdmins,
      activeEmployees
    });
  } catch (error) {
    console.error('Error in getEmployeeStats:', error.message);
    res.status(500).json({ message: 'Server error' });
  }
};
export const updateEmployee = async (req, res) => {
  try {
    const employee = await User.findById(req.params.id);
    if (employee) {
      const capitalizeWords = (str) => {
        if (!str) return str;
        return str
          .toLowerCase()
          .split(/(\s|,)/)
          .map(word => {
            if (word === " " || word === ",") return word;
            return word.charAt(0).toUpperCase() + word.slice(1);
          })
          .join("");
      };
      if (req.body.firstName) employee.firstName = capitalizeWords(req.body.firstName);
      if (req.body.lastName) employee.lastName = capitalizeWords(req.body.lastName);
      if (req.body.email) employee.email = req.body.email;
      if (req.body.nationalId) employee.nationalId = req.body.nationalId;
      if (req.body.phoneNumber) employee.phoneNumber = req.body.phoneNumber;
      if (req.body.kraPin) employee.kraPin = req.body.kraPin;
      if (req.body.citizenship) employee.citizenship = req.body.citizenship;
      if (req.body.jobType) employee.jobType = capitalizeWords(req.body.jobType);
      if (req.body.gender) employee.gender = req.body.gender;
      if (req.body.address) {
        employee.address.location = capitalizeWords(req.body.address.location || employee.address.location);
        employee.address.county = capitalizeWords(req.body.address.county || employee.address.county);
        employee.address.subLocation = capitalizeWords(req.body.address.subLocation || employee.address.subLocation);
        if (req.body.address.street) {
          employee.address.street = capitalizeWords(req.body.address.street);
        }
      }
      if (req.body.emergencyContact) {
        employee.emergencyContact.firstName = capitalizeWords(req.body.emergencyContact.firstName || employee.emergencyContact.firstName);
        employee.emergencyContact.lastName = capitalizeWords(req.body.emergencyContact.lastName || employee.emergencyContact.lastName);
        employee.emergencyContact.relationship = req.body.emergencyContact.relationship || employee.emergencyContact.relationship;
        employee.emergencyContact.phoneNumber = req.body.emergencyContact.phoneNumber || employee.emergencyContact.phoneNumber;
      }
      if (req.body.nextOfKin) {
        employee.nextOfKin.fullName = capitalizeWords(req.body.nextOfKin.fullName || employee.nextOfKin.fullName);
        employee.nextOfKin.phoneNumber = req.body.nextOfKin.phoneNumber || employee.nextOfKin.phoneNumber;
        employee.nextOfKin.email = req.body.nextOfKin.email || employee.nextOfKin.email;
      }
      if (req.body.employmentType) {
        employee.employmentType.type = req.body.employmentType.type || employee.employmentType.type;
        if (req.body.employmentType.duration) {
          employee.employmentType.duration.unit = req.body.employmentType.duration.unit || employee.employmentType.duration.unit;
          employee.employmentType.duration.value = req.body.employmentType.duration.value || employee.employmentType.duration.value;
        }
      }
      if (req.body.role) employee.role = req.body.role;
      if (req.body.isActive !== undefined) employee.isActive = req.body.isActive;

      if (req.body.password) {
        employee.password = req.body.password;
      }
      const updatedEmployee = await employee.save();
      res.json({
        _id: updatedEmployee._id,
        firstName: updatedEmployee.firstName,
        lastName: updatedEmployee.lastName,
        nationalId: updatedEmployee.nationalId,
        kraPin: updatedEmployee.kraPin,
        citizenship: updatedEmployee.citizenship,
        email: updatedEmployee.email,
        role: updatedEmployee.role,
        jobType: updatedEmployee.jobType,
        employmentType: updatedEmployee.employmentType,
        isActive: updatedEmployee.isActive
      });
    } else {
      res.status(404).json({ message: 'Employee not found' });
    }
  } catch (error) {
    console.error('Error in updateEmployee:', error.message);
    res.status(500).json({ message: 'Server error' });
  }
};