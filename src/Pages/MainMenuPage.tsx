import { ButtonOptions } from "../components/Buttons";
import { Page } from "../components/Page";

interface MainMenuProps {
  onPlayClick: () => void;
  onSettingsClick: () => void;
}

export function MainMenu({ onPlayClick, onSettingsClick }: MainMenuProps) {
  return (
    <Page extraClassName="your-extra-class">
      <ButtonOptions text="JUGAR" onClick={onPlayClick} />
      <ButtonOptions text="OPCIONES" onClick={onSettingsClick} />
    </Page>
  );
}
