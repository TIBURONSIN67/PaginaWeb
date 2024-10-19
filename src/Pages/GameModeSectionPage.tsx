import { BackButton, ButtonOptions } from "../components/Buttons";
import { Page } from "../components/Page";

interface GameModeSelectionProps {
  onBackClick: () => void;
  onControlClick: () => void;
  onGyroClick: () => void;
}

export function GameModeSelectionPage({ onBackClick, onControlClick, onGyroClick}: GameModeSelectionProps) {
  return (
    <Page
      extraClassName="your-extra-class"
      backButton={<BackButton text="Volver" aria-label="Volver" onClick={onBackClick} />}
    >
      <ButtonOptions text="Jugar Con GYROSCOPIO" onClick={onGyroClick} />
      <ButtonOptions text="Jugar Con CONTROL" onClick={onControlClick} />
    </Page>
  );
}
