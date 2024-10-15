import { useState, useEffect } from "react";
import { GameModeSelection } from "./components/GameModeSelection";
import { MainMenu } from "./components/MainMenu";
import { SettingsPage } from "./components/SettingsPage";
import { ControlModePage } from "./components/control/ControlModePage";
import { GyroModePage } from "./components/gyro/GyroModePage";
import { LoginModePage } from "./components/login/LoginModePage";
import { WebSocketController } from "../utils/WebSocketController";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

// Definición de una interface para las páginas
interface PageInterface {
  name: string;
}

// Definición de las páginas disponibles
const pages: PageInterface[] = [
  { name: "mainMenu" },
  { name: "gameModeSelection" },
  { name: "settings" },
  { name: "controlMode" },
  { name: "gyroMode" },
];

function App() {
  const [isPortrait, setIsPortrait] = useState(false);
  const [currentPage, setCurrentPage] = useState<PageInterface>(pages[0]);
  const [history, setHistory] = useState<PageInterface[]>([pages[0]]);
  const [isConnected, setIsConnected] = useState(false); // Estado de conexión
  const [wsController, setWsController] = useState<WebSocketController | null>(null); // Controlador WebSocket

  // Efecto para manejar el cambio de orientación
  useEffect(() => {
    const handleOrientationChange = () => {
      const isCurrentlyPortrait = window.innerHeight > window.innerWidth;
      setIsPortrait(isCurrentlyPortrait);

      if (isCurrentlyPortrait) {
        // Muestra el mensaje de advertencia
        toast.warn("Por favor, gira tu dispositivo para una mejor experiencia.", {
          position: "top-center",
          autoClose: 5000, // Tiempo en milisegundos
          hideProgressBar: true,
          closeOnClick: true,
          pauseOnHover: true,
          draggable: true,
        });
      }
    };

    window.addEventListener('resize', handleOrientationChange);
    window.addEventListener('orientationchange', handleOrientationChange);
    
    // Verificar la orientación inicial
    handleOrientationChange();

    return () => {
      window.removeEventListener('resize', handleOrientationChange);
      window.removeEventListener('orientationchange', handleOrientationChange);
    };
  }, []);

  // Función general para cambiar de página
  const handlePageClick = (page: PageInterface) => {
    setHistory((prevHistory) => [...prevHistory, page]);
    setCurrentPage(page);
  };

  // Manejo del botón de retroceso
  const handleBackClick = () => {
    if (history.length > 1) {
      setHistory((prevHistory) => {
        const newHistory = prevHistory.slice(0, -1); // Elimina la última página
        setCurrentPage(newHistory[newHistory.length - 1]); // Navega a la página anterior
        return newHistory;
      });
    }
  };

  // Maneja el cambio en la conexión
  const handleConnectionChange = (connected: boolean, controller: WebSocketController | null) => {
    setIsConnected(connected);
    setWsController(controller);
  };

  // Renderizado de la página actual
  const renderPage = () => {
    switch (currentPage.name) {
      case "gameModeSelection":
        return (
          <GameModeSelection
            onBackClick={handleBackClick}
            onControlClick={() => handlePageClick(pages[3])} // "controlMode"
            onGyroClick={() => handlePageClick(pages[4])} 
          />
        );
      case "controlMode":
        return (
          <>
            {isConnected && wsController ? (
              <ControlModePage wsController={wsController} onBackClick={handleBackClick} />
            ) : (
              <LoginModePage onConnectionChange={handleConnectionChange} onBackClick={handleBackClick} />
            )}
          </>
        );
      case "gyroMode":
        return (
          <>
            {isConnected && wsController ? (
              <GyroModePage wsController={wsController} onBackClick={handleBackClick} />
            ) : (
              <LoginModePage onConnectionChange={handleConnectionChange} onBackClick={handleBackClick} />
            )}
          </>
        );
      case "settings":
        return (
          <SettingsPage 
            onBackClick={handleBackClick} 
          />
        );
      default:
        return (
          <MainMenu
            onPlayClick={() => handlePageClick(pages[1])}
            onSettingsClick={() => handlePageClick(pages[2])}
          />
        );
    }
  };

  return (
    <>
      <ToastContainer />
      <div className={isPortrait ? "portrait-class" : "landscape-class"}>
        {renderPage()}
      </div>
    </>
  );
}

export default App;
