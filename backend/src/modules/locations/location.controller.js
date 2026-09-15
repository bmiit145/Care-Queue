"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteLocation = exports.updateLocation = exports.getLocationById = exports.createLocation = exports.getLocations = void 0;
const express_1 = require("express");
const location_model_1 = require("./location.model");
const auth_middleware_1 = require("../../shared/middlewares/auth.middleware");
// GET /api/locations — org-scoped list
const getLocations = async (req, res) => {
    try {
        const locations = await location_model_1.Location.find({
            organizationId: req.user.organizationId,
            isActive: true,
        }).sort({ name: 1 });
        res.status(200).json(locations);
    }
    catch (error) {
        res.status(500).json({ message: 'Failed to fetch locations', error });
    }
};
exports.getLocations = getLocations;
// POST /api/locations — ORG_ADMIN / PLATFORM_ADMIN only
const createLocation = async (req, res) => {
    try {
        const { name, type, address, phone, contactEmail } = req.body;
        if (!name || !type) {
            res.status(400).json({ message: 'name and type are required' });
            return;
        }
        const location = await location_model_1.Location.create({
            organizationId: req.user.organizationId,
            name,
            type,
            address,
            phone,
            contactEmail,
        });
        res.status(201).json(location);
    }
    catch (error) {
        res.status(500).json({ message: 'Failed to create location', error });
    }
};
exports.createLocation = createLocation;
// GET /api/locations/:id
const getLocationById = async (req, res) => {
    try {
        const location = await location_model_1.Location.findOne({
            _id: req.params.id,
            organizationId: req.user.organizationId,
        });
        if (!location) {
            res.status(404).json({ message: 'Location not found' });
            return;
        }
        res.status(200).json(location);
    }
    catch (error) {
        res.status(500).json({ message: 'Failed to fetch location', error });
    }
};
exports.getLocationById = getLocationById;
// PUT /api/locations/:id — ORG_ADMIN only
const updateLocation = async (req, res) => {
    try {
        const location = await location_model_1.Location.findOneAndUpdate({ _id: req.params.id, organizationId: req.user.organizationId }, req.body, { new: true, runValidators: true });
        if (!location) {
            res.status(404).json({ message: 'Location not found' });
            return;
        }
        res.status(200).json(location);
    }
    catch (error) {
        res.status(500).json({ message: 'Failed to update location', error });
    }
};
exports.updateLocation = updateLocation;
// DELETE /api/locations/:id — soft delete
const deleteLocation = async (req, res) => {
    try {
        const location = await location_model_1.Location.findOneAndUpdate({ _id: req.params.id, organizationId: req.user.organizationId }, { isActive: false }, { new: true });
        if (!location) {
            res.status(404).json({ message: 'Location not found' });
            return;
        }
        res.status(200).json({ message: 'Location deactivated', location });
    }
    catch (error) {
        res.status(500).json({ message: 'Failed to delete location', error });
    }
};
exports.deleteLocation = deleteLocation;
//# sourceMappingURL=location.controller.js.map