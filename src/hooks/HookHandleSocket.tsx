import { useState, useCallback, useEffect } from 'react';

// Función para validar formato de la IP
const isValidIp = (ip: string) => {
  // Validar IP en el rango 192.168.x.x
  const ipRegex = /^(192\.168\.(1?\d{1,2}|2[0-4][0-9]|25[0-5]|[1-9]?\d)\.(1?\d{1,2}|2[0-4][0-9]|25[0-5]|[1-9]?\d))$/;
  return ipRegex.test(ip);
};

// Hook para manejar la conexión WebSocket
export const useWebSocketConnection = () => {
  const [ip, setIp] = useState(""); // IP actual
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [socket, setSocket] = useState<WebSocket | null>(null);

  // Función para conectar al WebSocket
  const connectWebSocket = useCallback((newIp: string) => {
    // Actualiza la IP antes de la conexión
    setIp(newIp);

    if (!isValidIp(newIp)) {
      setError("IP no válida, debe ser 192.168.x.x.");
      return;
    }

    setIsLoading(true);
    setError(null); // Limpiar error al intentar conectar

    const webSocketUrl = `ws://${newIp}:5000/ws`;
    const newSocket = new WebSocket(webSocketUrl);

    newSocket.addEventListener('open', () => {
      console.log('Conexión WebSocket establecida');
      setIsConnected(true);
      setError(null);
      setIsLoading(false);
    });

    newSocket.addEventListener('message', (event) => {
      console.log('Ms Server:', event.data);
    });

    newSocket.addEventListener('error', (event) => {
      console.error('Error en la conexión del WebSocket:', event);
      setError('Error de conexión, verifique la IP');
      resetConnectionValues();
    });

    newSocket.addEventListener('close', () => {
      console.log('Conexión WebSocket cerrada');
      resetConnectionValues();
    });

    setSocket(newSocket);
  }, []);

  // Restablecer todos los valores al estado inicial
  const resetConnectionValues = useCallback(() => {
    setIp("");
    setIsConnected(false);
    setIsLoading(false);
    setSocket(null);
  }, []);

  // Desconectar del WebSocket
  const disconnectWebSocket = useCallback(() => {
    if (socket) {
      socket.close();
      console.log('Conexión WebSocket cerrada manualmente');
    }
  }, [socket]);

  // Enviar comandos de movimiento de manera flexible
  const sendMovementData = (command: string) => {
    if (socket && socket.readyState === WebSocket.OPEN) {
      const data = { state: command };
      socket.send(JSON.stringify(data));
      console.log('Datos enviados a través de WebSocket:', JSON.stringify(data));
    } else {
      console.warn('Intento de envío fallido, WebSocket no está abierto');
      setError('No se puede enviar el comando, WebSocket no está conectado.');
    }
  };

  // Limpiar el socket al desmontar el componente
  useEffect(() => {
    return () => {
      disconnectWebSocket();
    };
  }, [disconnectWebSocket]);

  return {
    ip,
    setIp, // Permitir que el componente hijo actualice la IP
    isConnected,
    error,
    isLoading,
    connectWebSocket,
    disconnectWebSocket,
    sendMovementData,
  };
};
