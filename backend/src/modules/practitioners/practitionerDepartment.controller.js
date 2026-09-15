"use strict";
/**
 * Practitioner-Department assignment controller.
 *
 * Supports many-to-many:
 *   POST  /api/practitioners/:id/departments        — assign a practitioner to a dept
 *   GET   /api/practitioners/:id/departments        — list depts for a practitioner
 *   DELETE /api/practitioners/:id/departments/:deptId — remove assignment
 *   GET   /api/departments/:deptId/practitioners    — list practitioners in a dept
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.getPractitionersInDepartment = exports.removeDepartmentAssignment = exports.getPractitionerDepartments = exports.assignDepartment = void 0;
const express_1 = require("express");
const practitionerDepartment_model_1 = require("./practitionerDepartment.model");
const practitioner_model_1 = require("./practitioner.model");
const auth_middleware_1 = require("../../shared/middlewares/auth.middleware");
// ── Assign practitioner → department ─────────────────────────────────────────
const assignDepartment = async (req, res) => {
    try {
        const { id: practitionerId } = req.params;
        const { departmentId, serviceIds, slotDurationMin } = req.body;
        const organizationId = req.user.organizationId;
        if (!departmentId) {
            res.status(400).json({ message: 'departmentId is required' });
            return;
        }
        // Verify practitioner belongs to this org
        const practitioner = await practitioner_model_1.Practitioner.findOne({ _id: practitionerId, organizationId });
        if (!practitioner) {
            res.status(404).json({ message: 'Practitioner not found' });
            return;
        }
        // Upsert — if already assigned, update serviceIds
        const assignment = await practitionerDepartment_model_1.PractitionerDepartment.findOneAndUpdate({ organizationId, practitionerId, departmentId }, { serviceIds: serviceIds || [], slotDurationMin, isActive: true }, { new: true, upsert: true, setDefaultsOnInsert: true });
        res.status(200).json(assignment);
    }
    catch (error) {
        res.status(500).json({ message: 'Error assigning department', error });
    }
};
exports.assignDepartment = assignDepartment;
// ── Get departments for a practitioner ───────────────────────────────────────
const getPractitionerDepartments = async (req, res) => {
    try {
        const { id: practitionerId } = req.params;
        const organizationId = req.user.organizationId;
        const assignments = await practitionerDepartment_model_1.PractitionerDepartment.find({
            organizationId,
            practitionerId,
            isActive: true,
        })
            .populate('departmentId', 'name')
            .populate('serviceIds', 'name defaultDurationMin');
        res.status(200).json(assignments);
    }
    catch (error) {
        res.status(500).json({ message: 'Error fetching practitioner departments', error });
    }
};
exports.getPractitionerDepartments = getPractitionerDepartments;
// ── Remove assignment ─────────────────────────────────────────────────────────
const removeDepartmentAssignment = async (req, res) => {
    try {
        const { id: practitionerId, deptId: departmentId } = req.params;
        const organizationId = req.user.organizationId;
        const result = await practitionerDepartment_model_1.PractitionerDepartment.findOneAndUpdate({ organizationId, practitionerId, departmentId }, { isActive: false }, { new: true });
        if (!result) {
            res.status(404).json({ message: 'Department assignment not found' });
            return;
        }
        res.status(200).json({ message: 'Department assignment removed', result });
    }
    catch (error) {
        res.status(500).json({ message: 'Error removing department assignment', error });
    }
};
exports.removeDepartmentAssignment = removeDepartmentAssignment;
// ── List practitioners in a department ───────────────────────────────────────
const getPractitionersInDepartment = async (req, res) => {
    try {
        const { deptId } = req.params;
        const organizationId = req.user.organizationId;
        const assignments = await practitionerDepartment_model_1.PractitionerDepartment.find({
            organizationId,
            departmentId: deptId,
            isActive: true,
        })
            .populate('practitionerId', 'firstName lastName type specializations isActive')
            .populate('serviceIds', 'name defaultDurationMin');
        res.status(200).json(assignments);
    }
    catch (error) {
        res.status(500).json({ message: 'Error fetching practitioners in department', error });
    }
};
exports.getPractitionersInDepartment = getPractitionersInDepartment;
//# sourceMappingURL=practitionerDepartment.controller.js.map