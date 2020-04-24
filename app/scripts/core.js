const harden = require('@agoric/harden')
const clone = require('deep-clone')
import { globals } from './lib/globals'

export function createCore ({ controllers = {} } = {}) {
  function makeApi () {
    return harden({
      getControllers: () => {
        return harden(Object.keys(controllers))
      },
      getController: (name) => {
        if (!controllers[name]) {
          throw new Error(`This user has no controller named ${name}`)
        }
        return controllers[name]
      },
      addRootController,
    })
  }

  const root = new Compartment({
    ...globals,
    addRootController,
    controllers,
    alert: harden((msg) => alert(msg)),
    confirm: harden((msg) => confirm(msg)),
    harden,
  })

  async function addRootController(name, code) {
    const agreed = confirm(`Would you like to install the following root controller in your MetaMask as "${name}"?:

${code}`)

    if (!agreed) {
      throw new Error('User rejected request.');
    }
    controllers[name] = root.evaluate(code)
    console.log(`Added controller ${name}`, controllers[name])
    return controllers[name]
  }

  return makeApi
}

