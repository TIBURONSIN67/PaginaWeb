import { useState } from "react";
import { GameModeSelectionPage } from "./Pages/GameModeSectionPage";
import { MainMenu } from "./Pages/MainMenuPage";
import { SettingsPage } from "./Pages/SettingsPage";
import { ControlModePage } from "./Pages/ControlModePage";
import { GyroModePage } from "./Pages/GyroModePage";
import { LoginModePage } from "./Pages/LoginModePage";
import { useWebSocketConnection } from "./hooks/HookHandleSocket"; // Importa el hook

interface PageInterface {
  name: string;
}

const pages: PageInterface[] = [
  { name: "mainMenu" },
  { name: "gameModeSelection" },
  { name: "settings" },
  { name: "controlMode" },
  { name: "gyroMode" },
];

function App() {
  const [currentPage, setCurrentPage] = useState<PageInterface>(pages[0]);
  const [history, setHistory] = useState<PageInterface[]>([pages[0]]);

  // Hook WebSocket
  const { 
    isConnected, 
    connectWebSocket, 
    isLoading, 
    error, 
    sendMovementData 
  } = useWebSocketConnection();

  // Cambio de página
  const handlePageClick = (page: PageInterface) => {
    setHistory((prevHistory) => [...prevHistory, page]);
    setCurrentPage(page);
  };

  // Botón de retroceso
  const handleBackClick = () => {
    if (history.length > 1) {
      setHistory((prevHistory) => {
        const newHistory = prevHistory.slice(0, -1);
        setCurrentPage(newHistory[newHistory.length - 1]);
        return newHistory;
      });
    }
  };

  // Página protegida por WebSocket (ControlMode y GyroMode)
  const renderWebSocketPage = (PageComponent: any) => {
    return isConnected ? (
      <PageComponent 
        onBackClick={handleBackClick} 
        sendMovementData={sendMovementData} 
        isConnected={isConnected} 
      />
    ) : (
      <LoginModePage 
        isConnected={isConnected} 
        error={error} 
        connectWebSocket={connectWebSocket} 
        onBackClick={handleBackClick} 
        isLoading={isLoading} 
      />
    );
  };

  // Renderizado de la página actual
  const renderPage = () => {
    switch (currentPage.name) {
      case "gameModeSelection":
        return (
          <GameModeSelectionPage
            onBackClick={handleBackClick}
            onControlClick={() => handlePageClick(pages[3])} // controlMode
            onGyroClick={() => handlePageClick(pages[4])} // gyroMode
          />
        );
      case "controlMode":
        return renderWebSocketPage(ControlModePage);
      case "gyroMode":
        return renderWebSocketPage(GyroModePage);
      case "settings":
        return <SettingsPage onBackClick={handleBackClick} />;
      default:
        return (
          <MainMenu
            onPlayClick={() => handlePageClick(pages[1])} // gameModeSelection
            onSettingsClick={() => handlePageClick(pages[2])} // settings
          />
        );
    }
  };

  return <>{renderPage()}</>;
}

export default App;
