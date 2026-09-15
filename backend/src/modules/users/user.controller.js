"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteUser = exports.updateUser = exports.getUserById = exports.createUser = exports.getUsers = void 0;
const express_1 = require("express");
const user_model_1 = require("../users/user.model");
const auth_middleware_1 = require("../../shared/middlewares/auth.middleware");
const bcryptjs_1 = __importDefault(require("bcryptjs"));
/**
 * GET /api/users
 * PLATFORM_ADMIN sees all; ORG_ADMIN sees only their org users.
 */
const getUsers = async (req, res) => {
    try {
        const filter = { isActive: true };
        if (req.user.role !== 'PLATFORM_ADMIN') {
            filter.organizationId = req.user.organizationId;
        }
        const users = await user_model_1.User.find(filter).select('-passwordHash').sort({ lastName: 1 });
        res.status(200).json(users);
    }
    catch (error) {
        res.status(500).json({ message: 'Failed to fetch users', error });
    }
};
exports.getUsers = getUsers;
/**
 * POST /api/users
 * PLATFORM_ADMIN or ORG_ADMIN can create/invite users into the system.
 */
const createUser = async (req, res) => {
    try {
        const { firstName, lastName, email, password, role, phone, organizationId } = req.body;
        if (!firstName || !lastName || !email || !password || !role) {
            res.status(400).json({ message: 'firstName, lastName, email, password, and role are required' });
            return;
        }
        if (!user_model_1.USER_ROLES.includes(role)) {
            res.status(400).json({ message: `Invalid role. Must be one of: ${user_model_1.USER_ROLES.join(', ')}` });
            return;
        }
        const existing = await user_model_1.User.findOne({ email: email.toLowerCase() });
        if (existing) {
            res.status(400).json({ message: 'A user with this email already exists' });
            return;
        }
        // ORG_ADMIN can only create users in their own org
        const assignedOrgId = req.user.role === 'PLATFORM_ADMIN'
            ? organizationId || req.user.organizationId
            : req.user.organizationId;
        const salt = await bcryptjs_1.default.genSalt(12);
        const passwordHash = await bcryptjs_1.default.hash(password, salt);
        const user = await user_model_1.User.create({
            firstName,
            lastName,
            email: email.toLowerCase(),
            passwordHash,
            phone,
            role,
            organizationId: assignedOrgId,
        });
        res.status(201).json({
            _id: user._id,
            firstName: user.firstName,
            lastName: user.lastName,
            email: user.email,
            role: user.role,
            organizationId: user.organizationId,
        });
    }
    catch (error) {
        res.status(500).json({ message: 'Failed to create user', error });
    }
};
exports.createUser = createUser;
/**
 * GET /api/users/:id
 */
const getUserById = async (req, res) => {
    try {
        const filter = { _id: req.params.id };
        if (req.user.role !== 'PLATFORM_ADMIN') {
            filter.organizationId = req.user.organizationId;
        }
        const user = await user_model_1.User.findOne(filter).select('-passwordHash');
        if (!user) {
            res.status(404).json({ message: 'User not found' });
            return;
        }
        res.status(200).json(user);
    }
    catch (error) {
        res.status(500).json({ message: 'Failed to fetch user', error });
    }
};
exports.getUserById = getUserById;
/**
 * PUT /api/users/:id — update profile / role
 */
const updateUser = async (req, res) => {
    try {
        // Prevent role escalation beyond own level
        if (req.body.role && req.user.role !== 'PLATFORM_ADMIN' && req.body.role === 'PLATFORM_ADMIN') {
            res.status(403).json({ message: 'Cannot assign PLATFORM_ADMIN role' });
            return;
        }
        const filter = { _id: req.params.id };
        if (req.user.role !== 'PLATFORM_ADMIN') {
            filter.organizationId = req.user.organizationId;
        }
        const { firstName, lastName, phone, role, isActive } = req.body;
        const user = await user_model_1.User.findOneAndUpdate(filter, { firstName, lastName, phone, role, isActive }, { new: true, runValidators: true }).select('-passwordHash');
        if (!user) {
            res.status(404).json({ message: 'User not found' });
            return;
        }
        res.status(200).json(user);
    }
    catch (error) {
        res.status(500).json({ message: 'Failed to update user', error });
    }
};
exports.updateUser = updateUser;
/**
 * DELETE /api/users/:id — soft delete
 */
const deleteUser = async (req, res) => {
    try {
        const filter = { _id: req.params.id };
        if (req.user.role !== 'PLATFORM_ADMIN') {
            filter.organizationId = req.user.organizationId;
        }
        const user = await user_model_1.User.findOneAndUpdate(filter, { isActive: false }, { new: true }).select('-passwordHash');
        if (!user) {
            res.status(404).json({ message: 'User not found' });
            return;
        }
        res.status(200).json({ message: 'User deactivated', user });
    }
    catch (error) {
        res.status(500).json({ message: 'Failed to deactivate user', error });
    }
};
exports.deleteUser = deleteUser;
//# sourceMappingURL=user.controller.js.map