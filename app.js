class P2PHub {
    constructor() {
        this.localStream = null;
        this.remoteVideo = document.getElementById('remoteVideo');
        this.initPeer();
    }

    async initPeer() {
        const status = document.getElementById('status');
        status.textContent = '🔄 Conectando con PeerJS cloud...';

        // Configuración con timeout y reintentos
        const peerConfig = {
            host: '0.peerjs.com',
            port: 443,
            path: '/peerjs',
            config: {
                iceServers: [
                    { urls: 'stun:stun.l.google.com:19302' },
                    { urls: 'stun:stun1.l.google.com:19302' }
                ]
            }
        };

        // Espera el ID con timeout de 10s
        const getPeerId = () => new Promise((resolve, reject) => {
            const peer = new Peer(peerConfig);
            
            peer.on('open', (id) => {
                console.log('✅ Peer ID generado:', id);
                resolve({ peer, id });
            });

            peer.on('error', (err) => {
                console.error('❌ PeerJS error:', err);
                status.textContent = `❌ Error PeerJS: ${err.type || err.message}`;
                reject(err);
            });

            // Timeout 10s
            setTimeout(() => {
                peer.destroy();
                reject(new Error('Timeout conexión PeerJS'));
            }, 10000);
        });

        try {
            const { peer, id } = await getPeerId();
            this.peer = peer;
            document.getElementById('hostId').value = id;
            status.textContent = `✅ ID: ${id} | Listo para PC`;
            status.style.background = '#e8f5e8';

            // Llamadas entrantes
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

        } catch (err) {
            status.textContent = '❌ No se pudo conectar con PeerJS. Revisa internet/firewall.';
            console.error('Init error:', err);
        }
    }

    setMode(mode) {
        document.querySelectorAll('.mode-btn').forEach(btn => btn.classList.remove('active'));
        event.target.classList.add('active');
        
        document.getElementById('mobileControls').style.display = mode === 'mobile' ? 'block' : 'none';
        document.getElementById('pcControls').style.display = mode === 'pc' ? 'block' : 'none';
    }

    startStream() {
        if (!this.peer) return alert('Esperá a que aparezca el ID primero');
        
        navigator.mediaDevices.getUserMedia({ 
            video: { width: 640, height: 480 }, 
            audio: true 
        }).then(stream => {
            this.localStream = stream;
            document.getElementById('localVideo').srcObject = stream;
            document.getElementById('status').textContent = '▶️ Stream activo. ID lista para PC...';
        }).catch(err => {
            document.getElementById('status').textContent = '❌ Permite cámara/mic: ' + err.message;
        });
    }

    connectToMobile() {
        if (!this.peer) return alert('Esperá a conectar primero');
        const id = document.getElementById('connectId').value.trim();
        if (!id) return alert('Ingresa ID del celular');

        // Dummy stream para permisos
        navigator.mediaDevices.getUserMedia({ video: false, audio: false })
            .then(() => {
                const call = this.peer.call(id, new MediaStream());
                call.on('stream', (remoteStream) => {
                    this.remoteVideo.srcObject = remoteStream;
                    document.getElementById('status').textContent = '✅ Viendo celular!';
                });
                call.on('error', (err) => {
                    document.getElementById('status').textContent = '❌ No encontró celular: ' + err.type;
                });
            }).catch(err => {
                document.getElementById('status').textContent = '❌ Error permisos: ' + err.message;
            });
    }
}

// Inicializar cuando carga
window.addEventListener('load', () => {
    new P2PHub();
    
    // Botones
    document.getElementById('mobileMode').onclick = () => new P2PHub().setMode('mobile');
    document.getElementById('pcMode').onclick = () => new P2PHub().setMode('pc');
    document.getElementById('startBtn').onclick = () => new P2PHub().startStream();
    document.getElementById('connectBtn').onclick = () => new P2PHub().connectToMobile();
});
