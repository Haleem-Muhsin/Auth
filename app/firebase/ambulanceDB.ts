import { collection, getDocs } from 'firebase/firestore';
import { firestore } from '../firebase';

export const getAmbulances = async () => {
  try {
    const ambulancesRef = collection(firestore, 'ambulances');
    const snapshot = await getDocs(ambulancesRef);
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
  } catch (error) {
    console.error('Error fetching ambulances:', error);
    return [];
  }
}; 