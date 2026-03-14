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
let audioTimeout;

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
            clearTimeout(audioTimeout);
            const blob = new Blob(fragmentosAudio, { type: tipo });
            audioURL = URL.createObjectURL(blob);
            statusAudio.innerText = "✅ Audio listo";
            stream.getTracks().forEach(track => track.stop());
            btnGrabar.classList.remove('grabando');
        };

        mediaRecorder.start();
        btnGrabar.classList.add('grabando');
        statusAudio.innerText = "Grabando...(max.30s)";
        statusAudio.style.color = "#ff85a2";

        // Detener automáticamente después de 30 segundos
        audioTimeout = setTimeout(() => {
            if (mediaRecorder.state === "recording") {
                mediaRecorder.stop();
                alert("⏰ Tiempo máximo de grabación alcanzado. El audio se ha guardado.");
            }
        }, 30000);

    } catch (error) {
        console.error("Error crítico:", error);
        alert("⚠️ No se pudo acceder al micrófono. Revisa los permisos y el hardware.");
        
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
// ... (Tus variables globales de mediaRecorder y audioURL siguen igual arriba)

// 1. LA FUNCIÓN CREARCARD (Modificada para recibir el nombre)
function crearCard(texto, audio, nombre = "Anónimo") {
    const card = document.createElement('div');
    card.className = 'card-deseo';
    
    // Si quitaste la inclinación, esto puede no estar o estar en 0
    // const rot = (Math.random() * 2 - 1).toFixed(2);
    // card.style.transform = `rotate(${rot}deg)`;

    const hora = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    // AQUÍ CONSTRUIMOS EL CONTENIDO: Primero el nombre, después el resto
    let contenidoHTML = `<strong style="color: #ffffff; display: block; margin-bottom: 5px; font-size: 0.9rem;">${nombre}</strong>`;
    
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
    
    const muro = document.getElementById('muro');
    muro.prepend(card);
}

// 2. LA LÓGICA DEL BOTÓN ENVIAR
btnEnviar.onclick = () => {
    const texto = txtDeseo.value.trim();
    
    // CAPTURAMOS EL NOMBRE (Asegúrate de tener el input con id="nombreInvitado" en el HTML)
    const inputNombre = document.getElementById('nombreInvitado');
    const nombre = inputNombre.value.trim() || "Anónimo"; 
    
    if (texto === "" && !audioURL) {
        alert("Escribe un mensaje o graba un audio.");
        return;
    }

    // PASAMOS EL NOMBRE A LA FUNCIÓN
    crearCard(texto, audioURL, nombre);
    
    // LIMPIAMOS TODO
    txtDeseo.value = "";
    inputNombre.value = ""; // También limpiamos el nombre para el siguiente
    audioURL = null;
    statusAudio.innerText = "";
    charCount.innerText = "0 / 200"; // Reseteamos el contador si lo pusiste
};



// Contador de caracteres en el textarea
const charCount = document.getElementById('charCount');

txtDeseo.oninput = () => {
    const currentLength = txtDeseo.value.length;
    charCount.innerText = `${currentLength} / 200`;
    
    // Cambiar color si llega al límite
    charCount.style.color = currentLength >= 200 ? "#777777" : "rgba(255,255,255,0.4)";
};