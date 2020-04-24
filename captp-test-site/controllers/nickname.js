(function () {

  function renderElement () {
    if (!(controllers && controllers.nick)) {
      throw new Error('This view requires a nickname controller.')
    }

    const nickname = controllers.nick.get()
    return `<h3>${nickname}</h3>`
  }

  function registerView () {
    if (!(controllers && controllers['action-view'])) { return }
    controllers['action-view'].registerWalletView('nickname', renderElement)
  }

  console.log('attempting to register nickname view')
  registerView()

  let name = 'Anonymous'
  return harden({
    registerView,
    get: () => name,
    set: (newName) => { name = newName },
  })

})()
