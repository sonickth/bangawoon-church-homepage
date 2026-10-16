// Firebase web configuration. Public client keys are not authorization; protect writes
// with Firebase Authentication and Firestore Security Rules before enabling publishing.
import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: 'AIzaSyBbfsUnKOu_hFatrnb-JHruVOYKRTJIAIs',
  authDomain: 'bangawoon-church-homepage.firebaseapp.com',
  projectId: 'bangawoon-church-homepage',
  storageBucket: 'bangawoon-church-homepage.firebasestorage.app',
  messagingSenderId: '450957986401',
  appId: '1:450957986401:web:a4778220ee933780a9f820',
};

export const firebaseApp = initializeApp(firebaseConfig);
export const db = getFirestore(firebaseApp);

