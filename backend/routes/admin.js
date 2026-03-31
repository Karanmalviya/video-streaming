const express = require('express');
const router = express.Router();
const { getUsers, updateUserRole } = require('../controllers/adminController');
const authenticate = require('../middleware/auth');
const authorize = require('../middleware/rbac');

router.use(authenticate, authorize('admin'));

router.get('/users', getUsers);

router.put('/users/:id/role', updateUserRole);

module.exports = router;
