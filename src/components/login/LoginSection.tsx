import { useState } from 'react';
import { SendButton } from '../Buttons'; // Suponiendo que SendButton ya está implementado
import { WebSocketController } from "../../../utils/WebSocketController"; // Asegúrate de tener esta clase en esta ruta

interface WebSocketLoginProps {
  onConnectionChange: (connected: boolean, controller: WebSocketController | null) => void; // Callback para manejar la conexión
}

export const WebSocketLogin: React.FC<WebSocketLoginProps> = ({ onConnectionChange }) => {
  const [ip, setIp] = useState(""); // URL del WebSocket
  const [error, setError] = useState(""); // Mensaje de error
  const [isLoading, setIsLoading] = useState(false); // Estado de carga
  const [useSecure, setUseSecure] = useState(false); // Para usar wss o ws

  // Maneja el cambio en el input de IP
  const handleUrlChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setIp(e.target.value);
  };

  // Maneja el cambio en el checkbox de conexión segura
  const handleSecureChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setUseSecure(e.target.checked);
  };

  const initiateConnection = (timeoutId:number) => {
    const newWsController = new WebSocketController(
      ip,
      (event) => {
        console.log('Mensaje recibido:', event.data);
      },
      (event) => {
        console.error('Error de WebSocket:', event);
        setError('Error en la conexión al WebSocket');
        clearTimeout(timeoutId);
        setIsLoading(false);
      },
      () => {
        console.log('Conexión cerrada');
        onConnectionChange(false, null);
        clearTimeout(timeoutId);
        setIsLoading(false);
      },
      () => {
        console.log('Conexión establecida');
        onConnectionChange(true, newWsController);
        clearTimeout(timeoutId);
        setIsLoading(false);
        setError('');
      },
      useSecure // Conexión segura o no
    );

    newWsController.connect();
  };

  const handleConnect = () => {
    if (!ip) {
      setError('Por favor, ingrese una dirección IP');
      return;
    }

    setIsLoading(true); // Comienza el estado de carga
    setError(''); // Reinicia el error antes de intentar la conexión

    const timeoutDuration = 10000; // Duración del tiempo de espera (en milisegundos)
    const timeoutId = setTimeout(() => {
      setIsLoading(false); // Finaliza el estado de carga
      setError('No se pudo conectar en el tiempo esperado'); // Muestra un mensaje de error
    },timeoutDuration) as unknown as number;

    try {
      initiateConnection(timeoutId);
    } catch (err) {
      console.error('Error al intentar conectar:', err);
      setError('URL inválida');
      setIsLoading(false);
      clearTimeout(timeoutId);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center w-full h-full p-4 bg-gray-100">
      <h1 className="text-3xl font-bold mb-6 text-yellow-900">Conectar a WebSocket</h1>
      <input
        type="text"
        placeholder="Ingrese la dirección IP"
        value={ip}
        onChange={handleUrlChange}
        className="border border-yellow-600 p-2 mb-4 w-full max-w-md text-center rounded shadow-sm focus:outline-none focus:ring-2 focus:ring-yellow-600"
      />
      <div className="mb-4">
        <label className="flex items-center">
          <input
            type="checkbox"
            checked={useSecure}
            onChange={handleSecureChange}
            className="mr-2"
          />
          Usar conexión segura (wss://)
        </label>
      </div>
      <SendButton
        text="Conectar"
        handleConnectClick={handleConnect}
        extraClassName="w-full max-w-md bg-yellow-600 text-white px-4 py-2 rounded hover:bg-yellow-900 transition duration-300"
        isLoading={isLoading}
      />
      {error && <p className="text-red-500 mt-4">{error}</p>}
    </div>
  );
};
