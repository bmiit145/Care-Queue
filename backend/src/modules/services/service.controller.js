"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteService = exports.updateService = exports.getServiceById = exports.createService = exports.getServices = void 0;
const express_1 = require("express");
const service_model_1 = require("./service.model");
const auth_middleware_1 = require("../../shared/middlewares/auth.middleware");
const getServices = async (req, res) => {
    try {
        const filter = {
            organizationId: req.user.organizationId,
            isActive: true,
        };
        // Optional: filter by department
        if (req.query.departmentId)
            filter.departmentId = req.query.departmentId;
        const services = await service_model_1.Service.find(filter)
            .populate('departmentId', 'name')
            .sort({ name: 1 });
        res.status(200).json(services);
    }
    catch (error) {
        res.status(500).json({ message: 'Failed to fetch services', error });
    }
};
exports.getServices = getServices;
const createService = async (req, res) => {
    try {
        const { name, departmentId, description, durationInMinutes, price } = req.body;
        if (!name || !departmentId) {
            res.status(400).json({ message: 'name and departmentId are required' });
            return;
        }
        const service = await service_model_1.Service.create({
            organizationId: req.user.organizationId,
            name,
            departmentId,
            description,
            durationInMinutes: durationInMinutes || 15,
            price,
        });
        res.status(201).json(service);
    }
    catch (error) {
        res.status(500).json({ message: 'Failed to create service', error });
    }
};
exports.createService = createService;
const getServiceById = async (req, res) => {
    try {
        const service = await service_model_1.Service.findOne({
            _id: req.params.id,
            organizationId: req.user.organizationId,
        }).populate('departmentId', 'name');
        if (!service) {
            res.status(404).json({ message: 'Service not found' });
            return;
        }
        res.status(200).json(service);
    }
    catch (error) {
        res.status(500).json({ message: 'Failed to fetch service', error });
    }
};
exports.getServiceById = getServiceById;
const updateService = async (req, res) => {
    try {
        const service = await service_model_1.Service.findOneAndUpdate({ _id: req.params.id, organizationId: req.user.organizationId }, req.body, { new: true, runValidators: true });
        if (!service) {
            res.status(404).json({ message: 'Service not found' });
            return;
        }
        res.status(200).json(service);
    }
    catch (error) {
        res.status(500).json({ message: 'Failed to update service', error });
    }
};
exports.updateService = updateService;
const deleteService = async (req, res) => {
    try {
        const service = await service_model_1.Service.findOneAndUpdate({ _id: req.params.id, organizationId: req.user.organizationId }, { isActive: false }, { new: true });
        if (!service) {
            res.status(404).json({ message: 'Service not found' });
            return;
        }
        res.status(200).json({ message: 'Service deactivated', service });
    }
    catch (error) {
        res.status(500).json({ message: 'Failed to delete service', error });
    }
};
exports.deleteService = deleteService;
//# sourceMappingURL=service.controller.js.map