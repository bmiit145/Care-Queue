"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.requireOrg = exports.authorize = exports.protect = void 0;
const express_1 = require("express");
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const user_model_1 = require("../../modules/users/user.model");
/**
 * protect — verifies the Bearer JWT and attaches req.user.
 * organizationId is embedded in the token at login time so every
 * downstream controller can use it for tenant-scoped queries without
 * hitting the database again.
 */
const protect = async (req, res, next) => {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        res.status(401).json({ message: 'Not authorized — no token provided' });
        return;
    }
    const token = authHeader.split(' ')[1];
    try {
        const decoded = jsonwebtoken_1.default.verify(token, process.env.JWT_SECRET || 'changeme_in_production');
        // Re-verify the user still exists and is active
        const user = await user_model_1.User.findById(decoded.id).select('-passwordHash').lean();
        if (!user || !user.isActive) {
            res.status(401).json({ message: 'Not authorized — user not found or deactivated' });
            return;
        }
        req.user = {
            id: decoded.id,
            role: decoded.role,
            organizationId: decoded.organizationId,
        };
        next();
    }
    catch {
        res.status(401).json({ message: 'Not authorized — token invalid or expired' });
    }
};
exports.protect = protect;
/**
 * authorize — role-based access control guard.
 * Usage: authorize('ORG_ADMIN', 'RECEPTIONIST')
 *
 * Roles per docs/phase-1-architecture.md § 13:
 *   PLATFORM_ADMIN | ORG_ADMIN | RECEPTIONIST | PRACTITIONER | STAFF | PATIENT
 */
const authorize = (...allowedRoles) => {
    return (req, res, next) => {
        if (!req.user) {
            res.status(401).json({ message: 'Not authorized — authenticate first' });
            return;
        }
        if (!allowedRoles.includes(req.user.role)) {
            res.status(403).json({
                message: `Forbidden — role '${req.user.role}' is not permitted to access this resource`,
                allowedRoles,
            });
            return;
        }
        next();
    };
};
exports.authorize = authorize;
/**
 * requireOrg — ensures the authenticated user belongs to an organization.
 * Must be used after protect() on all org-scoped routes.
 */
const requireOrg = (req, res, next) => {
    if (!req.user?.organizationId) {
        res.status(403).json({
            message: 'Forbidden — this endpoint requires an organization context',
        });
        return;
    }
    next();
};
exports.requireOrg = requireOrg;
//# sourceMappingURL=auth.middleware.js.map