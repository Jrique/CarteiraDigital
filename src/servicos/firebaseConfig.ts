import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';

// Suas credenciais do Firebase
// ATENÇÃO: Substitua os valores abaixo pelas suas próprias credenciais do Firebase!
const firebaseConfig = {
  apiKey: "AIzaSyBdKU-Vtlkhyqpf5y5NSWVGoZ4__OLxLqA",
  authDomain: "yourwallet-51a71.firebaseapp.com",
  projectId: "yourwallet-51a71",
  storageBucket: "yourwallet-51a71.firebasestorage.app",
  messagingSenderId: "429605884515",
  appId: "1:429605884515:web:f6343afd5f80f4dbe05e56"
};

// Inicializa o Firebase
const app = initializeApp(firebaseConfig);

// Exporta os serviços que você vai usar
export const db = getFirestore(app);
export const auth = getAuth(app);
