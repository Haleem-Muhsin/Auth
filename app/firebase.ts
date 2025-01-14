import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';

const firebaseConfig = {
    apiKey: "AIzaSyCe68KP9wm8I1O1Q_nFfbNA7SuKoO5m7HY",
    authDomain: "medimove-6b1fd.firebaseapp.com",
    projectId: "medimove-6b1fd",
    storageBucket: "medimove-6b1fd.firebasestorage.app",
    messagingSenderId: "1085871722808",
    appId: "1:1085871722808:web:157d8f4e25960632f331cd",
    measurementId: "G-12G6FXY3H2"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);

export { auth };
export default app;


