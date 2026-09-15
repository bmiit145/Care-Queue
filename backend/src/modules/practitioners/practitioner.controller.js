"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.deletePractitioner = exports.updatePractitioner = exports.getPractitionerById = exports.createPractitioner = exports.getPractitioners = void 0;
const practitioner_model_1 = require("./practitioner.model");
const getPractitioners = async (req, res) => {
    try {
        const filter = {
            organizationId: req.user.organizationId,
            isActive: true,
        };
        if (req.query.type)
            filter.type = req.query.type;
        const practitioners = await practitioner_model_1.Practitioner.find(filter)
            .populate('userId', 'firstName lastName email')
            .sort({ lastName: 1 });
        res.status(200).json(practitioners);
    }
    catch (error) {
        res.status(500).json({ message: 'Failed to fetch practitioners', error });
    }
};
exports.getPractitioners = getPractitioners;
const createPractitioner = async (req, res) => {
    try {
        const { firstName, lastName, type, specializations, contactEmail, contactPhone, userId } = req.body;
        if (!firstName || !lastName || !type) {
            res.status(400).json({ message: 'firstName, lastName, and type are required' });
            return;
        }
        const practitioner = await practitioner_model_1.Practitioner.create({
            organizationId: req.user.organizationId,
            firstName,
            lastName,
            type,
            specializations: specializations || [],
            contactEmail,
            contactPhone,
            userId,
        });
        res.status(201).json(practitioner);
    }
    catch (error) {
        res.status(500).json({ message: 'Failed to create practitioner', error });
    }
};
exports.createPractitioner = createPractitioner;
const getPractitionerById = async (req, res) => {
    try {
        const practitioner = await practitioner_model_1.Practitioner.findOne({
            _id: req.params.id,
            organizationId: req.user.organizationId,
        }).populate('userId', 'firstName lastName email');
        if (!practitioner) {
            res.status(404).json({ message: 'Practitioner not found' });
            return;
        }
        res.status(200).json(practitioner);
    }
    catch (error) {
        res.status(500).json({ message: 'Failed to fetch practitioner', error });
    }
};
exports.getPractitionerById = getPractitionerById;
const updatePractitioner = async (req, res) => {
    try {
        const practitioner = await practitioner_model_1.Practitioner.findOneAndUpdate({ _id: req.params.id, organizationId: req.user.organizationId }, req.body, { new: true, runValidators: true });
        if (!practitioner) {
            res.status(404).json({ message: 'Practitioner not found' });
            return;
        }
        res.status(200).json(practitioner);
    }
    catch (error) {
        res.status(500).json({ message: 'Failed to update practitioner', error });
    }
};
exports.updatePractitioner = updatePractitioner;
const deletePractitioner = async (req, res) => {
    try {
        const practitioner = await practitioner_model_1.Practitioner.findOneAndUpdate({ _id: req.params.id, organizationId: req.user.organizationId }, { isActive: false }, { new: true });
        if (!practitioner) {
            res.status(404).json({ message: 'Practitioner not found' });
            return;
        }
        res.status(200).json({ message: 'Practitioner deactivated', practitioner });
    }
    catch (error) {
        res.status(500).json({ message: 'Failed to delete practitioner', error });
    }
};
exports.deletePractitioner = deletePractitioner;
//# sourceMappingURL=practitioner.controller.js.map