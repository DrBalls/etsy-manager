// @ts-nocheck
globalThis.__plasmoInternalPortMap = new Map()

import { default as messagesBulkUpdate } from "~background/messages/bulk-update"
import { default as messagesQuickEdit } from "~background/messages/quick-edit"
import { default as messagesSyncListing } from "~background/messages/sync-listing"

chrome.runtime.onMessageExternal.addListener((request, sender, sendResponse) => {
  switch (request?.name) {
    
    default:
      break
  }

  return true
})

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  switch (request.name) {
    case "bulk-update":
  messagesBulkUpdate({
    ...request,
    sender
  }, {
    send: (p) => sendResponse(p)
  })
  break
case "quick-edit":
  messagesQuickEdit({
    ...request,
    sender
  }, {
    send: (p) => sendResponse(p)
  })
  break
case "sync-listing":
  messagesSyncListing({
    ...request,
    sender
  }, {
    send: (p) => sendResponse(p)
  })
  break
    default:
      break
  }

  return true
})

chrome.runtime.onConnect.addListener(function(port) {
  globalThis.__plasmoInternalPortMap.set(port.name, port)
  port.onMessage.addListener(function(request) {
    switch (port.name) {
      
      default:
        break
    }
  })
})

