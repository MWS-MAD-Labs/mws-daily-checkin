const User = require('../models/User');
const Organization = require('../models/Organization');
const { sendSuccess, sendError } = require('../utils/response');

// Get all users with pagination and filtering
const getUsers = async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 20;
        const skip = (page - 1) * limit;

        // Build filter query
        const filter = {};
        if (req.query.role) filter.role = req.query.role;
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

        const total = await User.countDocuments(filter);
        const users = await User.find(filter)
            .select('-password -googleProfile')
            .populate('reportsTo', 'name jobPosition')
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
        const user = await User.findById(req.params.id)
            .select('-password -googleProfile')
            .populate('reportsTo', 'name jobPosition department')
            .populate('subordinates', 'name jobPosition department');

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
        const departments = await User.distinct('department');
        const units = await User.distinct('unit');
        const roles = await User.distinct('role');
        const jobLevels = await User.distinct('jobLevel');

        // Get directorate members
        const directorate = await User.find({
            role: 'directorate',
            isActive: true
        }).select('name jobPosition department').sort('name');

        // Get department heads
        const departmentHeads = await User.find({
            jobLevel: 'Head Unit',
            isActive: true
        }).select('name department unit jobPosition').sort('department');

        // Get statistics
        const stats = {
            totalUsers: await User.countDocuments({ isActive: true }),
            byRole: await User.aggregate([
                { $match: { isActive: true } },
                { $group: { _id: '$role', count: { $sum: 1 } } }
            ]),
            byDepartment: await User.aggregate([
                { $match: { isActive: true, department: { $ne: null } } },
                { $group: { _id: '$department', count: { $sum: 1 } } }
            ]),
            byEmploymentStatus: await User.aggregate([
                { $match: { isActive: true } },
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
