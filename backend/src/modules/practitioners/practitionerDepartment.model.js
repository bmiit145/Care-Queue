"use strict";
/**
 * PractitionerDepartment — many-to-many junction model.
 *
 * Architecture requirement:
 *   Dr. Patel → Cardiology (Consultation, ECG)
 *   Dr. Patel → General Medicine (Consultation)
 *
 * This replaces a single `departmentId` field on the Practitioner model.
 * A practitioner can belong to multiple departments; per department they
 * may offer a subset of services.
 */
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.PractitionerDepartment = void 0;
const mongoose_1 = __importStar(require("mongoose"));
const PractitionerDepartmentSchema = new mongoose_1.Schema({
    organizationId: { type: mongoose_1.Schema.Types.ObjectId, ref: 'Organization', required: true, index: true },
    practitionerId: { type: mongoose_1.Schema.Types.ObjectId, ref: 'Practitioner', required: true, index: true },
    departmentId: { type: mongoose_1.Schema.Types.ObjectId, ref: 'Department', required: true, index: true },
    serviceIds: [{ type: mongoose_1.Schema.Types.ObjectId, ref: 'Service' }],
    slotDurationMin: { type: Number, min: 1 },
    isActive: { type: Boolean, default: true },
}, { timestamps: true });
// Unique compound index — one practitioner can have ONE record per department per org
PractitionerDepartmentSchema.index({ organizationId: 1, practitionerId: 1, departmentId: 1 }, { unique: true });
exports.PractitionerDepartment = mongoose_1.default.model('PractitionerDepartment', PractitionerDepartmentSchema);
//# sourceMappingURL=practitionerDepartment.model.js.map