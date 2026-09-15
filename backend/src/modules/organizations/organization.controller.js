"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getOrganizations = exports.createOrganization = void 0;
const express_1 = require("express");
const organization_model_1 = require("./organization.model");
const createOrganization = async (req, res) => {
    try {
        const { name, type, contactEmail, contactPhone, address } = req.body;
        const newOrganization = new organization_model_1.Organization({
            name,
            type,
            contactEmail,
            contactPhone,
            address,
        });
        const savedOrganization = await newOrganization.save();
        res.status(201).json(savedOrganization);
    }
    catch (error) {
        res.status(500).json({ message: 'Error creating organization', error });
    }
};
exports.createOrganization = createOrganization;
const getOrganizations = async (req, res) => {
    try {
        const organizations = await organization_model_1.Organization.find({ isActive: true });
        res.status(200).json(organizations);
    }
    catch (error) {
        res.status(500).json({ message: 'Error fetching organizations', error });
    }
};
exports.getOrganizations = getOrganizations;
//# sourceMappingURL=organization.controller.js.map