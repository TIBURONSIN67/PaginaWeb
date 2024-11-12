import { useEffect, useState, useCallback} from "react";
import { MovementControlButton, LightButton, HornButton } from "../Buttons";
import 'react-toastify/dist/ReactToastify.css';
import { ToastContainer, toast } from 'react-toastify';

interface SectionGyroMovementProps {
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
export function SectionGyroMovement(
  { 
    passResetFunctionToParent, 
    sendMovementData,
    isConnected,
    serverState
  }: SectionGyroMovementProps) {
  const [movementState, setMovementState] = useState({
    isBackward: false,
    isForward: false,
    isLeft: false,
    isRight: false,
    isLight: false,
    isHorn: false,
  });

  const [isNone, setNone] = useState(false)

  const [hornPressed, setHornPressed] = useState(false);

  // Efecto cuando se establece la conexión
  useEffect(() => {
    if (isConnected) {
      toast.success("Conexión establecida correctamente.");
    }
  }, [isConnected]);

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

  // Función para restablecer el estado del movimiento y las luces
  const resetFunction = useCallback(() => {
    sendMovementData(movementCommands.STOP);
    sendMovementData(movementCommands.LIGHT_OFF);
    setMovementState({...movementState, isBackward: false, isForward: false, isLight: false});
  }, [sendMovementData]);
  
  // Para pasar la función reset al padre cuando se renderiza por primera vez
  useEffect(() => {
    passResetFunctionToParent(resetFunction);
  }, []);

  // Alternar el estado de la luz
  const toggleLight = () => {
    const newLightState = !movementState.isLight;
    setMovementState({ ...movementState, isLight: newLightState });
    sendMovementData(newLightState ? movementCommands.LIGHT_ON: movementCommands.LIGHT_OFF);
  };

  // Controlar movimiento hacia adelante
  const controlForward = () => {
    const newForwardState = !movementState.isForward
    sendMovementData(newForwardState ? movementCommands.FORWARD : movementCommands.STOP);
    setMovementState({ ...movementState, isForward:newForwardState, isBackward: false})
  };

  // Controlar movimiento hacia atrás
  const controlBackward = () => {
    const newBackwardState = !movementState.isBackward
    sendMovementData(newBackwardState ? movementCommands.BACKWARD : movementCommands.STOP);
    setMovementState({ ...movementState, isBackward: newBackwardState, isForward: false })
  };

  useEffect(() => {
    const handleOrientation = (event: DeviceOrientationEvent) => {
      const { beta } = event;
  
      if (beta !== null) {
        // Controlar hacia la derecha
        if (beta > 10 && !movementState.isRight) {
          sendMovementData(movementCommands.RIGHT);
          setMovementState({ ...movementState, isRight: true, isLeft: false });
          setNone(false);
        }
        // Controlar hacia la izquierda
        else if (beta < -10 && !movementState.isLeft) {
          sendMovementData(movementCommands.LEFT);
          setMovementState({ ...movementState, isLeft: true, isRight: false });
          setNone(false);
        }
        // Si está en la zona neutral (-20 <= beta <= 20)
        else if ((beta >= -10 && beta <= 10) && !isNone) {
          setMovementState({ ...movementState, isLeft: false, isRight: false });
          if(movementState.isBackward){
            sendMovementData(movementCommands.BACKWARD);
          }else if(movementState.isForward){
            sendMovementData(movementCommands.FORWARD)
          }else{
            sendMovementData(movementCommands.STOP);
          }
          setNone(true);
        }
      }
    };
  
    // Agregar el evento para detectar los cambios del giroscopio
    window.addEventListener("deviceorientation", handleOrientation);
  
    return () => {
      // Remover el evento cuando el componente se desmonte
      window.removeEventListener("deviceorientation", handleOrientation);
    };
  }, [movementState.isLeft, movementState.isRight, movementState.isBackward, movementState.isForward, sendMovementData]);
  
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
        <LightButton isOn={movementState.isLight} onClick={toggleLight} />
        <HornButton 
          handleTouchEnd={handleHornTouchEnd}
          handleTouchStart={handleHornTouchStart}
          isPressed={hornPressed}
        />
      </div>
      <div className="flex space-x-4">
        <MovementControlButton text="D" isPressed={movementState.isForward} onClick={controlForward} />
        <MovementControlButton text="R" isPressed={movementState.isBackward} onClick={controlBackward} />
      </div>
    </section>
  );
}
