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
exports.QueueEntry = void 0;
const mongoose_1 = __importStar(require("mongoose"));
const QueueEntrySchema = new mongoose_1.Schema({
    organizationId: { type: mongoose_1.Schema.Types.ObjectId, ref: 'Organization', required: true, index: true },
    locationId: { type: mongoose_1.Schema.Types.ObjectId, ref: 'Location' },
    departmentId: { type: mongoose_1.Schema.Types.ObjectId, ref: 'Department' },
    practitionerId: { type: mongoose_1.Schema.Types.ObjectId, ref: 'Practitioner' },
    patientId: { type: mongoose_1.Schema.Types.ObjectId, ref: 'Patient', required: true },
    checkInId: { type: mongoose_1.Schema.Types.ObjectId, ref: 'CheckIn' },
    appointmentId: { type: mongoose_1.Schema.Types.ObjectId, ref: 'Appointment' },
    queueId: { type: mongoose_1.Schema.Types.ObjectId, ref: 'Queue', required: true },
    tokenNumber: { type: String, required: true },
    queueDate: { type: Date, required: true, index: true },
    status: {
        type: String,
        enum: ['WAITING', 'IN_CONSULTATION', 'COMPLETED', 'SKIPPED', 'CANCELLED', 'NO_SHOW'],
        default: 'WAITING',
    },
    priority: {
        type: String,
        enum: ['NORMAL', 'HIGH', 'EMERGENCY'],
        default: 'NORMAL',
    },
    joinedAt: { type: Date, default: Date.now },
    calledAt: { type: Date },
    completedAt: { type: Date }
}, { timestamps: true });
exports.QueueEntry = mongoose_1.default.model('QueueEntry', QueueEntrySchema);
//# sourceMappingURL=queueEntry.model.js.map