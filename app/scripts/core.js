const harden = require('@agoric/harden')
const clone = require('deep-clone')
import { globals } from './lib/globals'

export function createCore ({ controllers = {} } = {}) {
  function makeApi () {
    const core = harden({
      controllers: harden(clone(controllers)),
      addRootController,
    })
  }

  const root = new Compartment({
    ...globals,
    addRootController,
    controllers,
    alert: harden((msg) => alert(msg)),
  })

  async function addRootController(name, code) {
    const agreed = confirm(`Would you like to install the following root controller in your MetaMask as "${name}"?:

${code}`)

    if (!agreed) {
      throw new Error('User rejected request.');
    }
    controllers[name] = root.evaluate(code)
    return controllers[name]
  }

  return makeApi
}

