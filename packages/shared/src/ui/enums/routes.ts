/** */
export enum Routes {
  Login = "/login",
  Unauthorized = "/unautorized",
  SelfRegister = "/self_register",
  CustomerArea = "/customer_area",
  ErrorBoundary = "/error_boundary",
  AttendancePrintable = "/attendance_printable",
  Debug = "/debug",
}

/** */
export enum CustomerRoute {
  Calendar = "calendar",
  BookIce = "book_ice",
  BookOffIce = "book_off_ice",
}

/** */
export enum PrivateRoutes {
  Root = "/",
  Athletes = "/athletes",
  NewAthlete = "/athletes/new",
  Slots = "/slots",
  AdminPreferences = "/admin_preferences",
}
