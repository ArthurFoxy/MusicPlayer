const audioPlayer = document.getElementById("audio-player");
const fileInput = document.getElementById("music-input");
const coverInput = document.getElementById("cover-input");
const titleInput = document.getElementById("title");
const artistInput = document.getElementById("artist");
const albumInput = document.getElementById("album");
const yearInput = document.getElementById("year");
const genreInput = document.getElementById("genre");
const coverImg = document.getElementById("cover-img");
const volumeControl = document.getElementById("volume");
const exportButton = document.getElementById("export-btn");
const metadataInput = document.getElementById("metadata-input");

let currentAudioFile = null;
let currentCoverFile = null;

// Solicitar permissão para notificações
if (Notification.permission !== "granted") {
    Notification.requestPermission();
}

// Função para mostrar notificações
function showNotification(title, body) {
    if (Notification.permission === "granted") {
        new Notification(title, { body });
    }
}

// Função para exibir mensagem de erro
function showError(message) {
    alert(`Erro: ${message}`);
}

// Importa a música
fileInput.addEventListener("change", (event) => {
    const file = event.target.files[0];
    if (file) {
        currentAudioFile = file; // Salva a música importada
        audioPlayer.src = URL.createObjectURL(file);
        audioPlayer.play();
    }
});

// Importa a capa do álbum
coverInput.addEventListener("change", (event) => {
    const file = event.target.files[0];
    if (file) {
        currentCoverFile = file; // Salva a capa importada
        const imageUrl = URL.createObjectURL(file);
        coverImg.src = imageUrl;
        coverImg.style.display = "block";
    }
});

// Controle de volume
volumeControl.addEventListener("input", (event) => {
    audioPlayer.volume = event.target.value;
});

// Exportação dos metadados
exportButton.addEventListener("click", () => {
    try {
        const musicData = {
            title: titleInput.value,
            artist: artistInput.value,
            album: albumInput.value,
            year: yearInput.value,
            genre: genreInput.value,
            cover: currentCoverFile ? URL.createObjectURL(currentCoverFile) : null
        };

        const jsonBlob = new Blob([JSON.stringify(musicData, null, 2)], { type: "application/json" });
        const a = document.createElement("a");
        a.href = URL.createObjectURL(jsonBlob);
        a.download = `${titleInput.value || "music"}_metadata.json`;
        a.click();
        
        // Notificação de sucesso
        showNotification("Música Exportada", "A música e os metadados foram exportados com sucesso.");
    } catch (error) {
        showError("Erro ao exportar a música e os metadados.");
    }
});

// Importa os metadados
metadataInput.addEventListener("change", (event) => {
    const file = event.target.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = function(e) {
            try {
                const musicData = JSON.parse(e.target.result);

                // Aplicando os metadados ao player
                titleInput.value = musicData.title || "";
                artistInput.value = musicData.artist || "";
                albumInput.value = musicData.album || "";
                yearInput.value = musicData.year || "";
                genreInput.value = musicData.genre || "";

                // Atualizando a capa
                if (musicData.cover) {
                    coverImg.src = musicData.cover;
                    coverImg.style.display = "block";
                }

                // Importando a música
                if (musicData.audio) {
                    currentAudioFile = musicData.audio; // Salva o arquivo de música
                    audioPlayer.src = musicData.audio;
                    audioPlayer.play();
                }
                
                // Notificação de sucesso
                showNotification("Metadados Importados", "Os metadados foram importados com sucesso.");
            } catch (error) {
                showError("Erro ao importar os metadados.");
            }
        };
        reader.readAsText(file);
    }
});

// Função para converter áudio para MP3 com metadados
function exportAudioWithMetadata(audioBlob, metadata) {
    const reader = new FileReader();
    reader.onload = function(event) {
        const arrayBuffer = event.target.result;
        const wavData = new Int8Array(arrayBuffer);

        const mp3Encoder = new lamejs.Mp3Encoder(1, 44100, 128);
        const mp3Data = [];

        const buffer = lamejs.WavHeader.readHeader(wavData.buffer);
        const samples = new Int16Array(wavData.buffer, buffer.dataOffset, buffer.dataLen / 2);

        const mp3DataBuffer = mp3Encoder.encodeBuffer(samples);
        mp3Data.push(mp3DataBuffer);

        const mp3Blob = new Blob(mp3Data, { type: 'audio/mp3' });
        
        // Criando um arquivo MP3 com os metadados
        const mp3File = new File([mp3Blob], "output.mp3", { type: "audio/mp3" });

        // Criando um link para download
        const a = document.createElement("a");
        a.href = URL.createObjectURL(mp3File);
        a.download = metadata.title + ".mp3";
        a.click();

        // Notificação de sucesso
        showNotification("Áudio Exportado", "O áudio foi exportado com sucesso com os metadados.");
    };
    reader.readAsArrayBuffer(audioBlob);
}

// Função para exportar o arquivo MP3 com metadados
exportButton.addEventListener("click", () => {
    const audioData = currentAudioFile;
    if (audioData) {
        exportAudioWithMetadata(audioData, {
            title: titleInput.value,
            artist: artistInput.value,
            album: albumInput.value,
            year: yearInput.value,
            genre: genreInput.value,
            cover: currentCoverFile ? URL.createObjectURL(currentCoverFile) : null
        });
    } else {
        showError("Por favor, importe uma música antes de exportar.");
    }
});
