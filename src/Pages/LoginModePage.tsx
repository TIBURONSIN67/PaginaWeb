import { BackButton } from "../components/Buttons";
import { Page } from "../components/Page";
import { WebSocketLogin } from "../components/sections/LoginSection";

interface GameModeSelectionProps {
  onBackClick: () => void;
}

export function LoginModePage({ onBackClick }: GameModeSelectionProps) {
  return (
    <Page
      extraClassName="your-extra-class"
      backButton={<BackButton text="Volver" aria-label="Volver" onClick={onBackClick} />}
    >
      <WebSocketLogin />
    </Page>
  );
}
