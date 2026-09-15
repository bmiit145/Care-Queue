"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getPatientById = exports.getPatients = exports.registerPatient = void 0;
const express_1 = require("express");
const patient_model_1 = require("./patient.model");
const auth_middleware_1 = require("../../shared/middlewares/auth.middleware");
const registerPatient = async (req, res) => {
    try {
        const { firstName, lastName, dateOfBirth, gender, mobileNumber, email, address, emergencyContact } = req.body;
        const organizationId = req.user.organizationId;
        const patient = await patient_model_1.Patient.create({
            organizationId,
            firstName,
            lastName,
            dateOfBirth,
            gender,
            mobileNumber,
            email,
            address,
            emergencyContact,
        });
        res.status(201).json(patient);
    }
    catch (error) {
        res.status(500).json({ message: 'Error registering patient', error });
    }
};
exports.registerPatient = registerPatient;
const getPatients = async (req, res) => {
    try {
        const organizationId = req.user.organizationId;
        const patients = await patient_model_1.Patient.find({ organizationId });
        res.status(200).json(patients);
    }
    catch (error) {
        res.status(500).json({ message: 'Error fetching patients', error });
    }
};
exports.getPatients = getPatients;
const getPatientById = async (req, res) => {
    try {
        const organizationId = req.user.organizationId;
        const patient = await patient_model_1.Patient.findOne({ _id: req.params.id, organizationId });
        if (!patient) {
            res.status(404).json({ message: 'Patient not found' });
            return;
        }
        res.status(200).json(patient);
    }
    catch (error) {
        res.status(500).json({ message: 'Error fetching patient', error });
    }
};
exports.getPatientById = getPatientById;
//# sourceMappingURL=patient.controller.js.map