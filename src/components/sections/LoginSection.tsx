import React, { useState, useEffect } from 'react';
import { SendButton } from '../Buttons';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

interface WebSocketProps {
  connectWebSocket: (newIp: string) => void;
  isLoading: boolean;
  isConnected: boolean;
  error: string | null;
}

export const WebSocketLogin = ({
  error,
  isLoading,
  connectWebSocket,
  isConnected,
}: WebSocketProps) => {
  const [inputIp, setInputIp] = useState("192.168."); // Estado para la IP temporal

  const handleConnect = () => {
    if (inputIp.trim() === "") {
      toast.error("Por favor, ingresa una dirección IP válida.");
      return;
    }
    connectWebSocket(inputIp); // Conecta con la IP y el protocolo establecidos
  };

  const handleUrlChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInputIp(e.target.value); // Actualiza la IP temporal
  };

  // Efecto para manejar las notificaciones de éxito o fallo en la conexión
  useEffect(() => {
   if (!isConnected) {
      toast.error("La conexión se ha perdido...");
    }
  }, [isConnected]);

  useEffect(()=> {
    if(error){
      toast.error(error);
    }
  },[error]);

  return (
    <div className="flex flex-col items-center justify-center w-full h-full p-4 bg-gray-100">
      <ToastContainer />
      <h1 className="text-3xl font-bold mb-6 text-yellow-900">Conectar a WebSocket</h1>
      <input
        type="text"
        placeholder="Ingrese la dirección IP"
        value={inputIp}
        onChange={handleUrlChange}
        className="border border-yellow-600 p-3 mb-4 w-full max-w-md text-center rounded shadow-sm focus:outline-none focus:ring-2 focus:ring-yellow-600"
      />
      <SendButton
        text="Conectar"
        handleConnectClick={handleConnect}
        extraClassName="w-full max-w-md bg-yellow-600 text-white px-4 py-3 rounded hover:bg-yellow-900 transition duration-300"
        isLoading={isLoading}
      />
    </div>
  );
};
