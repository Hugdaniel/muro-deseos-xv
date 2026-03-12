// Verificación de seguridad al cargar la página
window.onload = () => {
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        console.warn("⚠️ El navegador está bloqueando el micrófono por falta de HTTPS o soporte.");
        statusAudio.innerHTML = "<small style='color:orange'>Usa HTTPS para activar el micrófono 🔒</small>";
    }
};

let mediaRecorder;
let fragmentosAudio = [];
let audioURL = null;

// Referencias al DOM
const btnGrabar = document.getElementById('btnGrabar');
const btnEnviar = document.getElementById('btnEnviar');
const muro = document.getElementById('muro');
const txtDeseo = document.getElementById('textoDeseo');
const statusAudio = document.getElementById('statusAudio');

// Función para iniciar la grabación
async function iniciarGrabacion() {
    try {
        // Pedimos el audio de la forma más básica posible para evitar errores de hardware
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        
        // Verificamos qué formato soporta el dispositivo (WebM para Android/PC, MP4 para iOS)
        const tipo = MediaRecorder.isTypeSupported('audio/webm') ? 'audio/webm' : 'audio/mp4';
        
        mediaRecorder = new MediaRecorder(stream, { mimeType: tipo });
        fragmentosAudio = [];

        mediaRecorder.ondataavailable = (e) => {
            if (e.data.size > 0) fragmentosAudio.push(e.data);
        };

        mediaRecorder.onstop = () => {
            const blob = new Blob(fragmentosAudio, { type: tipo });
            audioURL = URL.createObjectURL(blob);
            statusAudio.innerText = "✅ Audio listo";
            stream.getTracks().forEach(track => track.stop());
        };

        mediaRecorder.start();
        btnGrabar.classList.add('grabando');
        statusAudio.innerText = "Grabando...";

    } catch (error) {
        console.error("Error crítico:", error);
        
        // Mensajes de ayuda según el error
        if (error.name === 'NotAllowedError' || error.name === 'PermissionDeniedError') {
            alert("⚠️ Permiso denegado. Toca el candado en la barra de direcciones y activa el micrófono.");
        } else if (error.name === 'NotFoundError') {
            alert("⚠️ No se detecta ningún micrófono conectado.");
        } else {
            alert("Error: " + error.message);
        }
    }
}

// Evento del botón Grabar
btnGrabar.onclick = () => {
    if (!mediaRecorder || mediaRecorder.state === "inactive") {
        iniciarGrabacion();
    } else {
        mediaRecorder.stop();
        btnGrabar.classList.remove('grabando');
    }
};

// Evento Enviar
btnEnviar.onclick = () => {
    const texto = txtDeseo.value.trim();
    if (texto === "" && !audioURL) return;

    crearCard(texto, audioURL);

    // Resetear todo
    txtDeseo.value = "";
    audioURL = null;
    statusAudio.innerText = "";
};


// Función para crear una card con el deseo y el audio
function crearCard(texto, audio) {
    const card = document.createElement('div');
    card.className = 'card-deseo';
    
    const rot = (Math.random() * 4 - 2).toFixed(2);
    card.style.setProperty('--rotacion', `${rot}deg`);
    card.style.transform = `rotate(${rot}deg)`;

    const hora = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    let contenidoHTML = "";
    
    if (texto) {
        contenidoHTML += `<p>${texto}</p>`;
    }
    
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