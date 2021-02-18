const electron = require('electron')
const app = electron.app
const ipcMain = electron.ipcMain
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
    width: 400, 
    height: 300,
    maximizable: false,
    backgroundColor: '#f1f1f1',
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

ipcMain.handle('cpu-temperature', (event, arg) => si.cpuTemperature()
  .then(data => data)
  .catch(error => {
    console.error(error)
    return null;
  })
)