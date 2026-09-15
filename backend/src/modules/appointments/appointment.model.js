"use strict";
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
exports.Appointment = void 0;
const mongoose_1 = __importStar(require("mongoose"));
const AppointmentSchema = new mongoose_1.Schema({
    organizationId: { type: mongoose_1.Schema.Types.ObjectId, ref: 'Organization', required: true, index: true },
    locationId: { type: mongoose_1.Schema.Types.ObjectId, ref: 'Location' },
    patientId: { type: mongoose_1.Schema.Types.ObjectId, ref: 'Patient', required: true, index: true },
    practitionerId: { type: mongoose_1.Schema.Types.ObjectId, ref: 'Practitioner' },
    departmentId: { type: mongoose_1.Schema.Types.ObjectId, ref: 'Department' },
    serviceId: { type: mongoose_1.Schema.Types.ObjectId, ref: 'Service' },
    date: { type: Date, required: true, index: true },
    scheduledStartTime: { type: Date },
    scheduledEndTime: { type: Date },
    status: {
        type: String,
        required: true,
        enum: ['BOOKED', 'CONFIRMED', 'CHECKED_IN', 'IN_QUEUE', 'IN_CONSULTATION', 'COMPLETED', 'CANCELLED', 'NO_SHOW', 'RESCHEDULED'],
        default: 'BOOKED'
    },
    source: {
        type: String,
        required: true,
        enum: ['ONLINE', 'WALK_IN', 'PHONE', 'RECEPTION', 'REFERRAL'],
        default: 'ONLINE'
    }
}, { timestamps: true });
exports.Appointment = mongoose_1.default.model('Appointment', AppointmentSchema);
//# sourceMappingURL=appointment.model.js.map