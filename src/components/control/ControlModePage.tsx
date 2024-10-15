import { BackButton } from "../Buttons";
import { Page } from "../Page";
import { WebSocketController } from "../../../utils/WebSocketController";
import { SectionControlMovement } from "./SectionControlMovement";
import { useState } from "react";

interface ControlModePageProps {
  onBackClick: () => void;
  wsController: WebSocketController; // Controlador del WebSocket pasado como prop

}

export function ControlModePage({ onBackClick, wsController }: ControlModePageProps) {

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
      <SectionControlMovement wsController={wsController} passResetFunctionToParent={handleReceiveResetFunction} />
    </Page>
  );
}
