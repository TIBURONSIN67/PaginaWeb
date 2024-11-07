import { useEffect, useState, useCallback} from "react";
import { MovementControlButton, LightButton, DirectionControlButton, HornButton } from "../Buttons";
import 'react-toastify/dist/ReactToastify.css';
import { ToastContainer, toast} from 'react-toastify';

interface SectionControlMovementProps {
  passResetFunctionToParent: (resetFunc: () => void) => void;
  sendMovementData: (command: string) => void;
  isConnected: boolean;
  serverState: {[key: string]: string};
}
const movementCommands = {
  FORWARD: "FORWARD",
  BACKWARD: "BACKWARD",
  STOP: "STOP",
  LEFT: "LEFT",
  RIGHT: "RIGHT",
  LIGHT_ON: "LIGHT_ON",
  LIGHT_OFF: "LIGHT_OFF",
  HORN_ON: "HORN_ON",
  HORN_OFF: "HORN_OFF",
};
export function SectionControlMovement(
  { 
    passResetFunctionToParent, 
    sendMovementData,
    isConnected,
    serverState
  }: SectionControlMovementProps) {
    const [movementState, setMovementState] = useState(
      {
        isLight: false,
        isForward: false,
        isBackward: false,
        isLeft: false,
        isRight: false,
        isHorn: false,
      }
    )
  const [leftIsPressed, setLeftIsPressed] = useState(false);
  const [RightIsPressed, setRightIsPressed] = useState(false);

  const [hornPressed, setHornPressed] = useState(false);
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

  useEffect(()=>{
    if (serverState.state === "STOP"){
      setMovementState(
        {...movementState, 
          isForward: false, 
          isBackward: false, 
        });
      sendMovementData(movementCommands.STOP);
      console.log("el servidor detecto peligro",serverState)
    }
  },[serverState])
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
    setLeftIsPressed(true);      
    sendMovementData(movementCommands.LEFT);
    setMovementState({...movementState, isLeft: true})
  }
    //control Derecha
  const handleRightTouchStart = ()=>{
    setRightIsPressed(true);             
    sendMovementData(movementCommands.RIGHT);
    setMovementState({...movementState, isRight: true})
  }

  const handleLeftTouchEnd = ()=>{
    setLeftIsPressed(false);
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
    setRightIsPressed(false);
    if (movementState.isBackward){
      sendMovementData(movementCommands.BACKWARD);
    }else if (movementState.isForward){
      sendMovementData(movementCommands.FORWARD);
    }else{
      sendMovementData(movementCommands.STOP);
    }
    setMovementState({...movementState, isRight: false})
  }

  const handleHornTouchStart = ()=>{
    setHornPressed(true);             
    sendMovementData(movementCommands.HORN_ON);
    setMovementState({...movementState, isHorn: true})
  }

  const handleHornTouchEnd = ()=>{
    setHornPressed(false);
    setMovementState({...movementState, isHorn: false})
    sendMovementData(movementCommands.HORN_OFF);
  }
  return (
    <section className="flex flex-col items-center space-y-6 w-full h-full justify-center">
      <ToastContainer />
      <div className="flex flex-row items-center justify-around w-full">
        <LightButton onClick={toggleLight} isOn={movementState.isLight} />
        <HornButton 
          handleTouchEnd={handleHornTouchEnd} 
          handleTouchStart={handleHornTouchStart}
          isPressed={hornPressed}
        />
      </div>
      <div className="flex flex-row justify-center gap-x-16 w-full">
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
          isPressed={leftIsPressed} 
          />
        <DirectionControlButton text=">" 
          handleTouchStart={handleRightTouchStart}
          handleTouchEnd={handleRightTouchEnd}
          isPressed={RightIsPressed}
         />
      </div>
    </section>
  );
}
