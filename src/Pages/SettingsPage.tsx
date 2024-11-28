import { BackButton, ButtonOptions} from "../components/Buttons";
import { Page } from "../components/Page";
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css'; 

interface SettingsPageProps {
  onBackClick: () => void;
  sendMovementData: (comand:string)=> void;
}

export function SettingsPage({ onBackClick , sendMovementData }: SettingsPageProps) {
  const data = {
    DISABLE_SENSORS:"DISABLE_SENSORS"
  }
  const disableSensors = ()=>{
    toast.success("Sensores Desactivados");
    sendMovementData(data.DISABLE_SENSORS);
  }
  return (
    <Page 
      extraClassName="your-extra-class" 
      backButton={<BackButton text="Volver" aria-label="Volver" onClick={onBackClick} />}
    >
      <div>
        <div>
          <ToastContainer />
        </div>
          <ButtonOptions text="Desactivar Sensores" extraClassName="bg-green-600 hover:bg-green-800" onClick={disableSensors}/>
      </div>
    </Page>
  );
}
