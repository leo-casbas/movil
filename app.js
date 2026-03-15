class P2PHub {
    constructor() {
        this.peer = null;
        this.localStream = null;
        this.init();
    }

    init() {
        const status = document.getElementById('status');
        status.textContent = '🔄 Iniciando peer...';
        
        const customId = document.getElementById('customId').value || 'MIVIDEO';
        
        // SIN TURN - solo STUN básico
        this.peer = new Peer(customId, {
            host: '0.peerjs.com',
            port: 443,
            path: '/peerjs',
            debug: 2  // Logs detallados
        });

        // Evento open ANTES de todo
        this.peer.on('open', (id) => {
            console.log('✅ Peer listo:', id);
            status.textContent = `✅ ID: ${id}`;
            status.style.background = '#e8f5e8';
            this.updateObsUrl(id);
            
            // Ahora sí escucha llamadas
            this.setupCallHandler();
        });

        this.peer.on('error', (err) => {
            console.error('Peer error:', err);
            if (err.type === 'unavailable-id') {
                status.textContent = '❌ ID OCUPADO. Cambia el ID';
            } else if (err.type === 'network') {
                status.textContent = '❌ Sin internet';
            } else {
                status.textContent = `❌ ${err.type}`;
            }
        });

        // Botones
        document.getElementById('startBtn').onclick = () => this.startStream();
        document.getElementById('connectBtn').onclick = () => this.connectToMobile();
        document.getElementById('customId').oninput = (e) => {
            if (this.peer) {
                this.peer.destroy();
                this.init();
            }
        };
    }

    setupCallHandler() {
        this.peer.on('call', (call) => {
            console.log('📱 Llamada desde PC');
            navigator.mediaDevices.getUserMedia({ 
                video: true, 
                audio: true 
            }).then(stream => {
                this.localStream = stream;
                document.getElementById('localVideo').srcObject = stream;
                call.answer(stream);  // RESPONDE inmediatamente
                
                call.on('stream', (remoteStream) => {
                    document.getElementById('remoteVideo').srcObject = remoteStream;
                    document.getElementById('status').textContent += ' | PC OK';
                });
            }).catch(err => console.error('Cámara:', err));
        });
    }

    updateObsUrl(id) {
        const obsUrl = `${window.location.origin}${window.location.pathname}obs.html?id=${id}`;
        document.getElementById('obsUrl').value = obsUrl;
    }

    startStream() {
        document.getElementById('status').textContent = '✅ Listo para recibir llamadas';
    }

    connectToMobile() {
        const id = document.getElementById('connectId').value;
        const call = this.peer.call(id, new MediaStream());
        call.on('stream', (remoteStream) => {
            document.getElementById('remoteVideo').srcObject = remoteStream;
        });
    }
}

function copyObsUrl() {
    navigator.clipboard.writeText(document.getElementById('obsUrl').value);
    alert('✅ Copiada');
}

new P2PHub();
