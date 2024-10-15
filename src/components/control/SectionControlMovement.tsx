import { ReactNode, useState, useEffect } from "react";
import { MovementControlButton, LightButton, DirectionControlButton } from "../Buttons";
import { WebSocketController } from "../../../utils/WebSocketController";

interface SectionControlMovementProps {
  children?: ReactNode; // Acepta nodos React como hijos
  wsController: WebSocketController; // Controlador del WebSocket pasado como prop
  gyro?: boolean;
  passResetFunctionToParent: (resetFunc: () => void) => void; 
}

// Definición de los comandos de movimiento
const movementCommands = {
    FORWARD: "FORWARD",
    BACKWARD: "BACKWARD",
    STOP: "STOP",
    LEFT: "LEFT",
    RIGHT: "RIGHT",
    LIGHT_ON: "LIGHT_ON",
    LIGHT_OFF: "LIGHT_OFF",
};

export function SectionControlMovement({ wsController, gyro, passResetFunctionToParent}: SectionControlMovementProps) {
    const [movementState, setMovementState] = useState({
        isBackward: false,
        isForward: false,
        isLeft: false,
        isRight: false,
        isLight: false,
    });


    useEffect(() => {
        // Enviar STOP cuando se monte el componente
        sendMovementData(movementCommands.STOP);
    }, []); // Solo se ejecuta al montar

    const sendMovementData = (command: string) => {
        if (wsController) {
            const data = {
                state: command,
            };
            wsController.send(data);
        } else {
            console.log("Controlador WebSocket no está disponible.");
        }
    };
    
  const handleReset = () => {
        if (wsController) {
            // Enviar comandos para detener movimientos y apagar la luz
            sendMovementData(movementCommands.STOP);  // Para detener el movimiento
            sendMovementData(movementCommands.LIGHT_OFF);  // Para apagar la luz
        }
    };

      // Pasar la función al padre cuando se monta el componente
  useEffect(() => {
    passResetFunctionToParent(handleReset);
  }, []);
    const toggleLight = () => {
        const newLightState = !movementState.isLight;
        sendMovementData(newLightState ? movementCommands.LIGHT_ON : movementCommands.LIGHT_OFF);
        setMovementState((prevState) => ({ ...prevState, isLight: newLightState }));
    };

    const controlForward = () => {
        if (movementState.isForward) {
            sendMovementData(movementCommands.STOP);
            setMovementState((prevState) => ({ 
                ...prevState, 
                isForward: false 
            }));
        } else {
            if (movementState.isBackward) {
                setMovementState((prevState) => ({ 
                    ...prevState, 
                    isBackward: false 
                }));
            }
            sendMovementData(movementCommands.FORWARD);
            setMovementState((prevState) => ({ 
                ...prevState, 
                isForward: true 
            }));
        }
    };

    const controlBackward = () => {
        if (movementState.isBackward) {
            sendMovementData(movementCommands.STOP);
            setMovementState((prevState) => ({ 
                ...prevState, 
                isBackward: false 
            }));
        } else {
            if (movementState.isForward) {
                setMovementState((prevState) => ({ 
                    ...prevState, 
                    isForward: false 
                }));
            }
            sendMovementData(movementCommands.BACKWARD);
            setMovementState((prevState) => ({ 
                ...prevState, 
                isBackward: true 
            }));
        }
    };

    const controlStop = () => {
        sendMovementData(movementCommands.STOP);
        setMovementState({
            isBackward: false,
            isForward: false,
            isLeft: movementState.isLeft,
            isRight: movementState.isRight,
            isLight: movementState.isLight,
        });
    };

    const isStop = !movementState.isForward && !movementState.isBackward; 

    const handleLeftTouchStart = () => {
        sendMovementData(movementCommands.LEFT);
        setMovementState((prevState) => ({ ...prevState, isLeft: true })); 
    };

    const handleRightTouchStart = () => {
        setMovementState((prevState) => ({ ...prevState, isRight: true })); 
        sendMovementData(movementCommands.RIGHT);
    };

    const handleLeftTouchEnd = () => {
        if (movementState.isForward) {
            sendMovementData(movementCommands.FORWARD);
        } else if (movementState.isBackward) {
            sendMovementData(movementCommands.BACKWARD);
        } else {
            sendMovementData(movementCommands.STOP);
        }
        setMovementState({ ...movementState, isLeft: false });
    };
    
    const handleRightTouchEnd = () => {
        if (movementState.isForward) {
            sendMovementData(movementCommands.FORWARD);
        } else if (movementState.isBackward) {
            sendMovementData(movementCommands.BACKWARD);
        } else {
            sendMovementData(movementCommands.STOP);
        }
        setMovementState({ ...movementState, isRight: false });
    };
    
    return (
        <section className="flex flex-col items-center space-y-6 w-full h-full justify-center">
            <div>
                <LightButton isOn={movementState.isLight} onClick={toggleLight} />
            </div>
            <div className="flex space-x-4">
                <MovementControlButton text="P" pressed={isStop} onClick={controlStop} />
                <MovementControlButton text="D" pressed={movementState.isForward} onClick={controlForward} />
                <MovementControlButton text="R" pressed={movementState.isBackward} onClick={controlBackward} />
            </div>
            <div className="flex gap-20 md:gap-40">
                {gyro ? null : (
                    <>
                        <DirectionControlButton 
                          text="<" 
                          handleTouchStart={handleLeftTouchStart} 
                          handleTouchEnd={handleLeftTouchEnd} 
                          isPressed={movementState.isLeft} // Estado dinámico para el color del botón
                        />
                        <DirectionControlButton 
                          text=">" 
                          handleTouchStart={handleRightTouchStart} 
                          handleTouchEnd={handleRightTouchEnd} 
                          isPressed={movementState.isRight} // Estado dinámico para el color del botón
                        />
                    </>
                )}
            </div>
        </section>
    );
}
