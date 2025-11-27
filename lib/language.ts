/**
 * Language Dictionary and Context
 * 
 * Provides English and Albanian translations for the owner portal.
 * This will be used across dashboard, bookings, and other screens.
 */

export type Language = 'en' | 'al'

export interface LanguageDictionary {
  // Common
  allBookings: string
  filterByStatus: string
  filterByDate: string
  statusPending: string
  statusConfirmed: string
  statusPickedUp: string
  statusReturned: string
  statusCancelled: string
  totalPrice: string
  customer: string
  car: string
  pickup: string
  dropoff: string
  createdAt: string
  actions: string
  markAsConfirmed: string
  markAsPickedUp: string
  markAsReturned: string
  cancelBooking: string
  noResults: string
  searchByCustomerOrCar: string
  bookings: string
  bookingsSubtitle: string
  view: string
  all: string
  from: string
  to: string
  dealerName: string
  dates: string
  status: string
  bookingDetails: string
  close: string
  success: string
  bookingUpdated: string
  
  // Dashboard
  dashboard: string
  welcomeBack: string
  overview: string
  totalBookings: string
  activeRentals: string
  totalRevenue: string
  pendingApprovals: string
  recentBookings: string
  viewAllBookings: string
  logout: string
  profile: string
  settings: string
  carManagement: string
  analytics: string
  vsLastMonth: string
  currentlyActive: string
  awaitingConfirmation: string
  thisMonth: string
  back: string
  quickActions: string
  recentActivity: string
  topPerformingCars: strin
  
  upcomingBookings: string
  fleetStatus: string
  todaysSchedule: string
  revenue: string
  fleet: string
  activity: string
  viewAll: string
  addNewCar: string
  addBooking: string
  viewReports: string
  manageFleet: string
  ago: string
  justNow: string
  minutesAgo: string
  hoursAgo: string
  daysAgo: string
  newBooking: string
  bookingConfirmed: string
  carReturned: string
  paymentReceived: string
  
  // Cars
  cars: string
  carsSubtitle: string
  addCar: string
  editCar: string
  deleteCar: string
  carDetails: string
  brand: string
  model: string
  year: string
  plateNumber: string
  color: string
  selectColor: string
  transmission: string
  fuelType: string
  seats: string
  dailyRate: string
  mileage: string
  description: string
  features: string
  carName: string
  automatic: string
  manual: string
  petrol: string
  diesel: string
  electric: string
  hybrid: string
  statusAvailable: string
  statusRented: string
  statusMaintenance: string
  statusInactive: string
  totalCars: string
  availableCars: string
  confirmDelete: string
  confirmDeleteMessage: string
  cancel: string
  delete: string
  save: string
  update: string
  required: string
  searchCars: string
  noCarsFound: string
  carAdded: string
  carUpdated: string
  carDeleted: string
  perDay: string
  km: string
  
  // Customers
  customers: string
  customersSubtitle: string
  customerDetails: string
  customerName: string
  email: string
  phone: string
  address: string
  city: string
  country: string
  dateOfBirth: string
  licenseNumber: string
  licenseExpiryDate: string
  totalBookings: string
  totalSpent: string
  joinedAt: string
  lastBookingAt: string
  notes: string
  searchCustomers: string
  noCustomersFound: string
  sortBy: string
  sortByName: string
  sortByBookings: string
  sortBySpent: string
  sortByJoined: string
  sortByLastBooking: string
  viewDetails: string
  bookingHistory: string
  noBookingsYet: string
  topCustomers: string
  recentCustomers: string
  lifetimeValue: string
  
  // Calendar
  calendar: string
  calendarSubtitle: string
  today: string
  month: string
  week: string
  day: string
  upcomingPickups: string
  upcomingDropoffs: string
  noEventsToday: string
  noEventsThisWeek: string
  pickupTime: string
  dropoffTime: string
  location: string
  pickupLocation: string
  dropoffLocation: string
  duration: string
  days: string
  viewCalendar: string
  allEvents: string
  todaysEvents: string
  thisWeeksEvents: string
  monthView: string
  weekView: string
  dayView: string
  listView: string
  activeBookings: string
  scheduledPickups: string
  scheduledDropoffs: string
  timeline: string
  morning: string
  afternoon: string
  evening: string
  noEventsScheduled: string
  bookingSchedule: string
  viewBooking: string

  // Profile
  myProfile: string
  profileSettings: string
  editProfile: string
  saveProfile: string
  cancelEdit: string
  agencyName: string
  agencyDescription: string
  contactInformation: string
  businessInformation: string
  phone: string
  email: string
  address: string
  city: string
  country: string
  postalCode: string
  website: string
  taxId: string
  profileUpdated: string
  profileUpdateFailed: string
  requiredField: string
  agencyDetails: string
  contactDetails: string
  locationDetails: string
  additionalInfo: string
  uploadLogo: string
  changeLogo: string
  removeLogo: string
  logoUploadInfo: string
  dragDropLogo: string
  orClickToUpload: string
  logoPreview: string
  active: string
  found: string
  statusPickedup: string
}

export const translations: Record<Language, LanguageDictionary> = {
  en: {
    allBookings: 'All Bookings',
    filterByStatus: 'Filter by Status',
    filterByDate: 'Filter by Date',
    statusPending: 'Pending',
    statusConfirmed: 'Confirmed',
    statusPickedUp: 'Picked Up',
    statusReturned: 'Returned',
    statusCancelled: 'Cancelled',
    totalPrice: 'Total Price',
    customer: 'Customer',
    car: 'Car',
    pickup: 'Pickup',
    dropoff: 'Dropoff',
    createdAt: 'Created At',
    actions: 'Actions',
    markAsConfirmed: 'Mark as Confirmed',
    markAsPickedUp: 'Mark as Picked Up',
    markAsReturned: 'Mark as Returned',
    cancelBooking: 'Cancel Booking',
    noResults: 'No bookings found',
    searchByCustomerOrCar: 'Search by customer or car...',
    bookings: 'Bookings',
    bookingsSubtitle: 'Manage all your car rental reservations',
    view: 'View',
    all: 'All',
    from: 'From',
    to: 'To',
    dealerName: 'Dealer',
    dates: 'Dates',
    status: 'Status',
    bookingDetails: 'Booking Details',
    close: 'Close',
    success: 'Success',
    bookingUpdated: 'Booking status updated successfully',
    
    // Dashboard
    dashboard: 'Dashboard',
    welcomeBack: 'Welcome back',
    overview: 'Overview',
    totalBookings: 'Total Bookings',
    activeRentals: 'Active Rentals',
    totalRevenue: 'Total Revenue',
    pendingApprovals: 'Pending Approvals',
    recentBookings: 'Recent Bookings',
    viewAllBookings: 'View All Bookings',
    logout: 'Logout',
    profile: 'Profile',
    settings: 'Settings',
    carManagement: 'Car Management',
    analytics: 'Analytics',
    vsLastMonth: 'vs last month',
    currentlyActive: 'Currently active',
  awaitingConfirmation: 'Awaiting confirmation',
  thisMonth: 'This month',
  back: 'Back',
  quickActions: 'Quick Actions',
    
    // Cars
    cars: 'Cars',
    carsSubtitle: 'Manage your fleet of vehicles',
    addCar: 'Add Car',
    editCar: 'Edit Car',
    deleteCar: 'Delete Car',
    carDetails: 'Car Details',
    brand: 'Brand',
    model: 'Model',
    year: 'Year',
    plateNumber: 'Plate Number',
    color: 'Color',
    selectColor: 'Select a color',
    transmission: 'Transmission',
    fuelType: 'Fuel Type',
    seats: 'Seats',
    dailyRate: 'Daily Rate',
    mileage: 'Mileage',
    description: 'Description',
    features: 'Features',
    carName: 'Car Name',
    automatic: 'Automatic',
    manual: 'Manual',
    petrol: 'Petrol',
    diesel: 'Diesel',
    electric: 'Electric',
    hybrid: 'Hybrid',
    statusAvailable: 'Available',
    statusRented: 'Rented',
    statusMaintenance: 'Maintenance',
    statusInactive: 'Inactive',
    totalCars: 'Total Cars',
    availableCars: 'Available Cars',
    confirmDelete: 'Confirm Delete',
    confirmDeleteMessage: 'Are you sure you want to delete this car? This action cannot be undone.',
    cancel: 'Cancel',
    delete: 'Delete',
    save: 'Save',
    update: 'Update',
    required: 'Required',
    searchCars: 'Search cars...',
    noCarsFound: 'No cars found',
    carAdded: 'Car added successfully',
    carUpdated: 'Car updated successfully',
    carDeleted: 'Car deleted successfully',
    perDay: 'per day',
    km: 'km',
    
    // Customers
    customers: 'Customers',
    customersSubtitle: 'View and manage your customers',
    customerDetails: 'Customer Details',
    customerName: 'Customer Name',
    email: 'Email',
    phone: 'Phone',
    address: 'Address',
    city: 'City',
    country: 'Country',
    dateOfBirth: 'Date of Birth',
    licenseNumber: 'License Number',
    licenseExpiryDate: 'License Expiry Date',
    totalBookings: 'Total Bookings',
    totalSpent: 'Total Spent',
    joinedAt: 'Joined',
    lastBookingAt: 'Last Booking',
    notes: 'Notes',
    searchCustomers: 'Search customers...',
    noCustomersFound: 'No customers found',
    sortBy: 'Sort by',
    sortByName: 'Name',
    sortByBookings: 'Bookings',
    sortBySpent: 'Total Spent',
    sortByJoined: 'Joined Date',
    sortByLastBooking: 'Last Booking',
    viewDetails: 'View Details',
    bookingHistory: 'Booking History',
    noBookingsYet: 'No bookings yet',
    topCustomers: 'Top Customers',
    recentCustomers: 'Recent Customers',
    lifetimeValue: 'Lifetime Value',
    
    // Calendar
    calendar: 'Calendar',
    calendarSubtitle: 'View all pickups and dropoffs',
    today: 'Today',
    month: 'Month',
    week: 'Week',
    day: 'Day',
    upcomingPickups: 'Upcoming Pickups',
    upcomingDropoffs: 'Upcoming Dropoffs',
    noEventsToday: 'No events scheduled for today',
    noEventsThisWeek: 'No events scheduled this week',
    pickupTime: 'Pickup Time',
    dropoffTime: 'Dropoff Time',
    location: 'Location',
    pickupLocation: 'Pickup Location',
    dropoffLocation: 'Dropoff Location',
    duration: 'Duration',
    days: 'days',
    viewCalendar: 'View Calendar',
    allEvents: 'All Events',
    todaysEvents: "Today's Events",
    thisWeeksEvents: "This Week's Events",
    monthView: 'Month View',
    weekView: 'Week View',
    dayView: 'Day View',
    listView: 'List View',
    activeBookings: 'Active Bookings',
    scheduledPickups: 'Scheduled Pickups',
    scheduledDropoffs: 'Scheduled Dropoffs',
    timeline: 'Timeline',
    morning: 'Morning',
    afternoon: 'Afternoon',
    evening: 'Evening',
    noEventsScheduled: 'No events scheduled',
    bookingSchedule: 'Booking Schedule',
    viewBooking: 'View Booking',

    // Profile
    myProfile: 'My Profile',
    profileSettings: 'Profile Settings',
    editProfile: 'Edit Profile',
    saveProfile: 'Save Profile',
    cancelEdit: 'Cancel',
    agencyName: 'Agency Name',
    agencyDescription: 'Description',
    contactInformation: 'Contact Information',
    businessInformation: 'Business Information',
    phone: 'Phone',
    email: 'Email',
    address: 'Address',
    city: 'City',
    country: 'Country',
    postalCode: 'Postal Code',
    website: 'Website',
    taxId: 'Tax ID',
    profileUpdated: 'Profile updated successfully',
    profileUpdateFailed: 'Failed to update profile',
    requiredField: 'This field is required',
    agencyDetails: 'Agency Details',
    contactDetails: 'Contact Details',
    locationDetails: 'Location Details',
    additionalInfo: 'Additional Information',
    uploadLogo: 'Upload Logo',
    changeLogo: 'Change Logo',
    removeLogo: 'Remove Logo',
    logoUploadInfo: 'PNG, JPG or WEBP (max. 2MB)',
    dragDropLogo: 'Drag and drop your logo here',
    orClickToUpload: 'or click to upload',
    logoPreview: 'Logo Preview',
    active: 'Active',
    found: 'found',
    statusPickedup: 'Picked Up',
  },
  al: {
    allBookings: 'Të gjitha rezervimet',
    filterByStatus: 'Filtro sipas statusit',
    filterByDate: 'Filtro sipas datës',
    statusPending: 'Në pritje',
    statusConfirmed: 'E konfirmuar',
    statusPickedUp: 'E marrë',
    statusReturned: 'E kthyer',
    statusCancelled: 'E anuluar',
    totalPrice: 'Çmimi total',
    customer: 'Klienti',
    car: 'Mjeti',
    pickup: 'Marrja',
    dropoff: 'Dorëzimi',
    createdAt: 'Krijuar më',
    actions: 'Veprimet',
    markAsConfirmed: 'Shëno si të konfirmuar',
    markAsPickedUp: 'Shëno si të marrë',
    markAsReturned: 'Shëno si të kthyer',
    cancelBooking: 'Anulo rezervimin',
    noResults: 'S\'ka rezultate',
    searchByCustomerOrCar: 'Kërko sipas klientit ose mjetit...',
    bookings: 'Rezervimet',
    bookingsSubtitle: 'Menaxho të gjitha rezervimet e makinave',
    view: 'Shiko',
    all: 'Të gjitha',
    from: 'Nga',
    to: 'Deri',
    dealerName: 'Tregtari',
    dates: 'Datat',
    status: 'Statusi',
    bookingDetails: 'Detajet e rezervimit',
    close: 'Mbyll',
    success: 'Sukses',
    bookingUpdated: 'Statusi i rezervimit u përditësua me sukses',
    
    // Dashboard
    dashboard: 'Paneli',
    welcomeBack: 'Mirë se vini përsëri',
    overview: 'Përmbledhje',
    totalBookings: 'Rezervimet totale',
    activeRentals: 'Qiradhëniet aktive',
    totalRevenue: 'Të ardhurat totale',
    pendingApprovals: 'Në pritje të miratimit',
    recentBookings: 'Rezervimet e fundit',
    viewAllBookings: 'Shiko të gjitha rezervimet',
    logout: 'Dil',
    profile: 'Profili',
    settings: 'Cilësimet',
    carManagement: 'Menaxhimi i mjeteve',
    analytics: 'Analizat',
    vsLastMonth: 'krahasuar me muajin e kaluar',
    currentlyActive: 'Aktualisht aktive',
  awaitingConfirmation: 'Në pritje të konfirmimit',
  thisMonth: 'Këtë muaj',
  back: 'Kthehu',
  quickActions: 'Veprime të shpejta',
    
    // Cars
    cars: 'Automjetet',
    carsSubtitle: 'Menaxho flotën tënde të mjeteve',
    addCar: 'Shto mjet',
    editCar: 'Ndrysho mjetin',
    deleteCar: 'Fshi mjetin',
    carDetails: 'Detajet e mjetit',
    brand: 'Marka',
    model: 'Modeli',
    year: 'Viti',
    plateNumber: 'Targa',
    color: 'Ngjyra',
    selectColor: 'Zgjidh një ngjyrë',
    transmission: 'Transmisioni',
    fuelType: 'Lloji i karburantit',
    seats: 'Ulëset',
    dailyRate: 'Çmimi ditor',
    mileage: 'Kilometrazhi',
    description: 'Përshkrimi',
    features: 'Karakteristikat',
    carName: 'Emri i mjetit',
    automatic: 'Automatik',
    manual: 'Manual',
    petrol: 'Benzinë',
    diesel: 'Naftë',
    electric: 'Elektrik',
    hybrid: 'Hibrid',
    statusAvailable: 'I disponueshëm',
    statusRented: 'I qiraxhuar',
    statusMaintenance: 'Në mirëmbajtje',
    statusInactive: 'Jo aktiv',
    totalCars: 'Mjetet totale',
    availableCars: 'Mjetet e disponueshme',
    confirmDelete: 'Konfirmo fshirjen',
    confirmDeleteMessage: 'Jeni të sigurt që dëshironi të fshini këtë mjet? Ky veprim nuk mund të anullohet.',
    cancel: 'Anulo',
    delete: 'Fshi',
    save: 'Ruaj',
    update: 'Përditëso',
    required: 'I detyrueshëm',
    searchCars: 'Kërko mjete...',
    noCarsFound: 'Nuk u gjetën mjete',
    carAdded: 'Mjeti u shtua me sukses',
    carUpdated: 'Mjeti u përditësua me sukses',
    carDeleted: 'Mjeti u fshi me sukses',
    perDay: 'në ditë',
    km: 'km',
    
    // Customers
    customers: 'Klientët',
    customersSubtitle: 'Shiko dhe menaxho klientët e tu',
    customerDetails: 'Detajet e klientit',
    customerName: 'Emri i klientit',
    email: 'Email',
    phone: 'Telefoni',
    address: 'Adresa',
    city: 'Qyteti',
    country: 'Vendi',
    dateOfBirth: 'Data e lindjes',
    licenseNumber: 'Numri i patentës',
    licenseExpiryDate: 'Skadenca e patentës',
    totalBookings: 'Rezervimet totale',
    totalSpent: 'Shpenzuar gjithsej',
    joinedAt: 'Anëtarësuar',
    lastBookingAt: 'Rezervimi i fundit',
    notes: 'Shënime',
    searchCustomers: 'Kërko klientë...',
    noCustomersFound: 'Nuk u gjetën klientë',
    sortBy: 'Rendit sipas',
    sortByName: 'Emri',
    sortByBookings: 'Rezervimet',
    sortBySpent: 'Shpenzuar',
    sortByJoined: 'Data e anëtarësimit',
    sortByLastBooking: 'Rezervimi i fundit',
    viewDetails: 'Shiko detajet',
    bookingHistory: 'Historia e rezervimeve',
    noBookingsYet: 'Ende pa rezervime',
    topCustomers: 'Klientët kryesorë',
    recentCustomers: 'Klientët e fundit',
    lifetimeValue: 'Vlera totale',
    
    // Calendar
    calendar: 'Kalendari',
    calendarSubtitle: 'Shiko të gjitha marrjet dhe dorëzimet',
    today: 'Sot',
    month: 'Muaji',
    week: 'Java',
    day: 'Dita',
    upcomingPickups: 'Marrjet e ardhshme',
    upcomingDropoffs: 'Dorëzimet e ardhshme',
    noEventsToday: 'Nuk ka ngjarje të planifikuara për sot',
    noEventsThisWeek: 'Nuk ka ngjarje të planifikuara këtë javë',
    pickupTime: 'Ora e marrjes',
    dropoffTime: 'Ora e dorëzimit',
    location: 'Vendndodhja',
    pickupLocation: 'Vendndodhja e marrjes',
    dropoffLocation: 'Vendndodhja e dorëzimit',
    duration: 'Kohëzgjatja',
    days: 'ditë',
    viewCalendar: 'Shiko kalendarin',
    allEvents: 'Të gjitha ngjarjet',
    todaysEvents: 'Ngjarjet e sotme',
    thisWeeksEvents: 'Ngjarjet e kësaj jave',
    monthView: 'Pamja mujore',
    weekView: 'Pamja javore',
    dayView: 'Pamja ditore',
    listView: 'Pamja listë',
    activeBookings: 'Rezervimet aktive',
    scheduledPickups: 'Marrjet e planifikuara',
    scheduledDropoffs: 'Dorëzimet e planifikuara',
    timeline: 'Afati kohor',
    morning: 'Mëngjes',
    afternoon: 'Pasdite',
    evening: 'Mbrëmje',
    noEventsScheduled: 'Nuk ka ngjarje të planifikuara',
    bookingSchedule: 'Orari i rezervimeve',
    viewBooking: 'Shiko rezervimin',

    // Profile
    myProfile: 'Profili im',
    profileSettings: 'Cilësimet e profilit',
    editProfile: 'Ndrysho profilin',
    saveProfile: 'Ruaj profilin',
    cancelEdit: 'Anulo',
    agencyName: 'Emri i agjencisë',
    agencyDescription: 'Përshkrimi',
    contactInformation: 'Informacioni i kontaktit',
    businessInformation: 'Informacioni i biznesit',
    phone: 'Telefoni',
    email: 'Email',
    address: 'Adresa',
    city: 'Qyteti',
    country: 'Shteti',
    postalCode: 'Kodi postar',
    website: 'Faqja web',
    taxId: 'Numri i tatimit',
    profileUpdated: 'Profili u përditësua me sukses',
    profileUpdateFailed: 'Dështoi përditësimi i profilit',
    requiredField: 'Kjo fushë është e detyrueshme',
    agencyDetails: 'Detajet e agjencisë',
    contactDetails: 'Detajet e kontaktit',
    locationDetails: 'Detajet e vendndodhjes',
    additionalInfo: 'Informacion shtesë',
    uploadLogo: 'Ngarko logon',
    changeLogo: 'Ndrysho logon',
    removeLogo: 'Fshi logon',
    logoUploadInfo: 'PNG, JPG ose WEBP (maks. 2MB)',
    dragDropLogo: 'Zvarrit dhe lësho logon këtu',
    orClickToUpload: 'ose kliko për të ngarkuar',
    logoPreview: 'Pamja e logos',
    active: 'Aktiv',
    found: 'u gjetën',
    statusPickedup: 'Marrë',
  },
}

