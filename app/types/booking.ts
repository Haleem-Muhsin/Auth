export interface Booking {
  customerId: string;
  ambulanceId: string;
  status: 'pending' | 'accepted' | 'completed' | 'cancelled';
  timestamp: number;
  vehicleType?: string;
  pickupLocation: {
    latitude: number;
    longitude: number;
    address: string;
  };
  destinationLocation: {
    latitude: number;
    longitude: number;
    address: string;
  };
} 