"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DeprecatedSlotType = exports.DeprecatedBookingSubCollection = exports.DeprecatedOrgSubCollection = exports.DeprecatedDuration = void 0;
var DeprecatedDuration;
(function (DeprecatedDuration) {
    DeprecatedDuration["1h"] = "60";
    DeprecatedDuration["1.5h"] = "90";
    DeprecatedDuration["2h"] = "120";
})(DeprecatedDuration = exports.DeprecatedDuration || (exports.DeprecatedDuration = {}));
var DeprecatedOrgSubCollection;
(function (DeprecatedOrgSubCollection) {
    DeprecatedOrgSubCollection["Slots"] = "slots";
    DeprecatedOrgSubCollection["SlotsByDay"] = "slotsByDay";
    DeprecatedOrgSubCollection["Customers"] = "customers";
    DeprecatedOrgSubCollection["Bookings"] = "bookings";
    DeprecatedOrgSubCollection["BookingsByDay"] = "bookingsByDay";
})(DeprecatedOrgSubCollection = exports.DeprecatedOrgSubCollection || (exports.DeprecatedOrgSubCollection = {}));
var DeprecatedBookingSubCollection;
(function (DeprecatedBookingSubCollection) {
    DeprecatedBookingSubCollection["SubscribedSlots"] = "subscribedSlots";
})(DeprecatedBookingSubCollection = exports.DeprecatedBookingSubCollection || (exports.DeprecatedBookingSubCollection = {}));
var DeprecatedSlotType;
(function (DeprecatedSlotType) {
    DeprecatedSlotType["Ice"] = "ice";
    DeprecatedSlotType["OffIceDancing"] = "off-ice-dancing";
    DeprecatedSlotType["OffIceGym"] = "off-ice-gym";
})(DeprecatedSlotType = exports.DeprecatedSlotType || (exports.DeprecatedSlotType = {}));
//# sourceMappingURL=firestore.js.map