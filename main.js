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
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        mediaRecorder = new MediaRecorder(stream);
        fragmentosAudio = [];

        mediaRecorder.ondataavailable = (e) => {
            if (e.data.size > 0) fragmentosAudio.push(e.data);
        };

        mediaRecorder.onstop = () => {
            const blob = new Blob(fragmentosAudio, { type: 'audio/mp3' });
            audioURL = URL.createObjectURL(blob);
            statusAudio.innerText = "✅ Audio listo";
            // Detenemos el micro para que se apague la luz/icono de grabación
            stream.getTracks().forEach(track => track.stop());
        };

        mediaRecorder.start();
        btnGrabar.classList.add('grabando');
        statusAudio.innerText = "Graba ahora...";
    } catch (error) {
        console.error("Error al acceder al mic:", error);
        alert("No se pudo activar el micrófono. Revisa los permisos del navegador.");
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

function crearCard(texto, audio) {
    const card = document.createElement('div');
    card.className = 'card-deseo';
    const rot = (Math.random() * 4 - 2).toFixed(2);
    card.style.setProperty('--rotacion', `${rot}deg`);
    card.style.transform = `rotate(${rot}deg)`;

    let contenidoHTML = "";
    if (texto) contenidoHTML += `<p>${texto}</p>`;
    if (audio) {
        contenidoHTML += `<div class="audio-container">
                            <audio src="${audio}" controls></audio>
                          </div>`;
    }
    
    card.innerHTML = contenidoHTML;
    muro.prepend(card);
}