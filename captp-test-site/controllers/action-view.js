(function() {

const topElement = {
  render: () => '<h1>Snap Wallet</h1>',
  // Linked list for ordering:
  nextEl: undefined,
}

function renderElements () {
  let output = ''
  let nextEl = topElement
  while (nextEl) {
    output += `<div class="plugin-el">${nextEl.render()}</div>`
    nextEl = nextEl.nextEl
  }

  return output
}

function getLastElement () {
  let el = topElement
  while (el.nextEl) { el = el.nextEl }
  return el
}

return harden({

  registerWalletView: async (name, render) => {
    const agreed = confirm(`Would you like to register the following view as ${name}?:

${render.toString()}`)
    if (!agreed) {
      throw new Error('User Rejected.')
    }

    let prior = getLastElement()
    const newEl = {
      render,
      nextEl: undefined,
    }
    prior.nextEl = newEl
  },

  render: async () => {
    return `
      ${renderElements()}
    `
  }
})

})()
