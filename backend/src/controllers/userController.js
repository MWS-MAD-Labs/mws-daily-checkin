const Person = require('../models/Person');
const { PERSON_TYPE, JOB_KIND } = require('../constants/enums');

// User Management lists the employees synced from Central.
const EMPLOYEES = { personType: PERSON_TYPE.EMPLOYEE };
const Organization = require('../models/Organization');
const { sendSuccess, sendError } = require('../utils/response');

// Get all users with pagination and filtering
const getUsers = async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 20;
        const skip = (page - 1) * limit;

        // Build filter query
        const filter = { ...EMPLOYEES };
        if (req.query.role) filter.jobKind = req.query.role;
        if (req.query.department) filter.department = req.query.department;
        if (req.query.unit) filter.unit = req.query.unit;
        if (req.query.jobLevel) filter.jobLevel = req.query.jobLevel;
        if (req.query.employmentStatus) filter.employmentStatus = req.query.employmentStatus;
        if (req.query.isActive !== undefined) filter.isActive = req.query.isActive === 'true';

        // Search functionality
        if (req.query.search) {
            filter.$or = [
                { name: { $regex: req.query.search, $options: 'i' } },
                { email: { $regex: req.query.search, $options: 'i' } },
                { username: { $regex: req.query.search, $options: 'i' } },
                { jobPosition: { $regex: req.query.search, $options: 'i' } }
            ];
        }

        const total = await Person.countDocuments(filter);
        const users = await Person.find(filter)
            .select('-__v')
            .sort({ name: 1 })
            .skip(skip)
            .limit(limit);

        const totalPages = Math.ceil(total / limit);

        sendSuccess(res, 'Users retrieved successfully', {
            users,
            pagination: {
                currentPage: page,
                totalPages,
                totalUsers: total,
                hasNext: page < totalPages,
                hasPrev: page > 1
            }
        });
    } catch (error) {
        console.error('Get users error:', error);
        sendError(res, 'Failed to retrieve users', 500);
    }
};

// Get user by ID with full details
const getUserById = async (req, res) => {
    try {
        const user = await Person.findById(req.params.id).select('-__v');

        if (!user) {
            return sendError(res, 'User not found', 404);
        }

        // Get user's organizations
        const organizations = await Organization.find({
            $or: [
                { headId: user._id },
                { 'members.userId': user._id }
            ]
        }).populate('headId', 'name').populate('members.userId', 'name');

        sendSuccess(res, 'User details retrieved', {
            user,
            organizations
        });
    } catch (error) {
        console.error('Get user by ID error:', error);
        sendError(res, 'Failed to retrieve user details', 500);
    }
};

// Filter options and headcount stats for the user directory
const getOrganizationStructure = async (req, res) => {
    try {
        const departments = await Person.distinct('department', EMPLOYEES);
        const units = await Person.distinct('unit', EMPLOYEES);
        const roles = await Person.distinct('jobKind', EMPLOYEES);
        const jobLevels = await Person.distinct('jobLevel', EMPLOYEES);

        // Get directorate members
        const directorate = await Person.find({
            ...EMPLOYEES,
            jobKind: JOB_KIND.DIRECTORATE,
            isActive: true
        }).select('name jobPosition department').sort('name');

        // Get department heads
        const departmentHeads = await Person.find({
            ...EMPLOYEES,
            jobLevel: 'Head Unit',
            isActive: true
        }).select('name department unit jobPosition').sort('department');

        // Get statistics
        const stats = {
            totalUsers: await Person.countDocuments({ ...EMPLOYEES, isActive: true }),
            byRole: await Person.aggregate([
                { $match: { ...EMPLOYEES, isActive: true } },
                { $group: { _id: '$jobKind', count: { $sum: 1 } } }
            ]),
            byDepartment: await Person.aggregate([
                { $match: { ...EMPLOYEES, isActive: true, department: { $ne: null } } },
                { $group: { _id: '$department', count: { $sum: 1 } } }
            ]),
            byEmploymentStatus: await Person.aggregate([
                { $match: { ...EMPLOYEES, isActive: true } },
                { $group: { _id: '$employmentStatus', count: { $sum: 1 } } }
            ])
        };

        sendSuccess(res, 'Organization structure retrieved', {
            departments,
            units,
            roles,
            jobLevels,
            directorate,
            departmentHeads,
            stats
        });
    } catch (error) {
        console.error('Get organization structure error:', error);
        sendError(res, 'Failed to retrieve organization structure', 500);
    }
};

module.exports = {
    getUsers,
    getUserById,
    getOrganizationStructure
};
