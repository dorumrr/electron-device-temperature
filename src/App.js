import { useState, useEffect } from 'react'
import * as RB from 'react-bootstrap'
import Thermometer from 'react-thermometer-ecotropy'

const ipcRenderer = window.require('electron').ipcRenderer

const App = () => {
  const [cpuTemperature, setCpuTemperature] = useState(0)
  const [cpuTemperatureError, setCpuTemperatureError] = useState(null)
  const [outdoorTemperature, setOutdoorTemperature] = useState(0)
  const [outdoorTemperatureError, setOutdoorTemperatureError] = useState(null)

  const getCpuTemperature = async () => {
    try {
      const result = await ipcRenderer.sendSync('cpu-temperature')
      if (result === 'error' || !Number(result)) {
        setCpuTemperatureError('Could not read CPU Temperature due to a system limitation')
      } else {
        setCpuTemperature(result)
        setCpuTemperatureError(null)
        setTimeout(getCpuTemperature, 10000)
      }
    } catch (e) {
      console.error(e)
      setCpuTemperatureError('Could not read CPU Temperature, retrying...')
      setTimeout(getCpuTemperature, 10000)
    }
  }

  const getOutdoorTemperature = async () => {
    try {
      const result = await ipcRenderer.sendSync('outdoor-temperature')
      if (result === 'error' || !Number(result)) {
        setOutdoorTemperatureError('Could not get Outdoor Temperature due to malformed API response')
      } else {
        setOutdoorTemperature(result)
        setOutdoorTemperatureError(null)
        setTimeout(getOutdoorTemperature, 1000 * 60 * 30) // 30 minutes
      }
    } catch (e) {
      console.error(e)
      setOutdoorTemperatureError('Could not get Outdoor Temperature, retrying...')
      setTimeout(getCpuTemperature, 1000 * 60) // 1 minute
    }
  }

  const quitApp = () => {
    ipcRenderer.send('quit-app') 
  }

  useEffect(() => {
    getCpuTemperature()
    getOutdoorTemperature()
  }, [])

  return (<div className="bg-dark m-0 p-4" style={{ position: "fixed", top: 0, right: 0, bottom: 0, left: 0 }}>
    <div className="d-flex justify-content-around bg-dark ml-1 mt-3">

      <div>
        <div className="ml-2">
          <Thermometer
            theme="dark"
            value={cpuTemperature}
            max="130"
            format="°C"
            size="large"
            height="380"
          />
        </div>
        <div className="my-4 badge rounded-pill bg-secondary text-white p-2">CPU Temperature</div>
      </div>

      <div>
        <div className="ml-4">
          <Thermometer
            theme="dark"
            value={outdoorTemperature}
            max="50"
            format="°C"
            size="large"
            height="380"
          />
        </div>
        <div className="my-4 badge rounded-pill bg-secondary text-white p-2">Outdoor Temperature</div>
      </div>

    </div>

    <div className="d-flex justify-content-around mt-3">
      <RB.Button variant="danger" size="sm" onClick={() => quitApp()}>QUIT</RB.Button>
    </div>
    {cpuTemperatureError ? <RB.Alert variant="danger" dismissible onClick={() => setCpuTemperatureError(null)} className="fixed-top m-2">{cpuTemperatureError}</RB.Alert> : ''}
    {outdoorTemperatureError ? <RB.Alert variant="danger" dismissible onClick={() => setOutdoorTemperatureError(null)} className="fixed-top m-2">{outdoorTemperatureError}</RB.Alert> : ''}
  </div>)
}

export default App
