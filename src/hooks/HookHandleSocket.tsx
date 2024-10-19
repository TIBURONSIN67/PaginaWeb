import { useState, useCallback} from 'react';

// Función para validar formato de la IP
const isValidIp = (ip: string) => {
  const ipRegex = /^(192\.168\.\d{1,3}\.\d{1,3})$/;
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
      setError("La IP ingresada no es válida. Debe ser una IP en el rango 192.168.x.x.");
      return;
    }

    setIsLoading(true);
    setError(null); // Limpiar error al intentar conectar

    const webSocketUrl = `ws://${newIp}/ws`;
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
      resetConnection(); // Restablecer el estado inicial
    });

    newSocket.addEventListener('close', () => {
      console.log('Conexión WebSocket cerrada');
      setIsConnected(false);
      setIsLoading(false);
      resetConnection(); // Restablecer el estado inicial
    });

    setSocket(newSocket);
  }, []);

  // Restablecer todos los valores al estado inicial
  const resetConnection = useCallback(() => {
    setIp("");
    setIsConnected(false);
    setError(null);
    setIsLoading(false);
    setSocket(null);
  }, []);

  // Desconectar del WebSocket
  const disconnectWebSocket = useCallback(() => {
    if (socket) {
      socket.close();
      setSocket(null);
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

  return {
    ip,
    setIp, // Permitir que el componente hijo actualice la IP
    isConnected,
    error,
    isLoading,
    connectWebSocket, // Función para conectar manualmente
    disconnectWebSocket,
    sendMovementData,
    resetConnection, // Restablecer manualmente si se necesita
  };
};
