export class WebSocketController {
    private url: string;
    private socket: WebSocket | null = null;
    private onMessage: (event: MessageEvent) => void;
    private onError: (event: Event) => void;
    private onClose: () => void;
    private onOpen: (() => void) | null = null; // Agregar onOpen

    constructor(
        url: string, 
        onMessage: (event: MessageEvent) => void, 
        onError: (event: Event) => void, 
        onClose: () => void,
        onOpen?: () => void,
        useSecure: boolean = false // Nueva opción para conexiones seguras
    ) {
        this.url = `${useSecure ? 'wss' : 'ws'}://${url}/ws`; // Usar 'wss' si es seguro
        this.onMessage = onMessage;
        this.onError = onError;
        this.onClose = onClose;
        if (onOpen) {
            this.onOpen = onOpen;
        }
    }
    

    connect() {
        this.socket = new WebSocket(this.url);
        this.socket.addEventListener('open', this.handleOpen.bind(this)); // Escuchar el evento 'open'
        this.socket.addEventListener('message', this.onMessage);
        this.socket.addEventListener('error', this.onError);
        this.socket.addEventListener('close', this.onClose);
    }

    private handleOpen() {
        console.log('Conexión WebSocket establecida');
        if (this.onOpen) {
            this.onOpen(); // Ejecutar callback onOpen si está disponible
        }
    }

    
    send(data: object) {
        if (this.socket && this.socket.readyState === WebSocket.OPEN) {
            this.socket.send(JSON.stringify(data));
            console.log('Datos enviados a través de WebSocket:', JSON.stringify(data));
        } else {
            console.error('No se puede enviar: conexión no abierta');
        }
    }

    disconnect() {
        if (this.socket) {
            this.socket.close();
        }
    }
}
