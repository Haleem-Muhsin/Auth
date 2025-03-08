interface Ambulance {
  id: string;  // This will be the number plate
  driver: string;
  hospital: string;
  phoneNumber: string;
  status: 'available' | 'busy' | 'offline';
  type: 'Basic' | 'Advanced' | 'ICU';
  latitude: number;
  longitude: number;
  lastUpdated: number;
}

export default Ambulance;
export type { Ambulance }; 