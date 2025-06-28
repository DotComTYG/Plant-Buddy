// Preload script for Electron
const { contextBridge, ipcRenderer } = require('electron')

// Expose protected methods that allow the renderer process to use
// the ipcRenderer without exposing the entire object
contextBridge.exposeInMainWorld('electronAPI', {
    // Add any Electron-specific functionality here
    // For example, notifications, file system access, etc.
    sendNotification: (title, body) => {
        ipcRenderer.send('show-notification', { title, body })
    },
    
    // Get app version
    getVersion: () => ipcRenderer.invoke('get-version'),
    
    // Save data to file (future feature)
    saveToFile: (data) => ipcRenderer.invoke('save-to-file', data),
    
    // Load data from file (future feature)
    loadFromFile: () => ipcRenderer.invoke('load-from-file')
})
