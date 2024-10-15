import { BackButton } from "../Buttons";
import { Page } from "../Page";
import { WebSocketLogin } from "./LoginSection";
import { WebSocketController } from "../../../utils/WebSocketController";

interface GameModeSelectionProps {
  onBackClick: () => void;
  onConnectionChange: (connected: boolean, controller: WebSocketController | null) => void;
}

export function LoginModePage({ onBackClick, onConnectionChange }: GameModeSelectionProps) {
  return (
    <Page
      extraClassName="your-extra-class"
      backButton={<BackButton text="Volver" aria-label="Volver" onClick={onBackClick} />}
    >
      <WebSocketLogin onConnectionChange={onConnectionChange} />
    </Page>
  );
}
