class P2PHub {
    constructor() {
        this.peer = null;
        this.localStream = null;
        this.init();
    }

    init() {
        const status = document.getElementById('status');
        const customId = document.getElementById('customId').value || 'MIVIDEO';
        
        // TURN servers GRATIS para NAT traversal
        const peerConfig = {
            host: '0.peerjs.com',
            port: 443,
            path: '/peerjs',
            config: {
                iceServers: [
                    { urls: 'stun:stun.l.google.com:19302' },
                    { urls: 'stun:stun1.l.google.com:19302' },
                    // TURN público gratuito
                    { 
                        urls: 'turn:turn.numb.viagenie.ca',
                        username: 'lucaslopezrp@gmail.com',
                        credential: 'moilegr1989@'
                    }
                ]
            }
        };

        this.peer = new Peer(customId, peerConfig);

        this.peer.on('open', (id) => {
            console.log('✅ Peer OK:', id);
            status.textContent = `✅ ID: ${id} | TURN activo`;
            this.updateObsUrl(id);
        });

        this.peer.on('disconnected', () => {
            console.log('🔄 Reconnecting...');
            status.textContent = '🔄 Reconectando...';
            setTimeout(() => this.peer.reconnect(), 1000);
        });

        this.peer.on('error', (err) => {
            console.error('Error:', err);
            if (err.type === 'unavailable-id') {
                status.textContent = '❌ ID ocupado. Cambia ID';
            } else {
                status.textContent = `❌ ${err.type}`;
            }
        });

        // IMPORTANTE: Llamadas entrantes SOLO después de open
        this.peer.on('open', () => {
            this.peer.on('call', (call) => {
                console.log('📞 Llamada recibida');
                navigator.mediaDevices.getUserMedia({ 
                    video: { width: { ideal: 1280 }, height: { ideal: 720 } }, 
                    audio: true 
                }).then(stream => {
                    this.localStream = stream;
                    document.getElementById('localVideo').srcObject = stream;
                    call.answer(stream);
                    call.on('stream', (remoteStream) => {
                        document.getElementById('remoteVideo').srcObject = remoteStream;
                        status.textContent += ' | PC conectada!';
                    });
                    call.on('iceConnectionStateChange', (state) => {
                        console.log('ICE state:', state);
                    });
                }).catch(err => {
                    console.error('getUserMedia error:', err);
                });
            });
        });

        // Botones
        document.getElementById('startBtn').onclick = () => this.startStream();
        document.getElementById('connectBtn').onclick = () => this.connectToMobile();
        document.getElementById('customId').oninput = () => {
            if (this.peer) this.peer.destroy();
            this.init();
        };
    }

    updateObsUrl(id) {
        const obsUrl = `${window.location.origin}${window.location.pathname}obs.html?id=${id}`;
        document.getElementById('obsUrl').value = obsUrl;
    }

    startStream() {
        // Solo activa permisos, no necesita stream local para responder
        navigator.mediaDevices.getUserMedia({ video: true, audio: true })
            .then(stream => {
                this.localStream = stream;
                document.getElementById('localVideo').srcObject = stream;
                document.getElementById('status').textContent = '✅ Listo para OBS/PC';
            }).catch(err => {
                console.error(err);
            });
    }

    connectToMobile() {
        const id = document.getElementById('connectId').value;
        navigator.mediaDevices.getUserMedia({video: false, audio: false})
            .then(() => {
                const call = this.peer.call(id, new MediaStream());
                call.on('stream', (remoteStream) => {
                    document.getElementById('remoteVideo').srcObject = remoteStream;
                });
            });
    }
}

function copyObsUrl() {
    navigator.clipboard.writeText(document.getElementById('obsUrl').value);
    alert('✅ URL copiada');
}

new P2PHub();
