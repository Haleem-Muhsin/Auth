import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getDatabase } from 'firebase/database';

const firebaseConfig = {
    apiKey: "AIzaSyCe68KP9wm8I1O1Q_nFfbNA7SuKoO5m7HY",
    authDomain: "medimove-6b1fd.firebaseapp.com",
    projectId: "medimove-6b1fd",
    storageBucket: "medimove-6b1fd.firebasestorage.app",
    messagingSenderId: "1085871722808",
    appId: "1:1085871722808:web:157d8f4e25960632f331cd",
    measurementId: "G-12G6FXY3H2",
    databaseURL: "https://medimove-6b1fd-default-rtdb.firebaseio.com"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const firestore = getFirestore(app);
const database = getDatabase(app);

export { auth, firestore, database };
export default app;


