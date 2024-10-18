import React, { useState } from 'react';
import { useWebSocketConnection } from "../../hooks/HookHandleSocket";
import { SendButton } from '../Buttons';

export const WebSocketLogin = () => {
  const [inputIp, setInputIp] = useState(""); // Estado para la IP temporal

  const {
    setIp,
    setUseSecure,  // Añadimos setUseSecure aquí
    error,
    isLoading,
    connectWebSocket,
  } = useWebSocketConnection(); 

  const handleConnect = () => {
    if (inputIp.trim() === "") {
      alert("Por favor, ingresa una dirección IP válida.");
      return;
    }

    setIp(inputIp); // Actualiza la IP en el estado global
    connectWebSocket(); // Conecta con la IP y el protocolo establecidos
  };

  const handleUrlChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInputIp(e.target.value); // Actualiza la IP temporal
  };

  const handleSecureChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setUseSecure(e.target.checked); // Actualiza el estado de useSecure
  };

  return (
    <div className="flex flex-col items-center justify-center w-full h-full p-4 bg-gray-100">
      <h1 className="text-3xl font-bold mb-6 text-yellow-900">Conectar a WebSocket</h1>
      <input
        type="text"
        placeholder="Ingrese la dirección IP"
        value={inputIp}
        onChange={handleUrlChange}
        className="border border-yellow-600 p-2 mb-4 w-full max-w-md text-center rounded shadow-sm focus:outline-none focus:ring-2 focus:ring-yellow-600"
      />
      <div className="mb-4">
        <label className="flex items-center">
          <input
            type="checkbox"
            onChange={handleSecureChange} // Añadimos el evento para el checkbox
            className="mr-2"
          />
          Conexión segura (wss)
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
