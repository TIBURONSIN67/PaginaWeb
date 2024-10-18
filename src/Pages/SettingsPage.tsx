import { BackButton} from "../components/Buttons";
import { Page } from "../components/Page";

interface SettingsPageProps {
  onBackClick: () => void;
}

export function SettingsPage({ onBackClick}: SettingsPageProps) {
  return (
    <Page 
      extraClassName="your-extra-class" 
      backButton={<BackButton text="Volver" aria-label="Volver" onClick={onBackClick} />}
    >
      <h1>no hay opciones todavia f</h1>
    </Page>
  );
}
