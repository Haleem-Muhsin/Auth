export interface Booking {
  customerId: string;
  ambulanceId: string;
  status: 'pending' | 'accepted' | 'completed' | 'cancelled';
  timestamp: number;
  customerLocation: {
    latitude: number;
    longitude: number;
  };
} 