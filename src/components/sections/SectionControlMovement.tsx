import { useEffect, useState } from "react";
import { MovementControlButton, LightButton, DirectionControlButton } from "../Buttons";

interface SectionControlMovementProps {
  passResetFunctionToParent: (resetFunc: () => void) => void;
  gyro?: boolean;
  sendMovementData: (comand:string)=> void;
  isConnected: boolean;
}

export function SectionControlMovement(
  { 
    gyro,
    passResetFunctionToParent, 
    sendMovementData,
    isConnected
  }: SectionControlMovementProps) {
  const [movementState, setMovementState] = useState({
    isBackward: false,
    isForward: false,
    isLeft: false,
    isRight: false,
    isLight: false,
  });
  useEffect(() => {
    if (isConnected) {
      sendMovementData("STOP"); // Usa sendMovementData
    }
  }, [isConnected, sendMovementData]);

  useEffect(() => {
    passResetFunctionToParent(() => {
      sendMovementData("STOP");
      sendMovementData("LIGHT_OFF");
    });
  }, [isConnected, passResetFunctionToParent, sendMovementData]);

  const toggleLight = () => {
    const newLightState = !movementState.isLight;
    sendMovementData(newLightState ? "LIGHT_ON" : "LIGHT_OFF");
  };

  const controlForward = () => {
    if (movementState.isForward) {
      sendMovementData("STOP");
      setMovementState((prevState) => ({ ...prevState, isForward: false }));
    } else {
      sendMovementData("FORWARD");
      setMovementState((prevState) => ({ ...prevState, isForward: true, isBackward: false }));
    }
  };

  const controlBackward = () => {
    if (movementState.isBackward) {
      sendMovementData("STOP");
      setMovementState((prevState) => ({ ...prevState, isBackward: false }));
    } else {
      sendMovementData("BACKWARD");
      setMovementState((prevState) => ({ ...prevState, isBackward: true, isForward: false }));
    }
  };

  const handleLeftTouchStart = () => {
    sendMovementData("LEFT");
    setMovementState((prevState) => ({ ...prevState, isLeft: true }));
  };

  const handleRightTouchStart = () => {
    sendMovementData("RIGHT");
    setMovementState((prevState) => ({ ...prevState, isRight: true }));
  };

  const handleLeftTouchEnd = () => {
    sendMovementData("STOP");
    setMovementState((prevState) => ({ ...prevState, isLeft: false }));
  };

  const handleRightTouchEnd = () => {
    sendMovementData("STOP");
    setMovementState((prevState) => ({ ...prevState, isRight: false }));
  };

  return (
    <section className="flex flex-col items-center space-y-6 w-full h-full justify-center">
      <div>
        <LightButton isOn={movementState.isLight} onClick={toggleLight} />
      </div>
      <div className="flex space-x-4">
        <MovementControlButton text="P" pressed={!movementState.isForward && !movementState.isBackward} onClick={() => sendMovementData("STOP")} />
        <MovementControlButton text="D" pressed={movementState.isForward} onClick={controlForward} />
        <MovementControlButton text="R" pressed={movementState.isBackward} onClick={controlBackward} />
      </div>
      <div className="flex gap-20 md:gap-40">
        {gyro ? null : (
          <>
            <DirectionControlButton text="<" handleTouchStart={handleLeftTouchStart} handleTouchEnd={handleLeftTouchEnd} isPressed={movementState.isLeft} />
            <DirectionControlButton text=">" handleTouchStart={handleRightTouchStart} handleTouchEnd={handleRightTouchEnd} isPressed={movementState.isRight} />
          </>
        )}
      </div>
    </section>
  );
}
