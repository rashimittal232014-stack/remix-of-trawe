// Shared field schemas for Masters + Itinerary service dialogs.
// Keeps "Add Service" in the Itinerary Builder in lock-step with the Masters
// form for the same category.

export type FieldDef = {
  key: string;
  label: string;
  type?: "text" | "textarea" | "select" | "number" | "time" | "date" | "datetime" | "images" | "files";
  options?: string[];
  placeholder?: string;
  span?: 1 | 2;
  path?: "root" | "meta";
  required?: boolean;
  accept?: string;
};

export const KIND_FIELDS: Record<string, FieldDef[]> = {
  day_detail: [
    { key: "name", label: "Title", path: "root", required: true, span: 2 },
    { key: "city", label: "Destination", path: "root", required: true },
    { key: "duration", label: "Day / Duration", path: "root", placeholder: "e.g. Day 1" },
    { key: "image_url", label: "Image URL", path: "root", span: 2 },
    { key: "description", label: "Description", type: "textarea", path: "root", span: 2 },
  ],
  hotel: [
    { key: "name", label: "Hotel Name", path: "root", required: true },
    { key: "city", label: "Location / City", path: "root", placeholder: "Type city or destination" },
    { key: "star_rating", label: "Star Category", type: "select", path: "meta",
      options: ["1 Star", "2 Star", "3 Star", "4 Star", "5 Star"] },
    { key: "room_type", label: "Room Type", path: "meta", placeholder: "e.g. Deluxe Room" },
    { key: "meal_plan", label: "Meal Plan", type: "select", path: "meta",
      options: ["EP", "CP", "MAP", "AP"] },
    { key: "check_in", label: "Check-in", type: "date", path: "meta" },
    { key: "check_out", label: "Check-out", type: "date", path: "meta" },
    { key: "nights", label: "Nights", type: "number", path: "meta" },
    { key: "description", label: "Description", type: "textarea", path: "root", span: 2 },
    { key: "images", label: "Images", type: "images", path: "meta", span: 2 },
  ],
  transfer: [
    { key: "name", label: "Transfer Name", path: "root", required: true },
    { key: "city", label: "Location / City", path: "root", placeholder: "Type city or destination" },
    { key: "from_location", label: "Pickup / From", path: "meta", placeholder: "Type city or destination" },
    { key: "to_location", label: "Drop / To", path: "meta", placeholder: "Type city or destination" },
    { key: "vehicle_type", label: "Vehicle Type", path: "meta", placeholder: "e.g. Sedan / SUV" },
    { key: "pickup_time", label: "Pickup Time", type: "time", path: "meta" },
    { key: "description", label: "Description", type: "textarea", path: "root", span: 2 },
    { key: "images", label: "Images", type: "images", path: "meta", span: 2 },
  ],
  sightseeing: [
    { key: "name", label: "Sightseeing Name", path: "root", required: true },
    { key: "city", label: "Location / City", path: "root", placeholder: "Type city or destination" },
    { key: "duration", label: "Duration / Pickup", path: "root", placeholder: "e.g. 2 hrs / Full Day" },
    { key: "private", label: "Ticket Type", type: "select", path: "meta",
      options: ["Private", "SIC / Shared"] },
    { key: "description", label: "Description", type: "textarea", path: "root", span: 2 },
    { key: "images", label: "Images", type: "images", path: "meta", span: 2 },
  ],
  cruise: [
    { key: "name", label: "Cruise Name", path: "root", required: true },
    { key: "ship_name", label: "Ship Name", path: "meta" },
    { key: "cabin", label: "Cabin", path: "meta", placeholder: "e.g. Balcony / Interior" },
    { key: "from_port", label: "From Port", path: "meta", placeholder: "Type city or destination" },
    { key: "to_port", label: "To Port", path: "meta", placeholder: "Type city or destination" },
    { key: "sailing_date", label: "Sailing Date", type: "date", path: "meta" },
    { key: "return_date", label: "Return Date", type: "date", path: "meta" },
    { key: "description", label: "Description", type: "textarea", path: "root", span: 2 },
    { key: "images", label: "Images", type: "images", path: "meta", span: 2 },
  ],
  flight: [
    { key: "name", label: "Sector / Ticket Title", path: "root", required: true, span: 2,
      placeholder: "e.g. DEL to BOM - Air India" },
    { key: "airline", label: "Airline", path: "meta", placeholder: "IndiGo / Air India" },
    { key: "flight_no", label: "Flight No", path: "meta", placeholder: "6E 6829" },
    { key: "aircraft", label: "Aircraft", path: "meta", placeholder: "Airbus A321" },
    { key: "trip_type", label: "Trip Type", type: "select", path: "meta",
      options: ["One Way", "Round Trip"] },
    { key: "from_city", label: "From", path: "meta", placeholder: "New Delhi" },
    { key: "from_terminal", label: "From Terminal", path: "meta", placeholder: "Terminal T1" },
    { key: "to_city", label: "To", path: "meta", placeholder: "Mumbai" },
    { key: "to_terminal", label: "To Terminal", path: "meta", placeholder: "Terminal T2" },
    { key: "departure", label: "Departure", type: "datetime", path: "meta" },
    { key: "arrival", label: "Arrival", type: "datetime", path: "meta" },
    { key: "duration", label: "Duration", path: "meta", placeholder: "01 h 25 m" },
    { key: "layover", label: "Layover", path: "meta", placeholder: "3h35 Layover in Indore" },
    { key: "baggage", label: "Baggage", path: "meta", placeholder: "ADULT" },
    { key: "checkin_baggage", label: "Check-in Baggage", path: "meta", placeholder: "15 Kgs (1 piece only)" },
    { key: "cabin_baggage", label: "Cabin Baggage", path: "meta", placeholder: "7 Kgs (1 piece only)" },
    { key: "layout", label: "Layout", path: "meta", placeholder: "3-3 Layout" },
    { key: "meal", label: "Meal / Beverage", path: "meta", placeholder: "Beverage Available" },
    { key: "description", label: "Description", type: "textarea", path: "root", span: 2 },
  ],
  ferry: [
    { key: "name", label: "Ferry Name", path: "root", required: true },
    { key: "category", label: "Ferry Category", path: "meta" },
    { key: "city", label: "Location / City", path: "root", placeholder: "Type city or destination" },
    { key: "from_port", label: "From Port", path: "meta", placeholder: "Type city or destination" },
    { key: "to_port", label: "To Port", path: "meta", placeholder: "Type city or destination" },
    { key: "departure_time", label: "Start Time", type: "time", path: "meta" },
    { key: "arrival_time", label: "End Time", type: "time", path: "meta" },
    { key: "description", label: "Description", type: "textarea", path: "root", span: 2 },
    { key: "images", label: "Images", type: "images", path: "meta", span: 2 },
  ],
  bus: [
    { key: "name", label: "Bus Name / Operator", path: "root", required: true },
    { key: "city", label: "Location / City", path: "root", placeholder: "Type city or destination" },
    { key: "from_location", label: "From City", path: "meta", placeholder: "Type city or destination" },
    { key: "to_location", label: "To City", path: "meta", placeholder: "Type city or destination" },
    { key: "bus_type", label: "Bus Type", path: "meta", placeholder: "e.g. AC / Sleeper / Volvo" },
    { key: "departure", label: "Departure", type: "datetime", path: "meta" },
    { key: "arrival", label: "Arrival", type: "datetime", path: "meta" },
    { key: "description", label: "Description", type: "textarea", path: "root", span: 2 },
    { key: "images", label: "Images", type: "images", path: "meta", span: 2 },
  ],
  train: [
    { key: "name", label: "Train Name", path: "root", required: true },
    { key: "train_number", label: "Train Number", path: "meta" },
    { key: "class", label: "Class", type: "select", path: "meta",
      options: ["1A", "2A", "3A", "SL", "CC", "EC", "2S"] },
    { key: "city", label: "Location / City", path: "root", placeholder: "Type city or destination" },
    { key: "from_station", label: "From Station", path: "meta", placeholder: "Type city or destination" },
    { key: "to_station", label: "To Station", path: "meta", placeholder: "Type city or destination" },
    { key: "departure", label: "Departure", type: "datetime", path: "meta" },
    { key: "arrival", label: "Arrival", type: "datetime", path: "meta" },
    { key: "description", label: "Description", type: "textarea", path: "root", span: 2 },
    { key: "images", label: "Images", type: "images", path: "meta", span: 2 },
  ],
  complementary: [
    { key: "name", label: "Complementary Name", path: "root", required: true, span: 2 },
    { key: "city", label: "City", path: "root" },
    { key: "description", label: "Description", type: "textarea", path: "root", span: 2 },
    { key: "images", label: "Images", type: "images", path: "meta", span: 2 },
  ],
  visa: [
    { key: "name", label: "Visa Name", path: "root", required: true, span: 2 },
    { key: "country", label: "Country", path: "root", required: true },
    { key: "visa_type", label: "Visa Type", type: "select", path: "meta",
      options: ["Tourist Visa", "Business Visa", "Transit Visa", "eVisa", "Visa On Arrival", "Student Visa"] },
    { key: "entry_type", label: "Entry Type", type: "select", path: "meta",
      options: ["Single", "Multiple", "Double"] },
    { key: "processing_time", label: "Processing Time", path: "meta", placeholder: "e.g. 5 Working Days" },
    { key: "stay_duration", label: "Stay Duration", path: "meta", placeholder: "e.g. 30 Days" },
    { key: "validity", label: "Validity", path: "meta", placeholder: "e.g. 90 Days" },
    { key: "description", label: "Documents / Notes", type: "textarea", path: "root", span: 2 },
    { key: "attachments", label: "Documents (Passport scan, photo, forms)", type: "files", path: "meta", span: 2,
      accept: "image/*,application/pdf" },
  ],
  passport: [
    { key: "name", label: "Service Name", path: "root", required: true, span: 2 },
    { key: "city", label: "PSK / Centre", path: "root", required: true,
      placeholder: "e.g. Delhi PSK" },
    { key: "service_type", label: "Service Type", type: "select", path: "meta",
      options: ["Fresh", "Renewal", "Tatkal", "Minor", "Damaged / Lost", "Name Change"] },
    { key: "processing_time", label: "Processing Time", path: "meta", placeholder: "e.g. 7 Working Days" },
    { key: "description", label: "Notes", type: "textarea", path: "root", span: 2 },
    { key: "attachments", label: "Passport Documents", type: "files", path: "meta", span: 2,
      accept: "image/*,application/pdf" },
  ],
  supplier: [
    { key: "name", label: "Supplier Name", path: "root", required: true, span: 2 },
    { key: "supplier_type", label: "Supplier Type", type: "select", path: "meta",
      options: ["Full Package", "Hotel", "Transfer", "Sightseeing", "Cruise", "Ferry", "Bus", "Train", "Flight", "Visa", "Agent", "Other"] },
    { key: "phone", label: "Phone", path: "meta" },
    { key: "email", label: "Email", path: "meta" },
    { key: "gst_no", label: "GST No", path: "meta" },
    { key: "pan_no", label: "PAN", path: "meta" },
    { key: "city", label: "City", path: "root" },
    { key: "country", label: "Country", path: "root" },
    { key: "location", label: "Address", path: "root", span: 2 },
    { key: "credit_days", label: "Credit Days", type: "number", path: "meta" },
    { key: "opening_balance", label: "Opening Balance", type: "number", path: "meta" },
    { key: "description", label: "Notes", type: "textarea", path: "root", span: 2 },
    { key: "attachments", label: "Agreements / KYC Documents", type: "files", path: "meta", span: 2,
      accept: "image/*,application/pdf" },
  ],
  meal_plan: [
    { key: "name", label: "Meal Plan Name", path: "root", required: true, span: 2,
      placeholder: "e.g. EP / CP / MAP / AP" },
    { key: "description", label: "Description", type: "textarea", path: "root", span: 2 },
  ],
  room_type: [
    { key: "name", label: "Room Type Name", path: "root", required: true, span: 2,
      placeholder: "e.g. Deluxe Room / Suite" },
    { key: "description", label: "Description", type: "textarea", path: "root", span: 2 },
  ],
  bank: [
    { key: "name", label: "Bank Name", path: "root", required: true, span: 2 },
    { key: "account_holder", label: "Account Holder", path: "meta", required: true },
    { key: "account_no", label: "Account Number", path: "meta", required: true },
    { key: "ifsc_swift", label: "IFSC / SWIFT", path: "meta", required: true },
    { key: "branch", label: "Branch", path: "meta" },
    { key: "account_type", label: "Account Type", type: "select", path: "meta",
      options: ["Savings", "Current", "OD / CC", "Foreign Currency"] },
    { key: "opening_balance", label: "Opening Balance", type: "number", path: "meta" },
    { key: "currency", label: "Currency", type: "select", path: "meta",
      options: ["INR", "USD", "EUR", "GBP", "AED", "SGD", "AUD"] },
    { key: "upi_id", label: "UPI ID", path: "meta" },
    { key: "notes", label: "Notes", type: "textarea", path: "meta", span: 2 },
    { key: "attachments", label: "Cheque / Passbook Scan", type: "files", path: "meta", span: 2,
      accept: "image/*,application/pdf" },
  ],
};

// Map itinerary service_type (from SERVICE_TYPES in the builder) to the
// matching Masters kind whose field schema we should reuse.
export const SERVICE_TYPE_TO_KIND: Record<string, string> = {
  hotel: "hotel",
  transport: "transfer",
  sightseeing: "sightseeing",
  flight: "flight",
  cruise: "cruise",
  ferry: "ferry",
  bus: "bus",
  train: "train",
  meal: "meal_plan",
  visa: "visa",
  passport: "passport",
};

export function fieldsForServiceType(serviceType: string): FieldDef[] {
  const kind = SERVICE_TYPE_TO_KIND[serviceType] ?? serviceType;
  // For itinerary usage we skip "name" (mapped to title) and "images" (single
  // image handled by the builder's SingleImagePicker). Description is also
  // rendered by the base fields.
  return (KIND_FIELDS[kind] ?? []).filter(
    (f) => !["name", "images", "description"].includes(f.key),
  );
}