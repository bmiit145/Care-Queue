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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.User = exports.USER_ROLES = void 0;
const mongoose_1 = __importStar(require("mongoose"));
const bcryptjs_1 = __importDefault(require("bcryptjs"));
/**
 * Roles as defined in docs/phase-1-architecture.md § 13
 * PLATFORM_ADMIN  — Care-Queue platform owner, manages all tenants
 * ORG_ADMIN       — Hospital / clinic administrator for one tenant
 * RECEPTIONIST    — Front-desk staff: check-in, queue, appointments
 * PRACTITIONER    — Doctor / dentist / physiotherapist etc. (generic per § 10)
 * STAFF           — General support staff
 * PATIENT         — Mobile-app patient user
 */
exports.USER_ROLES = [
    'PLATFORM_ADMIN',
    'ORG_ADMIN',
    'RECEPTIONIST',
    'PRACTITIONER',
    'STAFF',
    'PATIENT',
];
const UserSchema = new mongoose_1.Schema({
    email: { type: String, required: true, unique: true, lowercase: true, index: true },
    passwordHash: { type: String, required: true },
    firstName: { type: String, required: true, trim: true },
    lastName: { type: String, required: true, trim: true },
    phone: { type: String },
    role: { type: String, enum: exports.USER_ROLES, required: true, default: 'PATIENT' },
    organizationId: { type: mongoose_1.Schema.Types.ObjectId, ref: 'Organization', index: true },
    isActive: { type: Boolean, default: true },
}, { timestamps: true });
// Instance method — compare plain password against stored hash
UserSchema.methods.comparePassword = async function (candidatePassword) {
    return bcryptjs_1.default.compare(candidatePassword, this.passwordHash);
};
exports.User = mongoose_1.default.model('User', UserSchema);
//# sourceMappingURL=user.model.js.map