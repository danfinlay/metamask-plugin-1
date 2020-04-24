const harden = require('@agoric/harden')

window.addEventListener('load', () => {

  const getControllers = async () => {
    console.log('clicked', cProvider)
    const { E, getBootstrap } = cProvider
    const a = await E(E(getBootstrap()).controllers);
    console.dir(`a: ${JSON.stringify(a)}`)
  }
  getControllersButton.addEventListener('click', getControllers)

  const addNameController = async () => {
    console.log('clicked', cProvider)
    const { E, getBootstrap } = cProvider
    const a = await E(getBootstrap()).addRootController('nick', `
                                                        (function() {

        let name = 'Anonymous'
        return {
          get: () => name,
          set: (newName) => { name = newName },
        }
                                                        })()
                                                        `);
    console.dir(`a: ${JSON.stringify(a)}`)
  }
  addNameControllerButton.addEventListener('click', addNameController)

  const addHelloController = async () => {
    console.log('clicked', cProvider)
    const { E, getBootstrap } = cProvider
    const a = await E(getBootstrap()).addRootController('hello', `(${function () {
      return {
        greet: () => {
          if (!(controllers && controllers.nick)) {
            throw new Error('Must install name controller first.')
          }
          console.dir(controllers)
          const nick = controllers.nick.get()
          return "Hello, " + nick
        }
      }
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
    const controllers = await E(E(getBootstrap()).getControllers())
    debugger
    const greeting = await E(controllers.hello.greet())
    alert(greeting)
  })
})
