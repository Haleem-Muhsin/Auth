interface Ambulance {
  id: string;
  latitude: number;
  longitude: number;
  status: 'available' | 'busy' | 'offline';
  driver: string;
  phoneNumber?: string;
  lastUpdated: number;
  type?: 'Basic' | 'Advanced' | 'ICU';
  hospital?: string;
}

export default Ambulance;
export type { Ambulance }; 