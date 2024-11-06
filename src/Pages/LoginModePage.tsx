import { BackButton } from "../components/Buttons";
import { Page } from "../components/Page";
import { WebSocketLogin } from "../components/sections/LoginSection";

interface GameModeSelectionProps {
  onBackClick: () => void;
  connectWebSocket: (newIp: string) => void;
  isLoading: boolean;
  isConnected: boolean;
  error: string | null;
}

export function LoginModePage(
  {
    onBackClick,
    isLoading,
    error,
    connectWebSocket,
    isConnected,
   }: GameModeSelectionProps) {
  return (
    <Page
      extraClassName="your-extra-class"
      backButton={<BackButton text="Volver" aria-label="Volver" onClick={onBackClick} />}
    >
      <WebSocketLogin
        isConnected={isConnected}
        isLoading={isLoading} 
        error={error} 
        connectWebSocket={connectWebSocket}  />
    </Page>
  );
}
