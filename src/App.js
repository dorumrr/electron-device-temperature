import { useState, useEffect } from "react";
const ipcRenderer = window.require('electron').ipcRenderer;

const App = () => {
  const [temperature, setTemperature] = useState(null);

  const getCPUTemperature = async () => {
    ipcRenderer.invoke('cpu-temperature', null).then((result) => {
      setTemperature(result);
      setTimeout(getCPUTemperature, 5000)
    })
  }

  useEffect(() => {
    getCPUTemperature()
  }, []);

  return (<pre>{JSON.stringify(temperature, null, 2)}</pre>)
}

export default App
