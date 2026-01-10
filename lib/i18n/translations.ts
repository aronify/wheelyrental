/**
 * Language Dictionary and Context
 *
 * Provides English and Albanian translations for the owner portal.
 * This will be used across dashboard, bookings, and other screens.
 */

export type Language = "en" | "al";

export interface LanguageDictionary {
  // Common
  allBookings: string;
  filterByStatus: string;
  filterByDate: string;
  filterByRating: string;
  statusPending: string;
  statusConfirmed: string;
  statusPickedUp: string;
  statusReturned: string;
  statusCancelled: string;
  totalPrice: string;
  customer: string;
  car: string;
  pickup: string;
  dropoff: string;
  createdAt: string;
  actions: string;
  markAsConfirmed: string;
  markAsPickedUp: string;
  markAsReturned: string;
  cancelBooking: string;
  noResults: string;
  searchByCustomerOrCar: string;
  bookings: string;
  bookingsSubtitle: string;
  manageBookingsDescription: string;
  view: string;
  all: string;
  from: string;
  to: string;
  dealerName: string;
  dates: string;
  status: string;
  bookingDetails: string;
  close: string;
  success: string;
  bookingUpdated: string;
  bookingTimeline: string;

  // Dashboard
  dashboard: string;
  welcomeBack: string;
  overview: string;
  activeRentals: string;
  totalRevenue: string;
  pendingApprovals: string;
  recentBookings: string;
  viewAllBookings: string;
  logout: string;
  loggingOut: string;
  signOutAccount: string;
  account: string;
  profile: string;
  settings: string;
  viewOverview: string;
  editProfileSettings: string;
  carManagement: string;
  analytics: string;
  revenueOverTime: string;
  last6Months: string;
  bookingsTrend: string;
  bookingsByStatus: string;
  noDataAvailable: string;
  vsLastMonth: string;
  currentlyActive: string;
  awaitingConfirmation: string;
  thisMonth: string;
  allTime: string;
  allTimeDistribution: string;
  todayBookings: string;
  monthlyBookings: string;
  monthlyRevenue: string;
  back: string;
  quickActions: string;
  goTo: string;
  recentActivity: string;
  topPerformingCars: string;

  upcomingBookings: string;
  upcomingPickups: string;
  noUpcomingPickups: string;
  noBookingsYet: string;
  fleetStatus: string;
  todaysSchedule: string;
  revenue: string;
  fleet: string;
  activity: string;
  viewAll: string;
  addNewCar: string;
  addBooking: string;
  viewReports: string;
  manageFleet: string;
  ago: string;
  justNow: string;
  minutesAgo: string;
  hoursAgo: string;
  daysAgo: string;
  newBooking: string;
  bookingConfirmed: string;
  carReturned: string;
  paymentReceived: string;

  // Cars
  cars: string;
  carsSubtitle: string;
  addCar: string;
  editCar: string;
  deleteCar: string;
  carDetails: string;
  brand: string;
  model: string;
  year: string;
  plateNumber: string;
  color: string;
  selectColor: string;
  transmission: string;
  fuelType: string;
  seats: string;
  dailyRate: string;
  mileage: string;
  description: string;
  features: string;
  carName: string;
  automatic: string;
  manual: string;
  petrol: string;
  diesel: string;
  electric: string;
  hybrid: string;
  statusAvailable: string;
  statusRented: string;
  statusMaintenance: string;
  statusInactive: string;
  statusActive: string;
  statusRetired: string;
  totalCars: string;
  availableCars: string;
  confirmDelete: string;
  confirmDeleteMessage: string;
  cancel: string;
  delete: string;
  save: string;
  update: string;
  required: string;
  searchCars: string;
  noCarsFound: string;
  carAdded: string;
  carUpdated: string;
  carDeleted: string;
  perDay: string;
  km: string;

  // Customers
  customers: string;
  customersSubtitle: string;
  reviews: string;
  reviewsSubtitle: string;
  totalReviews: string;
  averageRating: string;
  fiveStarReviews: string;
  oneStarReviews: string;
  searchReviews: string;
  allRatings: string;
  stars: string;
  star: string;
  noReviewsFound: string;
  tryDifferentFilters: string;
  noReviewsYet: string;
  bookingReference: string;
  customerDetails: string;
  customerName: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  country: string;
  dateOfBirth: string;
  licenseNumber: string;
  licenseExpiryDate: string;
  totalBookings: string;
  totalSpent: string;
  joinedAt: string;
  lastBookingAt: string;
  notes: string;
  searchCustomers: string;
  noCustomersFound: string;
  sortBy: string;
  sortByName: string;
  sortByBookings: string;
  sortBySpent: string;
  sortByJoined: string;
  sortByLastBooking: string;
  viewDetails: string;
  bookingHistory: string;
  topCustomers: string;
  recentCustomers: string;
  lifetimeValue: string;

  // Calendar
  calendar: string;
  calendarSubtitle: string;
  today: string;
  month: string;
  week: string;
  day: string;
  upcomingDropoffs: string;
  noEventsToday: string;
  noEventsThisWeek: string;
  pickupTime: string;
  dropoffTime: string;
  location: string;
  locations: string;
  pickupLocation: string;
  dropoffLocation: string;
  pickupLocations: string;
  dropoffLocations: string;
  noPickupLocations: string;
  noDropoffLocations: string;
  addLocation: string;
  selectMultipleLocations: string;
  addCustomLocation: string;
  locationName: string;
  enterLocationName: string;
  enterAddress: string;
  enterCity: string;
  duration: string;
  days: string;
  viewCalendar: string;
  allEvents: string;
  todaysEvents: string;
  thisWeeksEvents: string;
  monthView: string;
  weekView: string;
  dayView: string;
  listView: string;
  activeBookings: string;
  scheduledPickups: string;
  scheduledDropoffs: string;
  timeline: string;
  morning: string;
  afternoon: string;
  evening: string;
  noEventsScheduled: string;
  bookingSchedule: string;
  viewBooking: string;

  // Profile
  myProfile: string;
  ownerPortal: string;
  profileSettings: string;
  editProfile: string;
  saveProfile: string;
  cancelEdit: string;
  agencyName: string;
  agencyDescription: string;
  contactInformation: string;
  businessInformation: string;
  postalCode: string;
  website: string;
  taxId: string;
  profileUpdated: string;
  profileUpdateFailed: string;
  requiredField: string;
  agencyDetails: string;
  contactDetails: string;
  locationDetails: string;
  additionalInfo: string;
  uploadLogo: string;
  changeLogo: string;
  removeLogo: string;
  logoUploadInfo: string;
  dragDropLogo: string;
  orClickToUpload: string;
  logoPreview: string;
  // Company Data Prompt
  companyDataRequiredTitle: string;
  companyDataRequiredMessage: string;
  updateCompanyInfo: string;
  noCompanyTitle: string;
  noCompanyMessage: string;
  completeProfileToStart: string;
  goToProfile: string;
  active: string;
  found: string;
  statusPickedup: string;
  customerInformation: string;
  carInformation: string;
  pickupDate: string;
  returnDate: string;
  fullName: string;
  contactPerson: string;
  subject: string;
  message: string;
  sendMessage: string;
  sending: string;
  messageSent: string;
  subjectPlaceholder: string;
  messagePlaceholder: string;
  make: string;
  licensePlate: string;
  fileClaim: string;
  fileDamageClaim: string;
  damageDescription: string;
  damageType: string;
  estimatedCost: string;
  notifyInsurance: string;
  uploadPhotos: string;
  clickToUploadPhotos: string;
  photoSelected: string;
  selectDamageType: string;
  scratch: string;
  dent: string;
  broken: string;
  stain: string;
  other: string;
  describeDamage: string;
  estimatedRepairCost: string;
  submitClaim: string;
  claimWarning: string;
  claimFiled: string;
  carImage: string;
  basicInfo: string;
  details: string;
  addNewCarToFleet: string;
  updateCarDetails: string;
  uploadCarImage: string;
  uploadCarImageDescription: string;
  addMorePhotos: string;
  addAnotherPhoto: string;
  clickToUpload: string;
  orDragAndDrop: string;
  autoCompressed: string;
  basicInformation: string;
  provideBasicCarDetails: string;
  additionalDetails: string;
  provideMoreDetails: string;
  add: string;
  next: string;
  previous: string;
  completeAllSteps: string;
  vin: string;
  saving: string;
  saveChanges: string;
  addYourFirstCar: string;
  edit: string;

  // Quick Start Guide
  quickStartTitle: string;
  quickStartSubtitle: string;
  quickStartProfileTitle: string;
  quickStartProfileDesc: string;
  quickStartLocationsTitle: string;
  quickStartLocationsDesc: string;
  quickStartCarsTitle: string;
  quickStartCarsDesc: string;
  quickStartComplete: string;
  quickStartCompleteMsg: string;
  completeNow: string;
  addLocations: string;
  manage: string;
  viewFleet: string;
  dismiss: string;
  image: string;
  specifications: string;
  pricing: string;
  surname: string;
  nationality: string;
  age: string;
  years: string;
  downloadLicense: string;
  addNotes: string;
  clickToAddNotes: string;
  reportFine: string;
  fineDetails: string;
  fineType: string;
  finePrice: string;
  fineWarning: string;
  describeFine: string;
  selectFineType: string;
  speedingFine: string;
  parkingFine: string;
  redLightFine: string;
  noSeatbeltFine: string;
  phoneFine: string;
  registrationFine: string;
  uploadFineDocument: string;
  clickToUploadFine: string;
  acceptedFormats: string;
  submitFine: string;
  fineReported: string;
  requestPayout: string;
  submitPayoutRequest: string;
  payoutRequests: string;
  invoice: string;
  uploadInvoice: string;
  payoutAmount: string;
  payoutDescription: string;
  payoutRequestSubmitted: string;
  payoutRequestSuccess: string;
  viewInvoice: string;
  download: string;
  downloadInvoice: string;
  unableToDisplayInvoice: string;
  uploadYourInvoice: string;
  changeFile: string;
  acceptedFormatsMax: string;
  optional: string;
  enterPayoutAmount: string;
  addAdditionalNotes: string;
  submitting: string;
  importantInformation: string;
  ensureInvoiceClear: string;
  acceptedFormatsInfo: string;
  requestReviewedProcessed: string;
  receiveNotification: string;
  yourPayoutRequests: string;
  refresh: string;
  noPayoutRequestsYet: string;
  submitFirstRequest: string;
  invoicePreview: string;
  processed: string;
  adminNote: string;
  loading: string;
  depositRequired: string;
  depositOptional: string;
  
  // Extras
  extras: string;
  carExtras: string;
  createNewExtra: string;
  extraName: string;
  extraDescription: string;
  defaultPrice: string;
  billingUnit: string;
  perBooking: string;
  oneTime: string;
  saveExtra: string;
  availableExtras: string;
  noExtrasYet: string;
  createFirstExtra: string;
  extrasSelected: string;
  priceForThisCar: string;
  includedInBaseRate: string;
  selectExtras: string;
  addExtraDescription: string;
  removeExtra: string;
}

export const translations: Record<Language, LanguageDictionary> = {
  en: {
    allBookings: "All Bookings",
    filterByStatus: "Filter by Status",
    filterByDate: "Filter by Date",
    filterByRating: "Filter by rating",
    statusPending: "Pending",
    statusConfirmed: "Confirmed",
    statusPickedUp: "Picked Up",
    statusReturned: "Returned",
    statusCancelled: "Cancelled",
    totalPrice: "Total Price",
    customer: "Customer",
    car: "Car",
    pickup: "Pickup",
    dropoff: "Dropoff",
    createdAt: "Created At",
    actions: "Actions",
    markAsConfirmed: "Mark as Confirmed",
    markAsPickedUp: "Mark as Picked Up",
    markAsReturned: "Mark as Returned",
    cancelBooking: "Cancel Booking",
    noResults: "No bookings found",
    searchByCustomerOrCar: "Search by customer or car...",
    bookings: "Bookings",
    bookingsSubtitle: "Manage all your car rental reservations",
    manageBookingsDescription: "Manage all your rental bookings",
    view: "View",
    all: "All",
    from: "From",
    to: "To",
    dealerName: "Dealer",
    dates: "Dates",
    status: "Status",
    bookingDetails: "Booking Details",
    close: "Close",
    success: "Success",
    bookingUpdated: "Booking status updated successfully",
    bookingTimeline: "Booking Timeline",

    // Dashboard
    dashboard: "Dashboard",
    welcomeBack: "Welcome back",
    overview: "Overview",
    activeRentals: "Active Rentals",
    totalRevenue: "Total Revenue",
    pendingApprovals: "Pending Approvals",
    recentBookings: "Recent Bookings",
    viewAllBookings: "View All Bookings",
    logout: "Logout",
    loggingOut: "Logging out...",
    signOutAccount: "Sign out of your account",
    account: "Account",
    profile: "Profile",
    settings: "Settings",
    viewOverview: "View overview",
    editProfileSettings: "Edit profile & settings",
    carManagement: "Car Management",
    analytics: "Analytics",
    revenueOverTime: "Revenue Over Time",
    last6Months: "Last 6 months",
    bookingsTrend: "Bookings Trend",
    bookingsByStatus: "Bookings by Status",
    noDataAvailable: "No data available",
    vsLastMonth: "vs last month",
    currentlyActive: "Currently active",
    awaitingConfirmation: "Awaiting confirmation",
    thisMonth: "This month",
    allTime: "All Time",
    allTimeDistribution: "All-time distribution",
    todayBookings: "Today's Activity",
    monthlyBookings: "Monthly Bookings",
    monthlyRevenue: "Monthly Revenue",
    back: "Back",
    quickActions: "Quick Actions",
    goTo: "Go to",
    recentActivity: "Recent Activity",
    topPerformingCars: "Top Performing Cars",
    upcomingBookings: "Upcoming Bookings",
    upcomingPickups: "Upcoming Pickups",
    noUpcomingPickups: "No upcoming pickups",
    fleetStatus: "Fleet Status",
    todaysSchedule: "Today's Schedule",
    revenue: "Revenue",
    fleet: "Fleet",
    activity: "Activity",
    viewAll: "View All",
    addNewCar: "Add New Car",
    addBooking: "Add Booking",
    viewReports: "View Reports",
    manageFleet: "Manage Fleet",
    ago: "ago",
    justNow: "just now",
    minutesAgo: "minutes ago",
    hoursAgo: "hours ago",
    daysAgo: "days ago",
    newBooking: "New Booking",
    bookingConfirmed: "Booking Confirmed",
    carReturned: "Car Returned",
    paymentReceived: "Payment Received",

    // Cars
    cars: "Cars",
    carsSubtitle: "Manage your fleet of vehicles",
    addCar: "Add Car",
    editCar: "Edit Car",
    deleteCar: "Delete Car",
    carDetails: "Car Details",
    brand: "Brand",
    model: "Model",
    year: "Year",
    plateNumber: "Plate Number",
    color: "Color",
    selectColor: "Select a color",
    transmission: "Transmission",
    fuelType: "Fuel Type",
    seats: "Seats",
    dailyRate: "Daily Rate",
    mileage: "Mileage",
    description: "Description",
    features: "Features",
    carName: "Car Name",
    automatic: "Automatic",
    manual: "Manual",
    petrol: "Petrol",
    diesel: "Diesel",
    electric: "Electric",
    hybrid: "Hybrid",
    statusAvailable: "Available",
    statusRented: "Rented",
    statusMaintenance: "Maintenance",
    statusInactive: "Inactive",
    statusActive: "Active",
    statusRetired: "Retired",
    totalCars: "Total Cars",
    availableCars: "Available Cars",
    confirmDelete: "Confirm Delete",
    confirmDeleteMessage:
      "Are you sure you want to delete this car? This action cannot be undone.",
    cancel: "Cancel",
    delete: "Delete",
    save: "Save",
    update: "Update",
    required: "Required",
    searchCars: "Search cars...",
    noCarsFound: "No cars found",
    carAdded: "Car added successfully",
    carUpdated: "Car updated successfully",
    carDeleted: "Car deleted successfully",
    perDay: "per day",
    km: "km",

    // Customers
    customers: "Customers",
    customersSubtitle: "View and manage your customers",
    reviews: "Reviews",
    reviewsSubtitle: "View customer feedback for your cars",
    totalReviews: "Total Reviews",
    averageRating: "Avg Rating",
    fiveStarReviews: "5 Stars",
    oneStarReviews: "1 Star",
    searchReviews: "Search reviews...",
    allRatings: "All Ratings",
    stars: "Stars",
    star: "Star",
    noReviewsFound: "No reviews found",
    tryDifferentFilters: "Try adjusting your filters",
    noReviewsYet: "No reviews have been submitted yet",
    bookingReference: "Booking",
    customerDetails: "Customer Details",
    customerName: "Customer Name",
    email: "Email",
    phone: "Phone",
    address: "Address",
    city: "City",
    country: "Country",
    dateOfBirth: "Date of Birth",
    licenseNumber: "License Number",
    licenseExpiryDate: "License Expiry Date",
    totalBookings: "Total Bookings",
    totalSpent: "Total Spent",
    joinedAt: "Joined",
    lastBookingAt: "Last Booking",
    notes: "Notes",
    searchCustomers: "Search customers...",
    noCustomersFound: "No customers found",
    sortBy: "Sort by",
    sortByName: "Name",
    sortByBookings: "Bookings",
    sortBySpent: "Total Spent",
    sortByJoined: "Joined Date",
    sortByLastBooking: "Last Booking",
    viewDetails: "View Details",
    bookingHistory: "Booking History",
    noBookingsYet: "No bookings yet",
    topCustomers: "Top Customers",
    recentCustomers: "Recent Customers",
    lifetimeValue: "Lifetime Value",

    // Calendar
    calendar: "Calendar",
    calendarSubtitle: "View all pickups and dropoffs",
    today: "Today",
    month: "Month",
    week: "Week",
    day: "Day",
    upcomingDropoffs: "Upcoming Dropoffs",
    noEventsToday: "No events scheduled for today",
    noEventsThisWeek: "No events scheduled this week",
    pickupTime: "Pickup Time",
    dropoffTime: "Dropoff Time",
    location: "Location",
    locations: "Locations",
    pickupLocation: "Pickup Location",
    dropoffLocation: "Dropoff Location",
    pickupLocations: "Pickup Locations",
    dropoffLocations: "Dropoff Locations",
    noPickupLocations: "No pickup locations",
    noDropoffLocations: "No dropoff locations",
    addLocation: "Add Location",
    selectMultipleLocations: "You can select multiple locations",
    addCustomLocation: "Add Custom Location",
    locationName: "Location Name",
    enterLocationName: "Enter location name",
    enterAddress: "Enter address",
    enterCity: "Enter city",
    duration: "Duration",
    days: "days",
    viewCalendar: "View Calendar",
    allEvents: "All Events",
    todaysEvents: "Today's Events",
    thisWeeksEvents: "This Week's Events",
    monthView: "Month View",
    weekView: "Week View",
    dayView: "Day View",
    listView: "List View",
    activeBookings: "Active Bookings",
    scheduledPickups: "Scheduled Pickups",
    scheduledDropoffs: "Scheduled Dropoffs",
    timeline: "Timeline",
    morning: "Morning",
    afternoon: "Afternoon",
    evening: "Evening",
    noEventsScheduled: "No events scheduled",
    bookingSchedule: "Booking Schedule",
    viewBooking: "View Booking",

    // Profile
    myProfile: "My Profile",
    ownerPortal: "Owner Portal",
    profileSettings: "Profile Settings",
    editProfile: "Edit Profile",
    saveProfile: "Save Profile",
    cancelEdit: "Cancel",
    agencyName: "Agency Name",
    agencyDescription: "Description",
    contactInformation: "Contact Information",
    businessInformation: "Business Information",
    postalCode: "Postal Code",
    website: "Website",
    taxId: "Tax ID",
    profileUpdated: "Profile updated successfully",
    profileUpdateFailed: "Failed to update profile",
    requiredField: "This field is required",
    agencyDetails: "Agency Details",
    contactDetails: "Contact Details",
    locationDetails: "Location Details",
    additionalInfo: "Additional Information",
    uploadLogo: "Upload Logo",
    changeLogo: "Change Logo",
    removeLogo: "Remove Logo",
    logoUploadInfo: "PNG, JPG or WEBP (max. 2MB)",
    dragDropLogo: "Drag and drop your logo here",
    orClickToUpload: "or click to upload",
    logoPreview: "Logo Preview",
    // Company Data Prompt
    companyDataRequiredTitle: "Complete Your Company Information",
    companyDataRequiredMessage: "Please add your company name, email, and phone number to continue using the dashboard.",
    updateCompanyInfo: "Update Company Info",
    noCompanyTitle: "⚠️ Complete Your Profile First",
    noCompanyMessage: "You need to complete your company information before you can add cars, locations, or manage bookings.",
    completeProfileToStart: "Please fill out your profile to start using the platform.",
    goToProfile: "Go to Profile",
    active: "Active",
    found: "found",
    statusPickedup: "Picked Up",
    customerInformation: "Customer Information",
    carInformation: "Car Information",
    pickupDate: "Pickup Date",
    returnDate: "Return Date",
    fullName: "Full Name",
    contactPerson: "Contact Person",
    subject: "Subject",
    message: "Message",
    sendMessage: "Send Message",
    sending: "Sending...",
    messageSent: "Message sent successfully!",
    subjectPlaceholder: "Enter message subject...",
    messagePlaceholder: "Enter your message...",
    make: "Make",
    licensePlate: "License Plate",
    fileClaim: "File Damage Claim",
    fileDamageClaim: "File Damage Claim",
    damageDescription: "Damage Description",
    damageType: "Damage Type",
    estimatedCost: "Estimated Repair Cost",
    notifyInsurance: "Notify insurance company about this claim",
    uploadPhotos: "Upload Photos",
    clickToUploadPhotos: "Click to upload photos of the damage",
    photoSelected: "photo(s) selected",
    selectDamageType: "Select damage type",
    scratch: "Scratch",
    dent: "Dent",
    broken: "Broken Part",
    stain: "Stain",
    other: "Other",
    describeDamage: "Describe the damage in detail...",
    estimatedRepairCost: "Estimated Repair Cost",
    submitClaim: "Submit Claim",
    claimWarning:
      "Please provide detailed information about the damage to file a claim. This will be recorded and can be used for insurance purposes.",
    claimFiled: "Claim filed successfully!",
    carImage: "Car Image",
    basicInfo: "Basic Info",
    details: "Details",
    addNewCarToFleet: "Add New Car to Fleet",
    updateCarDetails: "Update Car Details",
    uploadCarImage: "Upload Car Image",
    uploadCarImageDescription: "Upload Car Image Description",
    addMorePhotos: "Add More Photos",
    addAnotherPhoto: "Add Another Photo",
    clickToUpload: "Click to upload",
    orDragAndDrop: "or drag and drop",
    autoCompressed: "Auto Compressed",
    basicInformation: "Basic Information",
    provideBasicCarDetails: "Provide Basic Car Details",
    additionalDetails: "Additional Details",
    provideMoreDetails: "Provide More Details",
    add: "Add",
    next: "Next",
    previous: "Previous",
    completeAllSteps: "Complete all steps",
    vin: "VIN",
    saving: "Saving...",
    saveChanges: "Save Changes",
    addYourFirstCar: "Add your first car to get started",
    edit: "Edit",

    // Quick Start Guide
    quickStartTitle: "Quick Start Guide",
    quickStartSubtitle: "steps completed",
    quickStartProfileTitle: "Complete Your Profile",
    quickStartProfileDesc: "Add your company details to get started",
    quickStartLocationsTitle: "Add Pickup Locations",
    quickStartLocationsDesc: "Set up where customers can get your cars",
    quickStartCarsTitle: "Add Your First Vehicle",
    quickStartCarsDesc: "List your cars to start receiving bookings",
    quickStartComplete: "🎉 All Set!",
    quickStartCompleteMsg: "Your profile is ready. You can now start receiving bookings!",
    completeNow: "Complete Now",
    addLocations: "Add Locations",
    manage: "Manage",
    viewFleet: "View Fleet",
    dismiss: "Dismiss",
    image: "Photo",
    specifications: "Specs",
    pricing: "Pricing",
    surname: "Surname",
    nationality: "Nationality",
    age: "Age",
    years: "years",
    downloadLicense: "Download License",
    addNotes: "Add Notes",
    clickToAddNotes: "Click to add notes about this customer...",
    reportFine: "Report Fine",
    fineDetails: "Fine Details",
    fineType: "Fine Type",
    finePrice: "Fine Amount",
    fineWarning:
      "Please provide detailed information about the fine received during the rental period. Upload the fine document and provide all necessary details.",
    describeFine:
      "Describe the fine in detail (location, date, violation type, etc.)...",
    selectFineType: "Select fine type",
    speedingFine: "Speeding",
    parkingFine: "Parking Violation",
    redLightFine: "Red Light Violation",
    noSeatbeltFine: "No Seatbelt",
    phoneFine: "Phone Usage While Driving",
    registrationFine: "Registration/Insurance Issue",
    uploadFineDocument: "Upload Fine Document",
    clickToUploadFine: "Click to upload fine document/photos",
    acceptedFormats: "Accepted: JPG, PNG, PDF (MAX. 10MB each)",
    submitFine: "Submit Fine Report",
    fineReported: "Fine reported successfully!",
    requestPayout: "Request Payout",
    submitPayoutRequest: "Submit payout request",
    payoutRequests: "Payout Requests",
    invoice: "Invoice",
    uploadInvoice: "Upload Invoice",
    payoutAmount: "Amount",
    payoutDescription: "Description",
    payoutRequestSubmitted: "Payout request submitted successfully!",
    payoutRequestSuccess:
      "Your request is being reviewed. You will be notified once it's processed.",
    viewInvoice: "View Invoice",
    download: "Download",
    downloadInvoice: "Download Invoice",
    unableToDisplayInvoice: "Unable to display invoice image.",
    uploadYourInvoice: "Upload your invoice to request a payout",
    changeFile: "Change file",
    acceptedFormatsMax: "PDF, JPG, or PNG (MAX. 10MB)",
    optional: "(Optional)",
    enterPayoutAmount: "Enter the payout amount if specified in your invoice",
    addAdditionalNotes:
      "Add any additional notes or details about this payout request...",
    submitting: "Submitting...",
    importantInformation: "Important Information",
    ensureInvoiceClear: "Please ensure your invoice is clear and readable",
    acceptedFormatsInfo: "Accepted formats: PDF, JPG, PNG (max 10MB)",
    requestReviewedProcessed:
      "Your request will be reviewed and processed within 3-5 business days",
    receiveNotification:
      "You will receive a notification once your payout is processed",
    yourPayoutRequests: "Your Payout Requests",
    refresh: "Refresh",
    noPayoutRequestsYet: "No payout requests yet",
    submitFirstRequest:
      "Submit your first payout request above to get started.",
    invoicePreview: "Invoice preview",
    processed: "Processed",
    adminNote: "Admin Note",
    loading: "Loading...",
    depositRequired: "Deposit Required",
    depositOptional: "Optional: Amount required as deposit for this car",
    
    // Extras
    extras: "Extras",
    carExtras: "Car Extras",
    createNewExtra: "Create New Extra",
    extraName: "Extra Name",
    extraDescription: "Description",
    defaultPrice: "Default Price",
    billingUnit: "Billing Unit",
    perBooking: "Per Booking",
    oneTime: "One Time",
    saveExtra: "Save Extra",
    availableExtras: "Available Extras",
    noExtrasYet: "No extras available yet",
    createFirstExtra: "Create your first extra using the button above",
    extrasSelected: "extra(s) selected for this car",
    priceForThisCar: "Price for this car",
    includedInBaseRate: "Included in base rate",
    selectExtras: "Select optional extras that customers can add to their booking for additional charges",
    addExtraDescription: "Add a new extra that can be offered with this and other vehicles",
    removeExtra: "Remove",
  },
  al: {
    allBookings: "Të gjitha rezervimet",
    filterByStatus: "Filtro sipas gjendjes",
    filterByDate: "Filtro sipas datës",
    filterByRating: "Filtro sipas vlerësimit",
    statusPending: "Në pritje",
    statusConfirmed: "E konfirmuar",
    statusPickedUp: "E marrë",
    statusReturned: "E kthyer",
    statusCancelled: "E anuluar",
    totalPrice: "Çmimi gjithsej",
    customer: "Klient",
    car: "Makina",
    pickup: "Marrja",
    dropoff: "Dorëzimi",
    createdAt: "Krijuar më",
    actions: "Veprime",
    markAsConfirmed: "Konfirmo rezervimin",
    markAsPickedUp: "Shëno si e marrë",
    markAsReturned: "Shëno si e kthyer",
    cancelBooking: "Anulo rezervimin",
    noResults: "Nuk u gjet asnjë rezervim",
    searchByCustomerOrCar: "Kërko sipas klientit ose makinës...",
    bookings: "Rezervime",
    bookingsSubtitle: "Menaxho të gjitha rezervimet",
    manageBookingsDescription: "Kontrollo dhe përditëso rezervimet",
    view: "Shiko",
    all: "Të gjitha",
    from: "Nga",
    to: "Deri",
    dealerName: "Agjencia",
    dates: "Datat",
    status: "Gjendja",
    bookingDetails: "Detajet e rezervimit",
    close: "Mbyll",
    success: "U krye",
    bookingUpdated: "Rezervimi u përditësua me sukses",
    bookingTimeline: "Ecuria e rezervimit",

    // Dashboard
    dashboard: "Paneli kryesor",
    welcomeBack: "Mirë se u riktheve",
    overview: "Përmbledhje",
    activeRentals: "Qira aktive",
    totalRevenue: "Të ardhura gjithsej",
    pendingApprovals: "Në pritje konfirmimi",
    recentBookings: "Rezervimet e fundit",
    viewAllBookings: "Shiko të gjitha rezervimet",
    logout: "Dil",
    loggingOut: "Duke dalë...",
    signOutAccount: "Dil nga llogaria",
    account: "Llogaria",
    profile: "Profili",
    settings: "Cilësimet",
    viewOverview: "Shiko përmbledhjen",
    editProfileSettings: "Ndrysho profilin dhe cilësimet",
    carManagement: "Menaxhimi i makinave",
    analytics: "Statistika",
    revenueOverTime: "Të ardhurat me kohën",
    last6Months: "6 muajt e fundit",
    bookingsTrend: "Ecuria e rezervimeve",
    bookingsByStatus: "Rezervime sipas gjendjes",
    noDataAvailable: "Nuk ka të dhëna",
    vsLastMonth: "krahasuar me muajin e kaluar",
    currentlyActive: "Aktive tani",
    awaitingConfirmation: "Në pritje",
    thisMonth: "Këtë muaj",
    allTime: "Gjithë kohës",
    allTimeDistribution: "Shpërndarje e përgjithshme",
    todayBookings: "Sot",
    monthlyBookings: "Rezervime mujore",
    monthlyRevenue: "Të ardhura mujore",
    back: "Kthehu",
    quickActions: "Veprime të shpejta",
    goTo: "Shko te",
    recentActivity: "Aktiviteti i fundit",
    topPerformingCars: "Makinat më të përdorura",
    upcomingBookings: "Rezervime në vazhdim",
    upcomingPickups: "Marrje të afërta",
    noUpcomingPickups: "Nuk ka marrje të planifikuara",
    noBookingsYet: "Ende pa rezervime",
    fleetStatus: "Gjendja e flotës",
    todaysSchedule: "Orari i sotëm",
    revenue: "Të ardhura",
    fleet: "Flota",
    activity: "Aktivitet",
    viewAll: "Shiko të gjitha",
    addNewCar: "Shto makinë",
    addBooking: "Shto rezervim",
    viewReports: "Shiko raportet",
    manageFleet: "Menaxho flotën",
    ago: "më parë",
    justNow: "tani",
    minutesAgo: "minuta më parë",
    hoursAgo: "orë më parë",
    daysAgo: "ditë më parë",
    newBooking: "Rezervim i ri",
    bookingConfirmed: "Rezervimi u konfirmua",
    carReturned: "Makina u kthye",
    paymentReceived: "Pagesa u mor",

    // Cars
    cars: "Makina",
    carsSubtitle: "Lista e makinave",
    addCar: "Shto makinë",
    editCar: "Ndrysho makinën",
    deleteCar: "Fshi makinën",
    carDetails: "Detajet e makinës",
    brand: "Marka",
    model: "Modeli",
    year: "Viti",
    plateNumber: "Targa",
    color: "Ngjyra",
    selectColor: "Zgjidh ngjyrën",
    transmission: "Kambio",
    fuelType: "Karburanti",
    seats: "Vendet",
    dailyRate: "Çmimi në ditë",
    mileage: "Kilometra",
    description: "Përshkrimi",
    features: "Veçori",
    carName: "Emri i makinës",
    automatic: "Automatike",
    manual: "Manuale",
    petrol: "Benzinë",
    diesel: "Naftë",
    electric: "Elektrike",
    hybrid: "Hibride",
    statusAvailable: "E lirë",
    statusRented: "Me qira",
    statusMaintenance: "Në servis",
    statusInactive: "Jo aktive",
    statusActive: "Aktive",
    statusRetired: "Jashtë përdorimit",
    totalCars: "Gjithsej makina",
    availableCars: "Makina të lira",
    confirmDelete: "Konfirmo fshirjen",
    confirmDeleteMessage: "Je i sigurt që dëshiron ta fshish këtë makinë?",
    cancel: "Anulo",
    delete: "Fshi",
    save: "Ruaj",
    update: "Përditëso",
    required: "E detyrueshme",
    searchCars: "Kërko makina...",
    noCarsFound: "Nuk u gjet asnjë makinë",
    carAdded: "Makina u shtua",
    carUpdated: "Makina u përditësua",
    carDeleted: "Makina u fshi",
    perDay: "në ditë",
    km: "km",

    // Customers
    customers: "Klientët",
    customersSubtitle: "Shiko dhe menaxho klientët e tu",
    reviews: "Vlerësimet",
    reviewsSubtitle: "Shiko komentet e klientëve për makinat tuaja",
    totalReviews: "Vlerësimet Totale",
    averageRating: "Vlerësimi Mesatar",
    fiveStarReviews: "5 Yjet",
    oneStarReviews: "1 Yll",
    searchReviews: "Kërko vlerësime...",
    allRatings: "Të Gjitha Vlerësimet",
    stars: "Yjet",
    star: "Yll",
    noReviewsFound: "Nuk u gjetën vlerësime",
    tryDifferentFilters: "Provo filtra të ndryshëm",
    noReviewsYet: "Nuk ka vlerësime të dërguara ende",
    bookingReference: "Rezervimi",
    customerDetails: "Detajet e klientit",
    customerName: "Emri i klientit",
    email: "Email",
    phone: "Telefoni",
    address: "Adresa",
    city: "Qyteti",
    country: "Vendi",
    dateOfBirth: "Data e lindjes",
    licenseNumber: "Numri i patentës",
    licenseExpiryDate: "Skadenca e patentës",
    totalBookings: "Rezervimet totale",
    totalSpent: "Shpenzuar gjithsej",
    joinedAt: "Anëtarësuar",
    lastBookingAt: "Rezervimi i fundit",
    notes: "Shënime",
    searchCustomers: "Kërko klientë...",
    noCustomersFound: "Nuk u gjetën klientë",
    sortBy: "Rendit sipas",
    sortByName: "Emri",
    sortByBookings: "Rezervimet",
    sortBySpent: "Shpenzuar",
    sortByJoined: "Data e anëtarësimit",
    sortByLastBooking: "Rezervimi i fundit",
    viewDetails: "Shiko detajet",
    bookingHistory: "Historia e rezervimeve",
    topCustomers: "Klientët kryesorë",
    recentCustomers: "Klientët e fundit",
    lifetimeValue: "Vlera totale",

    // Calendar
    calendar: "Kalendari",
    calendarSubtitle: "Shiko të gjitha marrjet dhe dorëzimet",
    today: "Sot",
    month: "Muaji",
    week: "Java",
    day: "Dita",
    upcomingDropoffs: "Dorëzimet e ardhshme",
    noEventsToday: "Nuk ka ngjarje të planifikuara për sot",
    noEventsThisWeek: "Nuk ka ngjarje të planifikuara këtë javë",
    pickupTime: "Ora e marrjes",
    dropoffTime: "Ora e dorëzimit",
    location: "Vendndodhja",
    locations: "Vendndodhjet",
    pickupLocation: "Vendndodhja e marrjes",
    dropoffLocation: "Vendndodhja e dorëzimit",
    pickupLocations: "Vendndodhjet e marrjes",
    dropoffLocations: "Vendndodhjet e dorëzimit",
    noPickupLocations: "Nuk ka vendndodhje marrjeje",
    noDropoffLocations: "Nuk ka vendndodhje dorëzimi",
    addLocation: "Shto Vendndodhje",
    selectMultipleLocations: "Mund të zgjidhni disa vendndodhje",
    addCustomLocation: "Shto Vendndodhje të Re",
    locationName: "Emri i Vendndodhjes",
    enterLocationName: "Shkruani emrin e vendndodhjes",
    enterAddress: "Shkruani adresën",
    enterCity: "Shkruani qytetin",
    duration: "Kohëzgjatja",
    days: "ditë",
    viewCalendar: "Shiko kalendarin",
    allEvents: "Të gjitha ngjarjet",
    todaysEvents: "Ngjarjet e sotme",
    thisWeeksEvents: "Ngjarjet e kësaj jave",
    monthView: "Pamja mujore",
    weekView: "Pamja javore",
    dayView: "Pamja ditore",
    listView: "Pamja listë",
    activeBookings: "Rezervimet aktive",
    scheduledPickups: "Marrjet e planifikuara",
    scheduledDropoffs: "Dorëzimet e planifikuara",
    timeline: "Afati kohor",
    morning: "Mëngjes",
    afternoon: "Pasdite",
    evening: "Mbrëmje",
    noEventsScheduled: "Nuk ka ngjarje të planifikuara",
    bookingSchedule: "Orari i rezervimeve",
    viewBooking: "Shiko rezervimin",

    // Profile
    myProfile: "Profili im",
    ownerPortal: "Portali i Pronarit",
    profileSettings: "Cilësimet e profilit",
    editProfile: "Ndrysho profilin",
    saveProfile: "Ruaj profilin",
    cancelEdit: "Anulo",
    agencyName: "Emri i agjencisë",
    agencyDescription: "Përshkrimi",
    contactInformation: "Informacioni i kontaktit",
    businessInformation: "Informacioni i biznesit",
    postalCode: "Kodi postar",
    website: "Faqja web",
    taxId: "Numri i tatimit",
    profileUpdated: "Profili u përditësua me sukses",
    profileUpdateFailed: "Dështoi përditësimi i profilit",
    requiredField: "Kjo fushë është e detyrueshme",
    agencyDetails: "Detajet e agjencisë",
    contactDetails: "Detajet e kontaktit",
    locationDetails: "Detajet e vendndodhjes",
    additionalInfo: "Informacion shtesë",
    uploadLogo: "Ngarko logon",
    changeLogo: "Ndrysho logon",
    removeLogo: "Fshi logon",
    logoUploadInfo: "PNG, JPG ose WEBP (maks. 2MB)",
    dragDropLogo: "Zvarrit dhe lësho logon këtu",
    orClickToUpload: "ose kliko për të ngarkuar",
    logoPreview: "Pamja e logos",
    // Company Data Prompt
    companyDataRequiredTitle: "Plotësoni Informacionin e Kompanisë",
    companyDataRequiredMessage: "Ju lutemi shtoni emrin e kompanisë, email dhe numrin e telefonit për të vazhduar përdorimin e panelit.",
    updateCompanyInfo: "Përditëso Informacionin e Kompanisë",
    noCompanyTitle: "⚠️ Plotëso Profilin Tënd Fillimisht",
    noCompanyMessage: "Duhet të plotësosh informacionin e kompanisë para se të shtosh makina, lokacione ose të menaxhosh rezervimet.",
    completeProfileToStart: "Të lutemi plotëso profilin tënd për të filluar përdorimin e platformës.",
    goToProfile: "Shko te Profili",
    active: "Aktiv",
    found: "u gjetën",
    statusPickedup: "Marrë",
    customerInformation: "Informacioni i Klientit",
    carInformation: "Informacioni i Mjetit",
    pickupDate: "Data e Marrjes",
    returnDate: "Data e Kthimit",
    fullName: "Emri i Plotë",
    contactPerson: "Kontakto Personin",
    subject: "Subjekti",
    message: "Mesazhi",
    sendMessage: "Dërgo Mesazhin",
    sending: "Duke dërguar...",
    messageSent: "Mesazhi u dërgua me sukses!",
    subjectPlaceholder: "Shkruani subjektin e mesazhit...",
    messagePlaceholder: "Shkruani mesazhin tuaj...",
    make: "Marka",
    licensePlate: "Targat",
    fileClaim: "Paraqit Kërkesë për Dëmtim",
    fileDamageClaim: "Paraqit Kërkesë për Dëmtim",
    damageDescription: "Përshkrimi i Dëmtimit",
    damageType: "Lloji i Dëmtimit",
    estimatedCost: "Kostoja e Vlerësuar e Riparimit",
    notifyInsurance: "Njofto kompaninë e sigurimit për këtë kërkesë",
    uploadPhotos: "Ngarko Foto",
    clickToUploadPhotos: "Kliko për të ngarkuar foto të dëmtimit",
    photoSelected: "foto të zgjedhura",
    selectDamageType: "Zgjidh llojin e dëmtimit",
    scratch: "Gërvishtje",
    dent: "Gropë",
    broken: "Pjesë e Thyer",
    stain: "Njollë",
    other: "Tjetër",
    describeDamage: "Përshkruani dëmtimin në detaje...",
    estimatedRepairCost: "Kostoja e Vlerësuar e Riparimit",
    submitClaim: "Paraqit Kërkesën",
    claimWarning:
      "Ju lutemi jepni informacion të detajuar për dëmtimin për të paraqitur një kërkesë. Kjo do të regjistrohet dhe mund të përdoret për qëllime sigurimi.",
    claimFiled: "Kërkesa u paraqit me sukses!",
    carImage: "Imazhi i Mjetit",
    basicInfo: "Info Bazë",
    details: "Detajet",
    addNewCarToFleet: "Shto një mjet të ri në flotën tuaj",
    updateCarDetails: "Përditëso detajet e mjetit",
    uploadCarImage: "Ngarko Imazhin e Mjetit",
    uploadCarImageDescription:
      "Një imazh i qartë ndihmon për të tërhequr më shumë klientë",
    addMorePhotos: "Shto Më Shumë Foto",
    addAnotherPhoto: "Shto Një Foto Tjetër",
    clickToUpload: "Kliko për të ngarkuar",
    orDragAndDrop: "ose tërhiq dhe lësho",
    autoCompressed: "Ngarko foto të shumta - e para do të jetë kryesore",
    basicInformation: "Informacioni Bazë",
    provideBasicCarDetails: "Jepni detaje thelbësore për mjetin",
    additionalDetails: "Detaje Shtesë",
    provideMoreDetails: "Specifikimet dhe karakteristikat",
    add: "Shto",
    next: "Tjetra",
    previous: "Kthehu",
    completeAllSteps: "Plotëso të gjitha hapat",
    vin: "VIN",
    saving: "Duke ruajtur...",
    saveChanges: "Ruaj Ndryshimet",
    addYourFirstCar: "Shto mjetin tënd të parë për të filluar",
    edit: "Redakto",

    // Quick Start Guide
    quickStartTitle: "Udhëzues i Shpejtë",
    quickStartSubtitle: "hapa të plotësuar",
    quickStartProfileTitle: "Plotëso Profilin",
    quickStartProfileDesc: "Shto detajet e kompanisë për të filluar",
    quickStartLocationsTitle: "Shto Vendndodhje Marrjeje",
    quickStartLocationsDesc: "Cakto ku klientët mund të marrin makinat",
    quickStartCarsTitle: "Shto Mjetin e Parë",
    quickStartCarsDesc: "Shto makinat për të filluar rezervimet",
    quickStartComplete: "🎉 Gati!",
    quickStartCompleteMsg: "Profili juaj është gati. Mund të filloni të merrni rezervime!",
    completeNow: "Plotëso Tani",
    addLocations: "Shto Vendndodhje",
    manage: "Menaxho",
    viewFleet: "Shiko Flotën",
    dismiss: "Mbyll",
    image: "Foto",
    specifications: "Specifikimet",
    pricing: "Çmimi",
    surname: "Mbiemri",
    nationality: "Shtetësia",
    age: "Mosha",
    years: "vjeç",
    downloadLicense: "Shkarko Patentën",
    addNotes: "Shto Shënime",
    clickToAddNotes: "Kliko për të shtuar shënime për këtë klient...",
    reportFine: "Raporto Gjobë",
    fineDetails: "Detajet e Gjobës",
    fineType: "Lloji i Gjobës",
    finePrice: "Shuma e Gjobës",
    fineWarning:
      "Ju lutemi jepni informacion të detajuar për gjobën e marrë gjatë periudhës së qirasë. Ngarkoni dokumentin e gjobës dhe jepni të gjitha detajet e nevojshme.",
    describeFine:
      "Përshkruani gjobën në detaje (vendndodhja, data, lloji i shkeljes, etj.)...",
    selectFineType: "Zgjidhni llojin e gjobës",
    speedingFine: "Shpejtësi e tepërt",
    parkingFine: "Shkelje Parkimi",
    redLightFine: "Shkelje Dritë e Kuqe",
    noSeatbeltFine: "Pa Rrip Sigurimi",
    phoneFine: "Përdorim Telefoni Gjatë Drejtimit",
    registrationFine: "Problem Regjistrimi/Sigurimi",
    uploadFineDocument: "Ngarko Dokumentin e Gjobës",
    clickToUploadFine: "Kliko për të ngarkuar dokumentin/fotot e gjobës",
    acceptedFormats: "Të pranuara: JPG, PNG, PDF (MAKS. 10MB secili)",
    submitFine: "Paraqit Raportin e Gjobës",
    fineReported: "Gjoba u raportua me sukses!",
    requestPayout: "Kërko Pagesë",
    submitPayoutRequest: "Paraqit kërkesë për pagesë",
    payoutRequests: "Kërkesat për Pagesë",
    invoice: "Fatura",
    uploadInvoice: "Ngarko Faturë",
    payoutAmount: "Shuma",
    payoutDescription: "Përshkrimi",
    payoutRequestSubmitted: "Kërkesa për pagesë u paraqit me sukses!",
    payoutRequestSuccess:
      "Kërkesa juaj po shqyrohet. Do të njoftoheni pasi të përpunohet.",
    viewInvoice: "Shiko Faturën",
    download: "Shkarko",
    downloadInvoice: "Shkarko Faturën",
    unableToDisplayInvoice: "Nuk mund të shfaqet imazhi i faturës.",
    uploadYourInvoice: "Ngarko faturën tënde për të kërkuar pagesë",
    changeFile: "Ndrysho skedarin",
    acceptedFormatsMax: "PDF, JPG, ose PNG (MAKS. 10MB)",
    optional: "(Opsionale)",
    enterPayoutAmount:
      "Shkruaj shumën e pagesës nëse është e specifikuar në faturën tënde",
    addAdditionalNotes:
      "Shto shënime ose detaje shtesë për këtë kërkesë pagese...",
    submitting: "Duke dërguar...",
    importantInformation: "Informacion i Rëndësishëm",
    ensureInvoiceClear:
      "Ju lutemi sigurohuni që fatura juaj është e qartë dhe e lexueshme",
    acceptedFormatsInfo: "Formatet e pranuara: PDF, JPG, PNG (maks 10MB)",
    requestReviewedProcessed:
      "Kërkesa juaj do të shqyrohet dhe përpunohet brenda 3-5 ditëve të punës",
    receiveNotification:
      "Do të merrni një njoftim pasi pagesa juaj të përpunohet",
    yourPayoutRequests: "Kërkesat e Tua për Pagesë",
    refresh: "Rifresko",
    noPayoutRequestsYet: "Nuk ka kërkesa pagese ende",
    submitFirstRequest:
      "Paraqit kërkesën tënde të parë për pagesë më sipër për të filluar.",
    invoicePreview: "Parapamje fature",
    processed: "E përpunuar",
    adminNote: "Shënim Admini",
    loading: "Duke ngarkuar...",
    depositRequired: "Depozita e Kërkuar",
    depositOptional: "Opsionale: Shuma e kërkuar si depozitë për këtë mjet",
    
    // Extras
    extras: "Shërbimet Shtesë",
    carExtras: "Shërbimet Shtesë të Makinës",
    createNewExtra: "Krijo Shërbim të Ri",
    extraName: "Emri i Shërbimit",
    extraDescription: "Përshkrimi",
    defaultPrice: "Çmimi Bazë",
    billingUnit: "Njësia e Faturimit",
    perBooking: "Për Rezervim",
    oneTime: "Një Herë",
    saveExtra: "Ruaj Shërbimin",
    availableExtras: "Shërbimet e Disponueshme",
    noExtrasYet: "Nuk ka shërbime shtesë akoma",
    createFirstExtra: "Krijo shërbimin tënd të parë duke përdorur butonin më sipër",
    extrasSelected: "shërbim(e) shtesë të zgjedhura për këtë makinë",
    priceForThisCar: "Çmimi për këtë makinë",
    includedInBaseRate: "E përfshirë në çmimin bazë",
    selectExtras: "Zgjidhni shërbimet shtesë opsionale që klientët mund të shtojnë në rezervimin e tyre për tarifë shtesë",
    addExtraDescription: "Shto një shërbim të ri që mund të ofrohet me këtë dhe mjete të tjera",
    removeExtra: "Hiq",
  },
};
