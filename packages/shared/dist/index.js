"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    Object.defineProperty(o, k2, { enumerable: true, get: function() { return m[k]; } });
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __exportStar = (this && this.__exportStar) || function(m, exports) {
    for (var p in m) if (p !== "default" && !Object.prototype.hasOwnProperty.call(exports, p)) __createBinding(exports, m, p);
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.LAST_NAMES = exports.FIRST_NAMES = void 0;
__exportStar(require("./enums/firestore"), exports);
__exportStar(require("./enums/errorMessages"), exports);
__exportStar(require("./types/firestore"), exports);
__exportStar(require("./types/cloudFunctions"), exports);
__exportStar(require("./utils"), exports);
const italian_names_json_1 = __importDefault(require("./assets/italian-names.json"));
const italian_surnames_json_1 = __importDefault(require("./assets/italian-surnames.json"));
exports.FIRST_NAMES = italian_names_json_1.default;
exports.LAST_NAMES = italian_surnames_json_1.default;
//# sourceMappingURL=index.js.map