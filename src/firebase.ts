import { getApp, getApps, initializeApp } from 'firebase/app'
import { getAuth } from 'firebase/auth'
import { getFirestore } from 'firebase/firestore'
import { getStorage } from 'firebase/storage'

const firebaseConfig = {
  apiKey: 'AIzaSyBbfsUnKOu_hFatrnb-JHruVOYKRTJIAIs',
  authDomain: 'bangawoon-church-homepage.firebaseapp.com',
  projectId: 'bangawoon-church-homepage',
  storageBucket: 'bangawoon-church-homepage.firebasestorage.app',
  messagingSenderId: '450957986401',
  appId: '1:450957986401:web:a4778220ee933780a9f820',
}

const app = getApps().length ? getApp() : initializeApp(firebaseConfig)

export const auth = getAuth(app)
export const db = getFirestore(app)
export const storage = getStorage(app)
export const ADMIN_EMAIL = 'sonickthgmal@gmail.com'
export const YOUTUBE_API_KEY = firebaseConfig.apiKey
