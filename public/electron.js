const spawn = require('child_process').spawn
const electron = require('electron')
const app = electron.app
const ipcMain = electron.ipcMain
const net = electron.net
const BrowserWindow = electron.BrowserWindow
const path = require('path')
const isDev = require('electron-is-dev')
const singleInstanceLock = app.requestSingleInstanceLock()
const si = require('systeminformation')
process.platform === "darwin" && require('osx-temperature-sensor') // systeminformation (si) dependency above will pick it up internally, but still needs requiring (electron-rebuild purposes)

let mainWindow

if (!singleInstanceLock) {
  app.quit()
} else {
  app.on('second-instance', (event, commandLine, workingDirectory) => {
    // Do not open a second instance, focus our mainWindow
    if (mainWindow) {
      if (mainWindow.isMinimized()) {
        mainWindow.restore()
      }
      mainWindow.focus()
    }
  })
}

const createWindow = () => {
  mainWindow = new BrowserWindow({
    width: 600,
    height: 600,
    maximizable: false,
    backgroundColor: '#000000',
    show: false,
    frame: false,
    // titleBarStyle: "hidden", // osx 
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false
    }
  })
  mainWindow.setBackgroundColor('#000000');
  mainWindow.loadURL(
    isDev
      ? "http://localhost:3000"
      : `file://${path.join(__dirname, "../build/index.html")}`
  )
  mainWindow.on("closed", () => {
    mainWindow = null
  })
  mainWindow.once('ready-to-show', () => {
    mainWindow.show()
  })

  if (isDev) {
    // Open Console in development mode
    mainWindow.webContents.openDevTools()
  }
}

app.on("ready", createWindow)

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit()
  }
})

app.on("activate", () => {
  if (mainWindow === null) {
    createWindow()
  }
})

const getCPUTemperature = async () => {
  let cpuTemperature
  try {
    if (process.platform === 'linux') {
      linuxTemperature = spawn('cat', ['/sys/class/thermal/thermal_zone0/temp'])
      return linuxTemperature.stdout.on('data', data => {
        console.log(data/1000);
        return data/1000
      })
    } else {
      // osx & windows (limited)
      cpuTemperature = await si.cpuTemperature()
      return cpuTemperature.main || 'error'
    }
  } catch (error) {
    console.error(error)
    return 'error'
  }
}

ipcMain.on('cpu-temperature', async event => {
  event.returnValue = await getCPUTemperature()
})

const getOutdoorTemperature = () => new Promise(resolve => {
  try {
    const request = net.request('https://fcc-weather-api.glitch.me/api/current?lat=51&lon=1')
    let body = ''
    request.on('response', (response) => {
      response.on('data', chunk => body += chunk)
      response.on('end', () => {
        body = JSON.parse(body) || {}
        if (body.main && body.main.temp) {
          body = body.main.temp
          resolve(Math.round(body))
          return
        }
        resolve('error')
      })
    })
    request.end()
  } catch (e) {
    console.error(e)
    resolve('error')
  }

})

ipcMain.on('outdoor-temperature', async event => {
  event.returnValue = await getOutdoorTemperature()
})

ipcMain.on('quit-app', event => {
  return app.quit();
})

