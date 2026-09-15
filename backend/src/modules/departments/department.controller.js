"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteDepartment = exports.updateDepartment = exports.getDepartmentById = exports.createDepartment = exports.getDepartments = void 0;
const express_1 = require("express");
const department_model_1 = require("./department.model");
const auth_middleware_1 = require("../../shared/middlewares/auth.middleware");
const getDepartments = async (req, res) => {
    try {
        const departments = await department_model_1.Department.find({
            organizationId: req.user.organizationId,
            isActive: true,
        }).populate('locationId', 'name').sort({ name: 1 });
        res.status(200).json(departments);
    }
    catch (error) {
        res.status(500).json({ message: 'Failed to fetch departments', error });
    }
};
exports.getDepartments = getDepartments;
const createDepartment = async (req, res) => {
    try {
        const { name, description, locationId } = req.body;
        if (!name) {
            res.status(400).json({ message: 'name is required' });
            return;
        }
        const department = await department_model_1.Department.create({
            organizationId: req.user.organizationId,
            name,
            description,
            locationId,
        });
        res.status(201).json(department);
    }
    catch (error) {
        res.status(500).json({ message: 'Failed to create department', error });
    }
};
exports.createDepartment = createDepartment;
const getDepartmentById = async (req, res) => {
    try {
        const department = await department_model_1.Department.findOne({
            _id: req.params.id,
            organizationId: req.user.organizationId,
        }).populate('locationId', 'name address');
        if (!department) {
            res.status(404).json({ message: 'Department not found' });
            return;
        }
        res.status(200).json(department);
    }
    catch (error) {
        res.status(500).json({ message: 'Failed to fetch department', error });
    }
};
exports.getDepartmentById = getDepartmentById;
const updateDepartment = async (req, res) => {
    try {
        const department = await department_model_1.Department.findOneAndUpdate({ _id: req.params.id, organizationId: req.user.organizationId }, req.body, { new: true, runValidators: true });
        if (!department) {
            res.status(404).json({ message: 'Department not found' });
            return;
        }
        res.status(200).json(department);
    }
    catch (error) {
        res.status(500).json({ message: 'Failed to update department', error });
    }
};
exports.updateDepartment = updateDepartment;
const deleteDepartment = async (req, res) => {
    try {
        const department = await department_model_1.Department.findOneAndUpdate({ _id: req.params.id, organizationId: req.user.organizationId }, { isActive: false }, { new: true });
        if (!department) {
            res.status(404).json({ message: 'Department not found' });
            return;
        }
        res.status(200).json({ message: 'Department deactivated', department });
    }
    catch (error) {
        res.status(500).json({ message: 'Failed to delete department', error });
    }
};
exports.deleteDepartment = deleteDepartment;
//# sourceMappingURL=department.controller.js.map