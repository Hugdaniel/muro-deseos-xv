import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-app.js";
import { getFirestore, collection, addDoc, serverTimestamp, query, orderBy, onSnapshot } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyD-BggX8z3-6HOEfhuWkm3kYcylolCNETA",
  authDomain: "muro-victoria-15.firebaseapp.com",
  projectId: "muro-victoria-15",
  storageBucket: "muro-victoria-15.firebasestorage.app",
  messagingSenderId: "891242435923",
  appId: "1:891242435923:web:50bc4721f159d879397da6",
  measurementId: "G-GJMT0BWYG2"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// --- VARIABLES GLOBALES ---
let mediaRecorder;
let fragmentosAudio = [];
let audioURL = null;

const btnGrabar = document.getElementById('btnGrabar');
const btnEnviar = document.getElementById('btnEnviar');
const muro = document.getElementById('muro');
const txtDeseo = document.getElementById('textoDeseo');
const statusAudio = document.getElementById('statusAudio');
const charCount = document.getElementById('charCount');
let audioTimeout;

// --- 1. FUNCIÓN CREARCARD (Declarada arriba para que no falle) ---
function crearCard(texto, audio, nombre = "Anónimo") {
    const card = document.createElement('div');
    card.className = 'card-deseo';
    const hora = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    let contenidoHTML = `<strong style="color: #ffffff; display: block; margin-bottom: 5px; font-size: 0.9rem;">${nombre}</strong>`;
    
    if (texto) contenidoHTML += `<p>${texto}</p>`;
    
    if (audio) {
        contenidoHTML += `
            <div class="audio-container">
                <small>🎤 Mensaje de voz</small>
                <audio src="${audio}" controls></audio>
            </div>`;
    }
    
    contenidoHTML += `<span class="card-time">${hora}</span>`;
    card.innerHTML = contenidoHTML;
    muro.prepend(card);
}

// --- 2. AUDIO Y GRABACIÓN ---
async function iniciarGrabacion() {
    try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        const tipo = MediaRecorder.isTypeSupported('audio/webm') ? 'audio/webm' : 'audio/mp4';
        mediaRecorder = new MediaRecorder(stream, { mimeType: tipo });
        fragmentosAudio = [];

        mediaRecorder.ondataavailable = (e) => { if (e.data.size > 0) fragmentosAudio.push(e.data); };

        mediaRecorder.onstop = () => {
            const blob = new Blob(fragmentosAudio, { type: tipo });
            audioURL = URL.createObjectURL(blob);
            statusAudio.innerText = "✅ Audio listo";
            stream.getTracks().forEach(track => track.stop());
            btnGrabar.classList.remove('grabando');
        };

        mediaRecorder.start();
        btnGrabar.classList.add('grabando');
        statusAudio.innerText = "Grabando...";
    } catch (error) {
        alert("Error con el micrófono: " + error.message);
    }
}

btnGrabar.onclick = () => {
    if (!mediaRecorder || mediaRecorder.state === "inactive") iniciarGrabacion();
    else mediaRecorder.stop();
};

// --- 3. LOGICA DE ENVIO A FIREBASE ---
btnEnviar.onclick = async () => {
    const texto = txtDeseo.value.trim();
    const inputNombre = document.getElementById('nombreInvitado');
    const nombreVal = inputNombre ? inputNombre.value.trim() || "Anónimo" : "Anónimo"; 
    
    if (texto === "" && !audioURL) return;

    let urlFinalAudio = null;

    try {
        // --- PROCESO DE AUDIO ---
        if (audioURL) {
            statusAudio.innerText = "Subiendo audio... ☁️";
            console.log("Intentando subir audio local:", audioURL);
            
            const audioBlob = await fetch(audioURL).then(r => r.blob());
            const formData = new FormData();
            formData.append('file', audioBlob);
            formData.append('upload_preset', 'muro_victoria'); 

            const resp = await fetch('https://api.cloudinary.com/v1_1/djwtwxfvh/auto/upload', {
                method: 'POST',
                body: formData
            });

            const data = await resp.json();
            
            if (data.secure_url) {
                urlFinalAudio = data.secure_url;
                console.log("✅ Audio en la nube:", urlFinalAudio);
            } else {
                console.error("❌ Cloudinary no devolvió URL:", data);
            }
        }

        // --- GUARDADO EN FIREBASE ---
        await addDoc(collection(db, "mensajes"), {
            invitado: nombreVal,
            mensajes: texto, // Mantenemos la 's' ya que confirmaste que está así
            audioUrl: urlFinalAudio, 
            fecha: serverTimestamp()
        });
        
        console.log("✅ Todo guardado en Firebase");

        // RESETEO
        txtDeseo.value = "";
        if (inputNombre) inputNombre.value = "";
        audioURL = null;
        statusAudio.innerText = "";
        if (charCount) charCount.innerText = "0 / 200";

    } catch (error) {
        console.error("Error crítico en el envío:", error);
        statusAudio.innerText = "❌ Error al subir";
    }
};

// --- 4. LEER EN TIEMPO REAL ---
const q = query(collection(db, "mensajes"), orderBy("fecha", "desc"));

onSnapshot(q, (snapshot) => {
    muro.innerHTML = ""; 
    snapshot.forEach((doc) => {
        const datos = doc.data();
        crearCard(datos.mensajes, datos.audioUrl, datos.invitado);
    });
}, (error) => {
    console.error("Error al leer:", error);
});

// Contador
txtDeseo.oninput = () => {
    const currentLength = txtDeseo.value.length;
    if(charCount) charCount.innerText = `${currentLength} / 200`;
};