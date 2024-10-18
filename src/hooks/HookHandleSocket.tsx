import { useState, useCallback, useEffect } from 'react';

// Comandos de movimiento
export const movementCommands = {
  FORWARD: "FORWARD",
  BACKWARD: "BACKWARD",
  STOP: "STOP",
  LEFT: "LEFT",
  RIGHT: "RIGHT",
  LIGHT_ON: "LIGHT_ON",
  LIGHT_OFF: "LIGHT_OFF",
};

// Hook para manejar la conexión WebSocket
export const useWebSocketConnection = () => {
  const [ip, setIp] = useState("");
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [socket, setSocket] = useState<WebSocket | null>(null);
  const [useSecure, setUseSecure] = useState(false); // Nuevo estado para definir si la conexión es segura

  // Conectar al WebSocket
  const connectWebSocket = useCallback(() => {
    setIsLoading(true);
    setError(null); // Limpiar error al intentar conectar

    // Determina si usar ws o wss según el estado `useSecure`
    const protocol = useSecure ? 'wss' : 'ws';
    // Construir la URL del WebSocket
    const webSocketUrl = `${protocol}://${ip}/ws`; // Crear la URL del WebSocket
    const newSocket = new WebSocket(webSocketUrl);

    newSocket.addEventListener('open', () => {
      console.log('Conexión WebSocket establecida');
      setIsConnected(true);
      setError(null);
      setIsLoading(false);
    });

    newSocket.addEventListener('message', (event) => {
      console.log('Mensaje recibido:', event.data);
    });

    newSocket.addEventListener('error', (event) => {
      console.error('Error en la conexión del WebSocket:', event);
      setError('Error de conexión');
      setIsConnected(false);
      setIsLoading(false);
    });

    newSocket.addEventListener('close', () => {
      console.log('Conexión WebSocket cerrada');
      setIsConnected(false);
    });

    setSocket(newSocket);
  }, [ip, useSecure]); // Agrega `useSecure` como dependencia

  // Desconectar del WebSocket
  const disconnectWebSocket = useCallback(() => {
    if (socket) {
      socket.close();
      setSocket(null);
    }
  }, [socket]);

  // Enviar comandos de movimiento
  const sendMovementData = (command: keyof typeof movementCommands) => {
    if (socket && socket.readyState === WebSocket.OPEN) {
      const data = { state: movementCommands[command] };
      socket.send(JSON.stringify(data));
      console.log('Datos enviados a través de WebSocket:', JSON.stringify(data));
    } else {
      console.warn('Intento de envío fallido, WebSocket no está abierto');
    }
  };

  // Limpiar la conexión al desmontar el hook
  useEffect(() => {
    return () => {
      disconnectWebSocket();
    };
  }, [disconnectWebSocket]);

  return {
    ip,
    setIp,
    useSecure,
    setUseSecure, // Agrega el setter para cambiar el estado de la conexión segura
    isConnected,
    error,
    isLoading,
    connectWebSocket,
    disconnectWebSocket,
    sendMovementData,
    movementCommands,
  };
};
