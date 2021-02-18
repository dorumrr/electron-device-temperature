import { useState, useEffect } from 'react'
import * as RB from 'react-bootstrap'
const ipcRenderer = window.require('electron').ipcRenderer;

const App = () => {
  const [temperature, setTemperature] = useState(null);
  const [error, setError] = useState(null)

  const getCPUTemperature = async () => {
    try {
      const result = await ipcRenderer.invoke('cpu-temperature', null);
      setTemperature(result)
      setError(null)
      setTimeout(getCPUTemperature, 5000)
    } catch (error) {
      console.error(error);
      setError('Could not read CPU temperature, retrying in 10 seconds...')
      setTimeout(getCPUTemperature, 10000)
    }
  }

  useEffect(() => {
    getCPUTemperature()
  }, [])

  return (<RB.Container className="m-0 p-3">
    <pre>{JSON.stringify(temperature, null, 2)}</pre>
    {error ? <RB.Alert variant="danger" className="fixed-bottom m-0">{error}</RB.Alert> : ''}
  </RB.Container>)
}

export default App
