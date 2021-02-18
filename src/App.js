import { useState, useEffect } from "react";
const ipcRenderer = window.require('electron').ipcRenderer;

const App = () => {
  const [temperature, setTemperature] = useState(null);
  const [error, setError] = useState(null)

  const getCPUTemperature = async () => {
    try {
      const result = await ipcRenderer.invoke('cpu-temperature', null);
      setTemperature(result);
      setTimeout(getCPUTemperature, 5000)
    } catch (error) {
      console.error(error);
      setError('Could not read CPU temperature, retrying in 10 seconds...')
      setTimeout(getCPUTemperature, 10000)
    }
  }

  useEffect(() => {
    getCPUTemperature()
  }, []);

  return (<div>
    <pre>{JSON.stringify(temperature, null, 2)}</pre>
    {error && <div className="error">{error}</div>}
  </div>)
}

export default App
