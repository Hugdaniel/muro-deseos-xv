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

// --- REFERENCIAS AL DOM ---
const btnGrabar = document.getElementById('btnGrabar');
const btnEnviar = document.getElementById('btnEnviar');
const muro = document.getElementById('muro');
const txtDeseo = document.getElementById('textoDeseo');
const statusAudio = document.getElementById('statusAudio');
const charCount = document.getElementById('charCount');

let mediaRecorder;
let fragmentosAudio = [];
let estaGrabando = false;
let intervaloCronometro;

// --- 1. FUNCIÓN PARA DIBUJAR LAS TARJETAS ---
function crearCard(texto, audio, nombre = "Anónimo", duracion = "") {
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

let tiempoInicio;

// --- 2. LÓGICA DE GRABACIÓN Y ENVÍO AUTOMÁTICO (TIPO WHATSAPP) ---
async function iniciarGrabacion() {
    try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        const tipo = MediaRecorder.isTypeSupported('audio/webm') ? 'audio/webm' : 'audio/mp4';
        mediaRecorder = new MediaRecorder(stream, { mimeType: tipo });
        fragmentosAudio = [];

        mediaRecorder.onstart = () => {
    tiempoInicio = Date.now(); // Guardamos el milisegundo exacto donde empezó
    console.log("Grabación iniciada en: ", tiempoInicio);
    
    // limpiar intervalos previos
    if (intervaloCronometro) clearInterval(intervaloCronometro);

    // INICIAR CRONÓMETRO
            intervaloCronometro = setInterval(() => {
                const ahora = Date.now();
                const diff = Math.floor((ahora - tiempoInicio) / 1000);
                const min = Math.floor(diff / 60);
                const seg = (diff % 60).toString().padStart(2, '0');
                statusAudio.innerText = `🔴 Grabando... ${min}:${seg} (Toca para enviar)`;
            }, 1000);
};

        mediaRecorder.ondataavailable = (e) => { if (e.data.size > 0) fragmentosAudio.push(e.data); };

        mediaRecorder.onstop = async () => {
            clearInterval(intervaloCronometro); // Detener el cronómetro
            const duracionMs = Date.now() - tiempoInicio;
            const segundos = Math.floor(duracionMs / 1000);
            const minutos = Math.floor(segundos / 60);
            const segRestantes = segundos % 60;
             const duracionFormateada = `${minutos}:${segRestantes < 10 ? '0' : ''}${segRestantes}`;
            const blob = new Blob(fragmentosAudio, { type: tipo });
            const urlLocal = URL.createObjectURL(blob);
            
            // Envío automático al terminar de grabar
            await enviarMensaje(urlLocal, duracionFormateada);
            
            stream.getTracks().forEach(track => track.stop());
        };

        mediaRecorder.start();
        estaGrabando = true;
        btnGrabar.classList.add('grabando');
        statusAudio.innerText = "🔴 Grabando... 0:00";
    } catch (error) {
        alert("Error con el micrófono: " + error.message);
    }
}

btnGrabar.onclick = () => {
    if (!estaGrabando) {
        iniciarGrabacion();
    } else {
        mediaRecorder.stop();
        estaGrabando = false;
        btnGrabar.classList.remove('grabando');
    }
};

// --- 3. FUNCIÓN COMPARTIDA PARA ENVIAR (TEXTO O AUDIO) ---
async function enviarMensaje(blobUrl = null, duracion = "") {
    const texto = txtDeseo.value.trim();
    const nombreVal = document.getElementById('nombreInvitado').value.trim() || "Anónimo";
    let urlFinalAudio = null;

    try {
        if (blobUrl) {
            statusAudio.innerText = "Subiendo audio... ☁️";
            const audioBlob = await fetch(blobUrl).then(r => r.blob());
            const formData = new FormData();
            formData.append('file', audioBlob);
            formData.append('upload_preset', 'muro-victoria'); 

            const resp = await fetch('https://api.cloudinary.com/v1_1/djwtwxfvh/auto/upload', {
                method: 'POST',
                body: formData
            });
            const data = await resp.json();
            urlFinalAudio = data.secure_url;
        }

        await addDoc(collection(db, "mensajes"), {
            invitado: nombreVal,
            mensajes: texto,
            audioUrl: urlFinalAudio,
            duracion: duracion,
            fecha: serverTimestamp()
        });

        // Limpiar después de enviar
        txtDeseo.value = "";
        statusAudio.innerText = "✅ ¡Enviado!";
        if (charCount) charCount.innerText = "0 / 200";
        setTimeout(() => { statusAudio.innerText = ""; }, 3000);

    } catch (error) {
        console.error("Error:", error);
        statusAudio.innerText = "❌ Error al enviar";
    }
}

// Botón enviar para cuando solo escriben texto
btnEnviar.onclick = () => enviarMensaje();

// --- 4. LEER EN TIEMPO REAL ---
const q = query(collection(db, "mensajes"), orderBy("fecha", "desc"));

onSnapshot(q, (snapshot) => {
    muro.innerHTML = ""; 
    snapshot.forEach((doc) => {
        const datos = doc.data();
        crearCard(datos.mensaje, datos.audioUrl, datos.invitado, datos.duracion);
    });
});

// Contador de letras
txtDeseo.oninput = () => {
    if(charCount) charCount.innerText = `${txtDeseo.value.length} / 200`;
};