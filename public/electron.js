const electron = require('electron')
const app = electron.app
const ipcMain = electron.ipcMain
const net = electron.net
const BrowserWindow = electron.BrowserWindow
const path = require('path')
const isDev = require('electron-is-dev')
const singleInstanceLock = app.requestSingleInstanceLock()
const si = require('systeminformation')
require('osx-temperature-sensor') // systeminformation (si) dependency above will pick it up internally, but still needs requiring (electron-rebuild purposes)

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
    width: 700,
    height: 500,
    maximizable: false,
    backgroundColor: '#000000',
    show: false,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false
    }
  })
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

  mainWindow.webContents.on('did-finish-load', function () {
    mainWindow.webContents.insertCSS('html,body{ overflow: hidden !important; }')
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

const getCPUTenperature = () => {
  let temperatures
  try {
    temperatures = si.cpuTemperature()
  } catch (error) {
    console.error(error)
  }
  return temperatures
}

ipcMain.on('cpu-temperature', async event => {
  event.returnValue = await getCPUTenperature()
})

const getOutdoorTemperature = () => new Promise(resolve => {
  const request = net.request('https://fcc-weather-api.glitch.me/api/current?lat=51&lon=1') // Currently London. TODO: Get location automatically
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
})

ipcMain.on('outdoor-temperature', async event => {
  event.returnValue = await getOutdoorTemperature()
})
