
// this must run before anything else
import './lib/freezeGlobals'

// polyfills
import 'abortcontroller-polyfill/dist/polyfill-patch-fetch'

import PortStream from 'extension-port-stream'
import { getEnvironmentType } from './lib/util'

import {
  ENVIRONMENT_TYPE_FULLSCREEN,
  ENVIRONMENT_TYPE_POPUP,
} from './lib/enums'

import extension from 'extensionizer'
import ExtensionPlatform from './platforms/extension'

import { EventEmitter } from 'events'
const makeCapTpFromStream = require('captp-stream');
const harden = require('@agoric/harden')
import urlUtil from 'url'
import log from 'loglevel'

start().catch(log.error)

async function start () {

  // create platform global
  global.platform = new ExtensionPlatform()

  // setup sentry error reporting
  const release = global.platform.getVersion()
  // provide app state to append to error logs
  // identify window type (popup, notification)
  const windowType = getEnvironmentType()

  // setup stream to background
  const extensionPort = extension.runtime.connect({ name: windowType })
  const connectionStream = new PortStream(extensionPort)

  const activeTab = await queryCurrentActiveTab(windowType)

  try {
    await setupControllerConnection(connectionStream)
  } catch (err) {
    displayCriticalError(document.body, err)
  }

  function displayCriticalError (container, err) {
    container.innerHTML = '<div class="critical-error">The MetaMask app failed to load: please open and close MetaMask again to restart.</div>'
    container.style.height = '80px'
    log.error(err.stack)
    throw err
  }

}

async function queryCurrentActiveTab (windowType) {
  return new Promise((resolve) => {
    // At the time of writing we only have the `activeTab` permission which means
    // that this query will only succeed in the popup context (i.e. after a "browserAction")
    if (windowType !== ENVIRONMENT_TYPE_POPUP) {
      resolve({})
      return
    }

    extension.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      const [activeTab] = tabs
      const { title, url } = activeTab
      const { hostname: origin, protocol } = url ? urlUtil.parse(url) : {}
      resolve({
        title, origin, protocol, url,
      })
    })
  })
}

/**
 * Establishes a streamed connection to the background account manager
 *
 * @param {PortDuplexStream} connectionStream - PortStream instance establishing a background connection
 * @param {Function} cb - Called when the remote account manager connection is established
 */
async function setupControllerConnection (connectionStream) {
  const cProvider = makeCapTpFromStream('client', connectionStream, harden({}));
  window.cProvider = cProvider;
  const { E, getBootstrap } = cProvider;
  const body = await E(E(getBootstrap()).getController('action-view')).render()
  document.body.innerHTML = body
}
