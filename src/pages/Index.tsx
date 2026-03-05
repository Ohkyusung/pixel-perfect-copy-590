import { SettingsProvider } from "../contexts/SettingsContext";
import TouchArea from "../components/TouchArea";

const Index = () => {
  return (
    <SettingsProvider>
      <TouchArea />
    </SettingsProvider>
  );
};

export default Index;
