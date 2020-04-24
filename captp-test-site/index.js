const harden = require('@agoric/harden')
const fs = require('fs')
const path = require('path')
const actionView = fs.readFileSync(path.join(__dirname, '/controllers/action-view.js')).toString()
const nickname = fs.readFileSync(path.join(__dirname, '/controllers/nickname.js')).toString()

window.addEventListener('load', () => {

  const getControllers = async () => {
    console.log('clicked', cProvider)
    const { E, getBootstrap } = cProvider
    const a = await E(getBootstrap()).getControllers();
    console.dir(`a: ${JSON.stringify(a)}`)
  }
  getControllersButton.addEventListener('click', getControllers)

  const injectEthereumProvider = async () => {
    const { E, getBootstrap } = cProvider
    const provider = await E(E(getBootstrap()).getController('ethereum')).getProvider('ropsten');
    window.ethereum = harden({
      send: async (method, params) => {
        return E(provider).send(method, params)
      }
    })
  }
  injectEthereumProviderButton.addEventListener('click', injectEthereumProvider)

  const addNameController = async () => {
    console.log('clicked', cProvider)
    const { E, getBootstrap } = cProvider
    const a = await E(getBootstrap()).addRootController('nick', nickname);
    console.dir(`a: ${JSON.stringify(a)}`)
  }
  addNameControllerButton.addEventListener('click', addNameController)

  const addHelloController = async () => {
    console.log('clicked', cProvider)
    const { E, getBootstrap } = cProvider
    const a = await E(getBootstrap()).addRootController('hello', `(${function () {
      return harden({
        greet: async () => {
          if (!(controllers && controllers.nick)) {
            throw new Error('Must install name controller first.')
          }
          console.dir(controllers)
          const nick = controllers.nick.get()
          return "Hello, " + nick
        }
      })
    }})()`);
    const greeting = await E(a).greet()
    console.log(greeting)
  }
  addHelloControllerButton.addEventListener('click', addHelloController)

  async function cheat () {
    await addNameController()
    await addHelloController()
  }

  sayHelloButton.addEventListener('click', async () => {
    console.log('clicked', cProvider)

    // await cheat()
    const { E, getBootstrap } = cProvider

    const greeting = await E(E(getBootstrap()).getController('hello')).greet()
    alert(greeting)
  })

  addActionViewButton.addEventListener('click', addActionView)
  async function addActionView () {
    const { E, getBootstrap } = cProvider
    console.log('attempting to add action view ', actionView)
    await E(getBootstrap()).addRootController('action-view', actionView)
  }

  addNicknameViewButton.addEventListener('click', addNicknameView)
  async function addNicknameView () {
    const { E, getBootstrap } = cProvider
    await E(E(getBootstrap()).getController('action-view')).registerWalletView('nickname', nicknameView)
  }

})
