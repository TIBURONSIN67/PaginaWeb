import { BackButton } from "../components/Buttons";
import { Page } from "../components/Page";
import { SectionControlMovement } from "../components/sections/SectionControlMovement";
import { useState } from "react";

interface ControlModePageProps {
  onBackClick: () => void;
}

export function ControlModePage({ onBackClick }: ControlModePageProps) {
  const [resetFunction, setResetFunction] = useState<(() => void) | null>(null);

  // Función que recibirá el "reset" del hijo
  const handleReceiveResetFunction = (resetFunc: () => void) => {
    setResetFunction(() => resetFunc); // Guarda la función de reinicio
  };

  const handleResetAll = () => {
    if (resetFunction) {
      resetFunction(); // Ejecuta la función de reinicio que vino del hijo
    }
  };

  return (
    <Page
      extraClassName="your-extra-class"
      backButton={
        <BackButton 
          text="Volver" 
          aria-label="Volver" 
          onClick={() => {
            handleResetAll();
            onBackClick();
          }} 
        />
      }
    >
      <SectionControlMovement 
        passResetFunctionToParent={handleReceiveResetFunction} 
      />
    </Page>
  );
}
