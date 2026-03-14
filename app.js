class P2PHub {
    constructor() {
        this.peer = new Peer({ 
            host: '0.peerjs.com', 
            port: 443, 
            path: '/peerjs' 
        }); // PeerJS cloud gratis
        this.localStream = null;
        this.remoteVideo = document.getElementById('remoteVideo');
        this.init();
    }

    init() {
        const status = document.getElementById('status');
        
        this.peer.on('open', (id) => {
            document.getElementById('hostId').value = id;
            status.textContent = `✅ ID: ${id} | Copia para PC`;
        });

        // Llamadas entrantes (PC conectándose al celular)
        this.peer.on('call', (call) => {
            navigator.mediaDevices.getUserMedia({ video: true, audio: true })
                .then(stream => {
                    this.localStream = stream;
                    document.getElementById('localVideo').srcObject = stream;
                    call.answer(stream);
                    call.on('stream', (remoteStream) => {
                        this.remoteVideo.srcObject = remoteStream;
                        status.textContent += ' | PC conectada!';
                    });
                }).catch(err => {
                    status.textContent = '❌ Error cámara: ' + err.message;
                });
        });

        // Botones
        document.getElementById('mobileMode').onclick = () => this.setMode('mobile');
        document.getElementById('pcMode').onclick = () => this.setMode('pc');
        document.getElementById('startBtn').onclick = () => this.startStream();
        document.getElementById('connectBtn').onclick = () => this.connectToMobile();
    }

    setMode(mode) {
        const mobileControls = document.getElementById('mobileControls');
        const pcControls = document.getElementById('pcControls');
        document.querySelectorAll('.mode-btn').forEach(btn => btn.classList.remove('active'));
        event.target.classList.add('active');
        
        if (mode === 'mobile') {
            mobileControls.style.display = 'block';
            pcControls.style.display = 'none';
        } else {
            mobileControls.style.display = 'none';
            pcControls.style.display = 'block';
        }
    }

    startStream() {
        navigator.mediaDevices.getUserMedia({ video: true, audio: true })
            .then(stream => {
                this.localStream = stream;
                document.getElementById('localVideo').srcObject = stream;
                document.getElementById('status').textContent = '▶️ Stream activo. Esperando PC...';
            }).catch(err => {
                document.getElementById('status').textContent = '❌ Permite cámara/mic: ' + err.message;
            });
    }

    connectToMobile() {
        const id = document.getElementById('connectId').value.trim();
        if (!id) return alert('Ingresa ID del celular');
        
        const call = this.peer.call(id, this.localStream || new MediaStream());
        call.on('stream', (remoteStream) => {
            this.remoteVideo.srcObject = remoteStream;
            document.getElementById('status').textContent = '✅ Recibiendo video del celular';
        });
        call.on('error', (err) => {
            document.getElementById('status').textContent = '❌ Error conexión: ' + err.type;
        });
    }
}

new P2PHub();
