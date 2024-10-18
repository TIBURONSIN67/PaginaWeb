import { BackButton } from "../components/Buttons";
import { Page } from "../components/Page";
import { useState } from "react";
import { SectionControlMovement } from "../components/sections/SectionControlMovement";

interface GyroModePageProps {
  onBackClick: () => void;
}

export function GyroModePage({ onBackClick }: GyroModePageProps) {
  const [resetFunction, setResetFunction] = useState<(() => void) | null>(null);

  // Utiliza el hook para obtener sendMovementData

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
        gyro={true} 
        passResetFunctionToParent={handleReceiveResetFunction}
      />
    </Page>
  );
}
