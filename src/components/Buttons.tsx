
// Interfaz base para los botones
interface BaseButtonProps {
  onClick?: () => void; // Permitir un manejador de clics
  isPressed?: boolean;
  extraClassName?: string; // Permitir estilos adicionales
}

// Interfaz específica para botones con texto
interface TextButtonProps extends BaseButtonProps {
  text: string; // Texto del botón
}

// Componente para botones genéricos
export function ButtonOptions(
  { 
    text, 
    onClick, 
    extraClassName 

  }: TextButtonProps) {

  return (
    <button
      onClick={onClick} // Manejar clics
      className={`
        bg-blue-600 text-white font-bold rounded-xl 
        hover:bg-blue-800 hover:shadow-xl transition 
        duration-300 ease-in-out w-52 h-16 m-2 
        ${extraClassName} 
      `}
      aria-label={text} // Accesibilidad
    >
      {text}
    </button>
  );
}

// Componente para el botón de retroceso
export function BackButton({ text, onClick, extraClassName }: TextButtonProps) {
  return (
    <button
      onClick={onClick} // Manejar clics
      className={`
        text-white font-bold rounded-xl 
        hover:shadow-xl transition 
        duration-300 ease-in-out
        bg-red-600 hover:bg-red-800 w-[120px] h-10
        ${extraClassName} 
      `}
      aria-label={text} // Accesibilidad
    >
      {text}
    </button>
  );
}


interface SendButtonProps {
  text?: string;
  extraClassName?: string;
  handleConnectClick: () => void;
  isLoading?: boolean; // Valor predeterminado
}

export function SendButton({
  text = "Enviar",
  extraClassName = "",
  handleConnectClick,
  isLoading = false, // Valor predeterminado
}: SendButtonProps) {
  return (
    <button
      onClick={handleConnectClick}
      className={`
        text-white font-bold rounded-xl 
        hover:shadow-xl transition 
        duration-300 ease-in-out
        bg-red-600 hover:bg-red-800 w-[120px] h-10
        ${extraClassName} 
        ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}
      `}
      aria-label={text}
      onFocus={(e) => e.currentTarget.classList.add('ring-2', 'ring-yellow-500')}
      onBlur={(e) => e.currentTarget.classList.remove('ring-2', 'ring-yellow-500')}
      disabled={isLoading}
    >
      {isLoading ? 'Cargando...' : text} 
    </button>
  );
}
// Componente para botones de control de movimiento
export function MovementControlButton(
  { 
    text, 
    onClick, 
    isPressed,
    extraClassName 

  }: TextButtonProps) {
  return (
    <button
      onClick={onClick}
      className={`
        text-white font-bold rounded-xl 
        ${isPressed ? 'bg-blue-900' : 'bg-blue-600'} 
        ${isPressed ? 'scale-95' : 'scale-100'} 
        w-[120px] h-10
        ${extraClassName} 
      `}
      aria-label={text} // Accesibilidad
    >
      {text}
    </button>
  );
}

interface EventButtonProps extends TextButtonProps {
  handleTouchStart?: () => void;
  handleTouchEnd?: () => void;
  isPressed?: boolean;
}

// Componente para botones de control de dirección
export function DirectionControlButton(
  {
    text,
    handleTouchStart,
    handleTouchEnd,
    extraClassName,
    isPressed,

  }: EventButtonProps) {

  return (
    <button
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      className={`
        ${isPressed ? 'bg-yellow-900' : 'bg-yellow-600'} 
        text-white font-bold rounded-xl 
        transition duration-300 
        ease-in-out 
        w-[160px]  md:w-[180px] 
        h-[50px]  md:h-[70px] 
        ${extraClassName}
      `}
      aria-label={text}
  >
    {text}
  </button>
  
  );
}

// Componente para el botón de luz
interface LightButtonProps extends BaseButtonProps {
  isOn: boolean; // Propiedad para controlar si la luz está encendida
}

export function LightButton(
  { 
    onClick,
    extraClassName, 
    isOn 
    
  }: LightButtonProps) {

  return (
    <button
      onClick={onClick}
      className={` 
        ${isOn ? 'bg-yellow-400 hover:bg-yellow-500 shadow-lg animate-pulse' : 'bg-gray-300 hover:bg-gray-400'} 
        rounded-full 
        transition duration-300 ease-in-out 
        w-16 h-16 
        flex items-center justify-center 
        ${extraClassName} 
      `}
      aria-label={isOn ? "Light On" : "Light Off"} // Accesibilidad
    >
      {isOn && (
        <div className="absolute w-20 h-20 rounded-full bg-yellow-300 opacity-90 -z-10 animate-ping" />
      )}
      <span className={`${isOn ? 'text-yellow-900' : 'text-gray-500'} font-bold`}>
        {isOn ? '🔥' : '💤'}
      </span>
    </button>
  );
}

interface HornButtonProps extends BaseButtonProps {
  handleTouchStart: () => void;
  handleTouchEnd: () => void;
  isPressed: boolean;
}

export function HornButton({
  handleTouchStart,
  handleTouchEnd,
  extraClassName,
  isPressed
}: HornButtonProps) {


  return (
    <button
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      className={`
        ${isPressed ? 'bg-yellow-400 shadow-lg shadow-lg animate-pulse' : 'bg-gray-300'}
        rounded-full 
        transition duration-100 ease-in-out 
        w-16 h-16 
        flex items-center justify-center 
        ${extraClassName}
      `}
      aria-label={isPressed ? "Horn On" : "Horn Off"} // Accesibilidad
    >
      {isPressed && (
        <div className="absolute w-20 h-20 rounded-full bg-yellow-500 opacity-70 -z-10 animate-ping" />
      )}
      <span className={`${isPressed ? 'text-yellow-900' : 'text-gray-500'} text-2xl font-bold`}>
        {isPressed ? '📢' : '🔇'}
      </span>
    </button>
  );
}
