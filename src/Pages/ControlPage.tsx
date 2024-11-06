import { BackButton } from "../components/Buttons";
import { Page } from "../components/Page";
import { SectionControlMovement } from "../components/sections/SectionControlMovement";
import { SectionGyroMovement } from "../components/sections/SectionGyroMovement";
import { useState } from "react";

interface ControlPageProps {
  onBackClick: () => void;
  gyro?: boolean;
  sendMovementData: (comand:string)=> void;
  isConnected: boolean;
  state: string;
}

export function ControlPage(
  { 
    onBackClick,
    sendMovementData,
    isConnected,
    gyro,
    state
  }: ControlPageProps) {
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
    {gyro?(
      <SectionGyroMovement 
        passResetFunctionToParent={handleReceiveResetFunction} 
        isConnected={isConnected}
        sendMovementData={sendMovementData}
        state={state}
      />
    ):(
      <SectionControlMovement 
        passResetFunctionToParent={handleReceiveResetFunction} 
        isConnected={isConnected}
        sendMovementData={sendMovementData}
        state={state}
      />
    )}
    </Page>
  );
}
