const electron = require("electron")
const app = electron.app
const BrowserWindow = electron.BrowserWindow
const path = require("path")
const isDev = require("electron-is-dev")
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
    width: 400, 
    height: 300,
    maximizable: false,
    backgroundColor: '#282C34',
    show: false,
    webPreferences: {
      nodeIntegration: true
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
  if (isDev) {
    // Open Console in development mode
    mainWindow.webContents.openDevTools()

    /* testing si */
    si.cpuTemperature()
      .then(data => console.log(data))
      .catch(error => console.error(error));

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
