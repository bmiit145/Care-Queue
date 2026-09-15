"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getMe = exports.login = exports.register = void 0;
const express_1 = require("express");
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const user_model_1 = require("../users/user.model");
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '30d';
/**
 * Generate a signed JWT embedding id, role, and organizationId.
 * organizationId is critical for tenant isolation on every subsequent request.
 */
const generateToken = (id, role, organizationId) => {
    const secret = process.env.JWT_SECRET || 'changeme_in_production';
    return jsonwebtoken_1.default.sign({ id, role, organizationId }, secret, { expiresIn: JWT_EXPIRES_IN });
};
// ─────────────────────────────────────────
// POST /api/auth/register
// ─────────────────────────────────────────
const register = async (req, res) => {
    try {
        const { firstName, lastName, email, password, phone, role, organizationId, } = req.body;
        if (!firstName || !lastName || !email || !password) {
            res.status(400).json({ message: 'firstName, lastName, email, and password are required' });
            return;
        }
        const existingUser = await user_model_1.User.findOne({ email: email.toLowerCase() });
        if (existingUser) {
            res.status(400).json({ message: 'A user with this email already exists' });
            return;
        }
        const salt = await bcryptjs_1.default.genSalt(12);
        const passwordHash = await bcryptjs_1.default.hash(password, salt);
        const assignedRole = role || 'PATIENT';
        const user = await user_model_1.User.create({
            firstName,
            lastName,
            email: email.toLowerCase(),
            passwordHash,
            phone,
            role: assignedRole,
            organizationId: organizationId || undefined,
            isActive: true,
        });
        res.status(201).json({
            _id: user._id,
            firstName: user.firstName,
            lastName: user.lastName,
            email: user.email,
            role: user.role,
            organizationId: user.organizationId,
            token: generateToken(user._id.toString(), user.role, user.organizationId?.toString()),
        });
    }
    catch (error) {
        res.status(500).json({ message: 'Registration failed', error });
    }
};
exports.register = register;
// ─────────────────────────────────────────
// POST /api/auth/login
// ─────────────────────────────────────────
const login = async (req, res) => {
    try {
        const { email, password } = req.body;
        if (!email || !password) {
            res.status(400).json({ message: 'email and password are required' });
            return;
        }
        const user = await user_model_1.User.findOne({ email: email.toLowerCase() });
        if (!user || !user.isActive) {
            res.status(401).json({ message: 'Invalid credentials' });
            return;
        }
        const isMatch = await user.comparePassword(password);
        if (!isMatch) {
            res.status(401).json({ message: 'Invalid credentials' });
            return;
        }
        res.status(200).json({
            _id: user._id,
            firstName: user.firstName,
            lastName: user.lastName,
            email: user.email,
            role: user.role,
            organizationId: user.organizationId,
            token: generateToken(user._id.toString(), user.role, user.organizationId?.toString()),
        });
    }
    catch (error) {
        res.status(500).json({ message: 'Login failed', error });
    }
};
exports.login = login;
// ─────────────────────────────────────────
// GET /api/auth/me
// ─────────────────────────────────────────
const getMe = async (req, res) => {
    try {
        const user = await user_model_1.User.findById(req.user.id).select('-passwordHash').lean();
        if (!user) {
            res.status(404).json({ message: 'User not found' });
            return;
        }
        res.status(200).json(user);
    }
    catch (error) {
        res.status(500).json({ message: 'Failed to fetch profile', error });
    }
};
exports.getMe = getMe;
//# sourceMappingURL=auth.controller.js.map