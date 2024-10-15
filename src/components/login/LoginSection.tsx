import { useState } from 'react';
import { SendButton } from '../Buttons'; // Suponiendo que SendButton ya está implementado
import { WebSocketController } from "../../../utils/WebSocketController"; // Asegúrate de tener esta clase en esta ruta

interface WebSocketLoginProps {
  onConnectionChange: (connected: boolean, controller: WebSocketController | null) => void; // Callback para manejar la conexión
}

export const WebSocketLogin: React.FC<WebSocketLoginProps> = ({ onConnectionChange }) => {
  const [url, setUrl] = useState(''); // URL del WebSocket
  const [error, setError] = useState(''); // Mensaje de error
  const [isLoading, setIsLoading] = useState(false); // Estado de carga

  // Maneja el cambio en el input
  const handleUrlChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setUrl(e.target.value);
  };

  const handleConnect = () => {
    if (!url) {
      setError('Por favor, ingrese una URL');
      return;
    }

    setIsLoading(true); // Comienza el estado de carga
    setError(''); // Reinicia el error antes de intentar la conexión

    const timeoutDuration = 10000; // Duración del tiempo de espera (en milisegundos)
    const timeoutId = setTimeout(() => {
      setIsLoading(false); // Finaliza el estado de carga
      setError('No se pudo conectar en el tiempo esperado'); // Muestra un mensaje de error
    }, timeoutDuration);

    try {
      const newWsController = new WebSocketController(
        url,
        (event) => {
          console.log('Mensaje recibido:', event.data);
        },
        (event) => {
          console.error('Error de WebSocket:', event);
          setError('Error en la conexión al WebSocket'); // Mensaje de error
          clearTimeout(timeoutId); // Cancela el timeout
          setIsLoading(false); // Finaliza el estado de carga
        },
        () => {
          console.log('Conexión cerrada');
          onConnectionChange(false, null); // Notifica desconexión
          clearTimeout(timeoutId); // Cancela el timeout
          setIsLoading(false); // Finaliza el estado de carga
        },
        () => {
          console.log('Conexión establecida');
          onConnectionChange(true, newWsController); // Notifica conexión exitosa
          clearTimeout(timeoutId); // Cancela el timeout
          setIsLoading(false); // Finaliza el estado de carga
          setError(''); // Reinicia el error cuando se conecta correctamente
        }
      );

      // Conecta al WebSocket
      newWsController.connect();
    } catch (err) {
      console.error('Error al intentar conectar:', err); // Registra el error en la consola
      setError('URL inválida'); // Muestra un mensaje de error si la URL es incorrecta
      setIsLoading(false); // Finaliza el estado de carga
      clearTimeout(timeoutId); // Cancela el timeout
    }
  };

  return (
    <div className="flex flex-col items-center justify-center w-full h-full p-4 bg-gray-100">
      <h1 className="text-3xl font-bold mb-6 text-yellow-900">Conectar a WebSocket</h1>
      <input
        type="text"
        placeholder="Ingrese la URL del WebSocket"
        value={url}
        onChange={handleUrlChange}
        className="border border-yellow-600 p-2 mb-4 w-full max-w-md text-center rounded shadow-sm focus:outline-none focus:ring-2 focus:ring-yellow-600"
      />
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
