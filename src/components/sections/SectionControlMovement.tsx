import { useEffect, useState, useCallback} from "react";
import { MovementControlButton, LightButton, DirectionControlButton } from "../Buttons";
import 'react-toastify/dist/ReactToastify.css';
import { ToastContainer, toast} from 'react-toastify';

interface SectionControlMovementProps {
  passResetFunctionToParent: (resetFunc: () => void) => void;
  sendMovementData: (command: string) => void;
  isConnected: boolean;
}
const movementCommands = {
  FORWARD: "FORWARD",
  BACKWARD: "BACKWARD",
  STOP: "STOP",
  LEFT: "LEFT",
  RIGHT: "RIGHT",
  LIGHT_ON: "LIGHT_ON",
  LIGHT_OFF: "LIGHT_OFF",
};
export function SectionControlMovement(
  { 
    passResetFunctionToParent, 
    sendMovementData,
    isConnected
  }: SectionControlMovementProps) {
    const [movementState, setMovementState] = useState(
      {
        isLight: false,
        isForward: false,
        isBackward: false,
        isLeft: false,
        isRight: false,
      }
    )
    // Función para restablecer el estado del movimiento y las luces
  const resetFunction = useCallback(() => {
    sendMovementData(movementCommands.STOP);
    sendMovementData(movementCommands.LIGHT_OFF);
    setMovementState({...movementState, isLight: false, isBackward: false, isForward: false})
  }, [sendMovementData]);
  // Para pasar la función reset al padre cuando se renderiza por primera vez
  useEffect(() => {
    passResetFunctionToParent(resetFunction);
  }, []);

  useEffect(()=>{
    toast.success("Conexión establecida correctamente.");
  },[isConnected])
    // Alternar el estado de la luz
  const toggleLight = () => {
    const newLightState = !movementState.isLight;
    sendMovementData(newLightState ? movementCommands.LIGHT_ON : movementCommands.LIGHT_OFF);
    setMovementState({...movementState, isLight:newLightState});
  };
  // Controlar movimiento hacia adelante
  const controlForward = () => {
    const newForwardState = !movementState.isForward;
    sendMovementData(newForwardState? movementCommands.FORWARD : movementCommands.STOP);
    setMovementState({...movementState, isForward: newForwardState, isBackward: false});
  };
    // Controlar movimiento hacia adelante
  const controlBackward = () => {
    const newBackwardState = !movementState.isBackward;
    sendMovementData(newBackwardState? movementCommands.BACKWARD : movementCommands.STOP);
    setMovementState({...movementState, isBackward: newBackwardState, isForward: false});
  };

  //control izquierda
  const handleLeftTouchStart = ()=>{
    sendMovementData(movementCommands.LEFT);
    setMovementState({...movementState, isLeft: true})
  }
    //control Derecha
  const handleRightTouchStart = ()=>{
    sendMovementData(movementCommands.RIGHT);
    setMovementState({...movementState, isRight: true})
  }

  const handleLeftTouchEnd = ()=>{
    if (movementState.isBackward){
      sendMovementData(movementCommands.BACKWARD);
    }else if (movementState.isForward){
      sendMovementData(movementCommands.FORWARD);
    }else{
      sendMovementData(movementCommands.STOP);
    }
    setMovementState({...movementState, isLeft: false})
  }
  const handleRightTouchEnd = ()=>{
    if (movementState.isBackward){
      sendMovementData(movementCommands.BACKWARD);
    }else if (movementState.isForward){
      sendMovementData(movementCommands.FORWARD);
    }else{
      sendMovementData(movementCommands.STOP);
    }
    setMovementState({...movementState, isRight: false})
  }
  return (
    <section className="flex flex-col items-center space-y-6 w-full h-full justify-center">
      <ToastContainer />
      <div>
        <LightButton onClick={toggleLight} isOn={movementState.isLight} />
      </div>
      <div className="flex space-x-4">
        <MovementControlButton text="D" onClick={controlForward} isPressed={movementState.isForward}/>
        <MovementControlButton text="R" onClick={controlBackward} isPressed={movementState.isBackward}/>
      </div>
      <div className="
        flex 
        sm:gap-20
        md:gap-60
        gap-2">
        <DirectionControlButton 
          text="<" 
          handleTouchStart={handleLeftTouchStart} 
          handleTouchEnd={handleLeftTouchEnd} 
          />
        <DirectionControlButton text=">" 
          handleTouchStart={handleRightTouchStart}
          handleTouchEnd={handleRightTouchEnd}
         />
      </div>
    </section>
  );
}
