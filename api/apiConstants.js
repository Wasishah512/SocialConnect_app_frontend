const apiConstants = {
  // Environment-based API configuration
  baseUrl: "http://192.168.21.232:7860",

  //auth
  register: "/api/auth/register",
  login: "/api/auth/login",
  verifyOtp: "/api/auth/verify-otp",
  resendOtp: "/api/auth/resend-otp",
  forgotPassword: "/api/auth/forgot-password",
  resetPassword: "/api/auth/reset-password",
  me: "/api/users/profile/me",
  editme: "/api/users/profile/me/edit",

  //school
  allSchools: "/api/schools/all-schools",

  //parent
  addChild: "/api/parents/add-children",
  children: "/api/parents/children",
  giveFeedback: "/api/parents/feedback",
  vanFeedback: "/api/parents/van-feedback",
  feedbackHistory: "/api/parents/feedback-history",
  giveComplaint: "/api/parents/complaints",
  complaintHistory: "/api/parents/complaints-history",
  allActiveVans: "/api/parents/vans/all",
  vanDetail: "/api/parents/vans",
  bookings: "/api/parents/bookings",
  payment: "/api/parents/payment/pay-now",
  deleteChild: "/api/parents/children",
  updateChild: "/api/parents/children",
  childrenForLeave: "/api/parents/children-for-leave",
  childrenLeave: "/api/parents/leave",
  childLeaveHistory: "/api/parents/leave-history",
  getBookingChildren: "/api/parents/children-for-booking",
  getchildrenmood: "/api/parents/child-data",
  getDriverFineData: "/api/parents/get-fine-data",

  //payments
  paymentHistory: "/api/payments/payment-history",
  //paynow: '/api/payments/pay-now',
  //vans
  getAvailableVans: "api/parents/vans/all",
  bookVan: "/api/parents/vans/book",
  //bookings
  cancelbooking: "api/bookings/cancel",
  rebooking: "api/bookings/rebook",
  getVans: "api/vans/all",

  //driver
  createNewRoute: "/api/drivers/create-new-route",
  myRoutes: "/api/drivers/driver-routes",
  updateRoute: "/api/drivers/update-route-location",
  deleteRoute: "/api/drivers/delete-route",
  routeDetail: "/api/drivers/route-detail",
  assignedStudents: "/api/drivers/assigned-students",
  allStudents: "/api/drivers/all-students",
  studentDetail: "/api/drivers/student-details",
  earning: "/api/drivers/earning-by-year",
  studentPaymentHistory: "/api/drivers/payment-history",
  leaveDriver: "/api/drivers/leave-and-assign-new-driver",
  restoteDriver: "/api/drivers/restore-driver",
  studentFeedback: "/api/drivers/feedback",
  studentFeedbackHistory: "/api/drivers/feedback-history",
  studentComplaint: "/api/drivers/complaints",
  studentComplaintHistory: "/api/drivers/complaints-history",
  //allVans: '/api/drivers/all-vans',
  allAvailableDrivers: "/api/drivers/new-drivers",
  driverLeaveAndAssignNewDriver: "/api/drivers/leave-and-assign-new-driver",
  getAssignedDriver: "/api/drivers/assigned-drivers",
  restoreDriver: "/api/drivers/restore-driver",
  addvan: "/api/drivers/add-van",
  deleteVan: "/api/drivers/delete-van",
  updateVan: "/api/drivers/update-van",

  //police
  AllPendingDrivers: "/api/police/driver-applications",
  VerifyDriver: "/api/police/verify-driver",

  //school
  GetSchools: "/api/schools/all-schools",
  AllDrivers: "/api/schools/all-drivers",
  Reports: "/api/schools/driver-metrics",
  Complaints: "/api/schools/all-complaints",
  VerifyComplaints: "/api/schools/verify-complaint",
  AddSchoolBranch: "/api/schools/add-school-branch",

  getSchoolBranch: "/api/schools/school-data",
  deleteSchoolBranch: "/api/schools/delete-school-branch",
  editSchoolBranch: "/api/schools/update-school-branch",
  //guards verification by school
  schoolGuards: "/api/schools/school-guards",
  verifyGuard: "/api/schools/approve-guard",
  verifyAllStudents: "/api/schools/verify-all-students",

  //guard
  allActiveVans: "/api/guards/active-vans",
  verifyStudent: "/api/guards/verify-student",
};

// Helper function to convert file path to full URL
export const getFileUrl = (filePath) => {
  if (!filePath) return null;

  // Already a full URL
  if (typeof filePath === "string" && filePath.startsWith("http"))
    return filePath;

  const base = apiConstants.baseUrl
    ? String(apiConstants.baseUrl).replace(/\/$/, "")
    : "";

  // Normalize backslashes
  const normalized = String(filePath).replace(/\\/g, "/");

  // If starts with a slash, just join
  if (normalized.startsWith("/")) return `${base}${normalized}`;

  // If contains uploads segment, ensure /uploads is present
  const idx = normalized.toLowerCase().indexOf("uploads");
  if (idx >= 0) {
    const rel = normalized.slice(idx);
    return `${base}/${rel}`;
  }

  // Fallback
  return `${base}/${normalized}`;
};
export default apiConstants;
