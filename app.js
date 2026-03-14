class P2PHub {
    constructor() {
        this.peer = null;
        this.localStream = null;
        this.init();
    }

    init() {
        const status = document.getElementById('status');
        
        // ID fijo para celular
        const customId = document.getElementById('customId').value || 'MIVIDEO';
        
        this.peer = new Peer(customId, {
            host: '0.peerjs.com',
            port: 443,
            path: '/peerjs',
            config: {
                iceServers: [
                    { urls: 'stun:stun.l.google.com:19302' },
                    { urls: 'stun:stun1.l.google.com:19302' }
                ]
            }
        });

        this.peer.on('open', (id) => {
            status.textContent = `✅ ID activo: ${id}`;
            this.updateObsUrl(id);
        });

        this.peer.on('error', (err) => {
            document.getElementById('status').textContent = `❌ Error: ${err.type}`;
        });

        // Llamadas entrantes (desde PC/OBS)
        this.peer.on('call', (call) => {
            navigator.mediaDevices.getUserMedia({ video: true, audio: true })
                .then(stream => {
                    this.localStream = stream;
                    document.getElementById('localVideo').srcObject = stream;
                    call.answer(stream);
                    status.textContent += ' | Conectado!';
                }).catch(err => {
                    status.textContent = '❌ Cámara: ' + err.message;
                });
        });

        // Botones
        document.getElementById('mobileMode').onclick = () => this.setMode('mobile');
        document.getElementById('pcMode').onclick = () => this.setMode('pc');
        document.getElementById('startBtn').onclick = () => this.startStream();
        document.getElementById('connectBtn').onclick = () => this.connectToMobile();
        document.getElementById('customId').oninput = () => this.updateObsUrl(this.peer?.id);
    }

    setMode(mode) {
        document.querySelectorAll('.mode-btn').forEach(btn => btn.classList.remove('active'));
        event.target.classList.add('active');
        document.getElementById('mobileControls').style.display = mode === 'mobile' ? 'block' : 'none';
        document.getElementById('pcControls').style.display = mode === 'pc' ? 'block' : 'none';
    }

    updateObsUrl(id) {
        const baseUrl = window.location.origin + window.location.pathname;
        const obsUrl = `${baseUrl}obs.html?id=${id}`;
        document.getElementById('obsUrl').value = obsUrl;
    }

    startStream() {
        navigator.mediaDevices.getUserMedia({ video: { width: 1280, height: 720 }, audio: true })
            .then(stream => {
                this.localStream = stream;
                document.getElementById('localVideo').srcObject = stream;
                document.getElementById('status').textContent = '▶️ Transmitiendo...';
            }).catch(err => {
                alert('Permite cámara/mic: ' + err.message);
            });
    }

    connectToMobile() {
        const id = document.getElementById('connectId').value;
        const call = this.peer.call(id, new MediaStream());
        call.on('stream', (remoteStream) => {
            document.getElementById('remoteVideo').srcObject = remoteStream;
            document.getElementById('status').textContent = '✅ Recibiendo...';
        });
    }
}

// Copiar URL OBS
function copyObsUrl() {
    const obsUrl = document.getElementById('obsUrl');
    obsUrl.select();
    document.execCommand('copy');
    alert('URL copiada para OBS');
}

new P2PHub();
