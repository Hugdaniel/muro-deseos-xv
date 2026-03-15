import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-app.js";
import { getFirestore, collection, addDoc, serverTimestamp } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-firestore.js";

// Tus credenciales (las que copiaste)
const firebaseConfig = {
  apiKey: "AIzaSyD-BggX8z3-6HOEfhuWkm3kYcylolCNETA",
  authDomain: "muro-victoria-15.firebaseapp.com",
  projectId: "muro-victoria-15",
  storageBucket: "muro-victoria-15.firebasestorage.app",
  messagingSenderId: "891242435923",
  appId: "1:891242435923:web:50bc4721f159d879397da6",
  measurementId: "G-GJMT0BWYG2"
};

// Inicializamos
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// Lógica para enviar el mensaje
const form = document.getElementById('btn-enviar');

form.addEventListener('click', async (e) => {
    e.preventDefault();

    const nombre = document.getElementById('nombre').value;
    const mensaje = document.getElementById('mensaje').value;

    try {
        // "mensajes" es el nombre de la colección en Firestore
        await addDoc(collection(db, "mensajes"), {
            nombre: nombre,
            texto: mensaje,
            fecha: serverTimestamp()
        });
        
        alert("¡Mensaje enviado con éxito!");
        form.reset();
    } catch (error) {
        console.error("Error al enviar: ", error);
        alert("Hubo un error, revisá la consola.");
    }
});