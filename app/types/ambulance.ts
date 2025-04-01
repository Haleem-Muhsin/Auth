interface Ambulance {
  id: string;  // This will be the number plate
  driver: string;
  driverEmail: string;  // Driver's email address
  hospital: string;
  phoneNumber: string;
  status: 'available' | 'busy' | 'offline';
  type: 'Basic' | 'Advanced' | 'ICU';
  latitude: number;
  longitude: number;
  lastUpdated: number;
  insuranceStartDate: number;  // Unix timestamp
  insuranceEndDate: number;    // Unix timestamp
  pollutionEndDate: number;    // Unix timestamp
}

export default Ambulance;
export type { Ambulance }; 