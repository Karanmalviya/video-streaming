const User = require('../models/User');

const getUsers = async (req, res, next) => {
    try {

        const query = {
            organizationId: req.query.organizationId || req.user.organizationId,
        };
        const users = await User.find(query).select('-password').sort({ createdAt: -1 });
        res.json({ users });
    } catch (error) {
        next(error);
    }
};

const updateUserRole = async (req, res, next) => {
    try {
        const { role } = req.body;
        if (!['viewer', 'editor', 'admin'].includes(role)) {
            return res.status(400).json({ message: 'Invalid role. Must be viewer, editor, or admin.' });
        }

        const user = await User.findByIdAndUpdate(
            req.params.id,
            { role },
            { new: true }
        ).select('-password');

        if (!user) {
            return res.status(404).json({ message: 'User not found.' });
        }

        res.json({ message: 'Role updated successfully.', user });
    } catch (error) {
        next(error);
    }
};

module.exports = { getUsers, updateUserRole };
