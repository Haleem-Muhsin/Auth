import { collection, getDocs, setDoc, doc } from 'firebase/firestore';
import { firestore } from '../firebase';
import { fakeAmbulances } from '../components/AmbulanceList';

export const initializeAmbulanceDB = async () => {
  try {
    const ambulancesRef = collection(firestore, 'ambulances');
    const snapshot = await getDocs(ambulancesRef);
    
    if (snapshot.empty) {
      // Populate with fake ambulances if collection is empty
      for (const ambulance of fakeAmbulances) {
        await setDoc(doc(ambulancesRef, ambulance.id), ambulance);
      }
      console.log('Ambulances initialized in Firestore');
    }
  } catch (error) {
    console.error('Error initializing ambulances:', error);
  }
}; 