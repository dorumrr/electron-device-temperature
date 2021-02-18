import { useState, useEffect } from 'react'
import * as RB from 'react-bootstrap'
import Thermometer from 'react-thermometer-ecotropy'

const ipcRenderer = window.require('electron').ipcRenderer

const App = () => {
  const [cpuTemperature, setCpuTemperature] = useState(0)
  const [outdoorTemperature, setOutdoorTemperature] = useState(0)
  const [error, setError] = useState(null)

  const getCpuTemperature = async () => {
    try {
      const result = await ipcRenderer.sendSync('cpu-temperature')
      setCpuTemperature(result)
      setTimeout(getCpuTemperature, 5000)
    } catch (e) {
      console.error(e)
      setError('Could not read CPU Temperature, retrying...')
      setTimeout(getCpuTemperature, 10000)
    }
  }

  const getOutdoorTemperature = async () => {
    try {
      const result = await ipcRenderer.sendSync('outdoor-temperature')
      if (result === 'error' || !Number(result)) {
        setError('Could not get Outdoor Temperature, retrying...')
      } else {
        setOutdoorTemperature(result)
      }
      setTimeout(getOutdoorTemperature, 1000 * 60 * 30) // 30 minutes
    } catch (e) {
      console.error(e)
      setError('Could not get Outdoor Temperature, retrying...')
      setTimeout(getCpuTemperature, 1000 * 60) // 1 minute
    }
  }

  useEffect(() => {
    getOutdoorTemperature()
    getCpuTemperature()
  }, [])

  return (<div className="bg-dark m-0 p-4">
    <div className="d-flex justify-content-around bg-dark ml-1">

      <div>
        <div className="ml-2">
          <Thermometer
            theme="dark"
            value={(cpuTemperature && Math.round(cpuTemperature.main)) || 0}
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
            value={outdoorTemperature || 0}
            max="50"
            format="°C"
            size="large"
            height="380"
          />
        </div>
        <div className="my-4 badge rounded-pill bg-secondary text-white p-2">Outdoor Temperature</div>
      </div>

    </div>
    {error ? <RB.Alert variant="danger" dismissible onClick={() => setError(null)} className="fixed-top m-2">{error}</RB.Alert> : ''}
  </div>)
}

export default App
