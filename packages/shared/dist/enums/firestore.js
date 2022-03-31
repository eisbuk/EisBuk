"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Category = exports.SlotType = exports.BookingSubCollection = exports.OrgSubCollection = exports.Collection = void 0;
// region collections names
var Collection;
(function (Collection) {
    Collection["Organizations"] = "organizations";
    /**
     * Queue for emails waiting to be sent using `firestore-send-email`
     * extension. The value is "mail" as it's the default for an extension.
     *
     * This can be changed, but the change should be reflected in firestore extension setup as well.
     */
    Collection["EmailQueue"] = "mail";
    /**
     * A separate "secrets" collection for each organization.
     * "Hidden away" from client by firestore.rules, can only be
     * accessed from cloud function environment and written to from the client.
     */
    Collection["Secrets"] = "secrets";
})(Collection = exports.Collection || (exports.Collection = {}));
var OrgSubCollection;
(function (OrgSubCollection) {
    OrgSubCollection["Slots"] = "slots";
    OrgSubCollection["SlotsByDay"] = "slotsByDay";
    OrgSubCollection["Customers"] = "customers";
    OrgSubCollection["Bookings"] = "bookings";
    OrgSubCollection["Attendance"] = "attendance";
})(OrgSubCollection = exports.OrgSubCollection || (exports.OrgSubCollection = {}));
var BookingSubCollection;
(function (BookingSubCollection) {
    BookingSubCollection["BookedSlots"] = "bookedSlots";
})(BookingSubCollection = exports.BookingSubCollection || (exports.BookingSubCollection = {}));
// endregion
// region slots
var SlotType;
(function (SlotType) {
    SlotType["Ice"] = "ice";
    SlotType["OffIce"] = "off-ice";
})(SlotType = exports.SlotType || (exports.SlotType = {}));
var Category;
(function (Category) {
    Category["Course"] = "course";
    Category["PreCompetitive"] = "pre-competitive";
    Category["Competitive"] = "competitive";
    Category["Adults"] = "adults";
})(Category = exports.Category || (exports.Category = {}));
// endregion
//# sourceMappingURL=firestore.js.map