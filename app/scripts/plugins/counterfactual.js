const Node = window.Node
const FirebaseServiceFactory = window.FirebaseServiceFactory
const ethers = window.ethers
const uuid = require('uuid')

// const ENV = 'dev'
const ENV = 'staging'

const FIREBASE_OPTIONS =
  ENV === 'dev'
    ? {
      apiKey: '',
      authDomain: '',
      databaseURL: `ws://localhost:5555`,
      projectId: '',
      storageBucket: '',
      messagingSenderId: '',
    }
    : {
      apiKey: 'AIzaSyA5fy_WIAw9mqm59mdN61CiaCSKg8yd4uw',
      authDomain: 'foobar-91a31.firebaseapp.com',
      databaseURL: 'https://foobar-91a31.firebaseio.com',
      projectId: 'foobar-91a31',
      storageBucket: 'foobar-91a31.appspot.com',
      messagingSenderId: '432199632441',
    }

const BASE_URL =
  ENV === 'dev'
    ? 'http://localhost:9000'
    : 'https://server-playground-staging.counterfactual.com'

const store = {
  // This implements partial path look ups for localStorage
  async get (desiredKey) {
    const entries = {}
    const allKeys = Object.keys(window.localStorage)
    for (const key of allKeys) {
      if (key.includes(desiredKey)) {
        const val = JSON.parse(window.localStorage.getItem(key))
        if (key === desiredKey) {
          return val
        }
        entries[key] = val
      } else if (key === desiredKey) {
        return JSON.parse(window.localStorage.getItem(key))
      }
    }
    for (const key of Object.keys(entries)) {
      const leafKey = key.split('/')[key.split('/').length - 1]
      const value = entries[key]
      delete entries[key]
      entries[leafKey] = value
    }
    return Object.keys(entries).length > 0 ? entries : undefined
  },
  async set (pairs) {
    pairs.forEach(({ key, value }) => {
      window.localStorage.setItem(key, JSON.stringify(value))
    })
    return true
  },
}

module.exports = class CounterfactualController {
  constructor ({ platform, provider } = {}) {
    this.nodeProviderConfig = {
      ports: {},
      eventHolder: {},
    }
    this.platform = platform

    const serviceFactory = new FirebaseServiceFactory(FIREBASE_OPTIONS)

    const nodeMnemonic =
      JSON.parse(window.localStorage.getItem(window.MNEMONIC_PATH)) ||
      ethers.Wallet.createRandom().mnemonic

    store
      .set([{ key: window.MNEMONIC_PATH, value: nodeMnemonic }])
      .then(async () => {
        const node = await this.createNode(serviceFactory)
        this.node = node

        if (this.platform && this.platform.addMessageListener) {
          this.platform.addMessageListener(
            async ({ action = '', origin, data }, { tab }) => {
              if (tab && tab.id) {
                if (!this.nodeProviderConfig.ports[tab.id]) {
                  this.configureMessagePorts(tab.id)
                }
                if (action === 'plugin_message') {
                  await this.handlePluginMessage(
                    data,
                    tab,
                    this.node)
                }
              }
            }
          )
        }
      })
  }

  async createNode (serviceFactory) {
    const messService = serviceFactory.createMessagingService('messaging')
    const provider = ethers.getDefaultProvider('kovan')
    const node = await Node.create(
      messService,
      store,
      {
        STORE_KEY_PREFIX: 'store',
      },
      provider,
      'kovan'
    )
    return { node, provider }
  }

  async handlePluginMessage (data, provider, tab, node) {
    switch (data.message) {
      case 'metamask:setup:initiate':
        this.metamaskSetupInit(provider, tab)
        break
      case 'metamask:request:deposit':
        await this.metamaskRequestDeposit(node, tab, data)
        break
      case 'cf-node-provider:init':
        this.cfNodeProviderInit(tab)
        break
    }
  }

  cfNodeProviderInit (tab) {
    const nodeProviderInitResponse = {
      message: 'cf-node-provider:port',
    }
    this.platform.sendMessage(
      {
        action: 'plugin_message_response',
        data: nodeProviderInitResponse,
      },
      { id: tab.id }
    )
  }

  async metamaskRequestDeposit (node, tab, data) {
    const NodeEventNameDepositStarted = 'depositStartedEvent'
    node.once(NodeEventNameDepositStarted, args => {
      const depositStartedResponse = {
        message: 'metamask:response:deposit',
        data: {
          ethPendingDepositTxHash: args.txHash,
          ethPendingDepositAmountWei: args.value,
        },
      }
      this.platform.sendMessage(
        {
          action: 'plugin_message_response',
          data: depositStartedResponse,
        },
        { id: tab.id }
      )
    })
    try {
      const amount = ethers.utils.bigNumberify(data.valueInWei)
      const NodeMethodNameDEPOSIT = 'deposit'
      await node.call(NodeMethodNameDEPOSIT, {
        type: NodeMethodNameDEPOSIT,
        requestId: uuid.v4(),
        params: {
          amount,
          multisigAddress: data.multisigAddress,
          notifyCounterparty: true,
        },
      })
    } catch (e) {
      console.error(e)
    }
  }

  static metamaskListenCreateChannelRPC () {
    const NodeEventNameCreateChannel = 'createChannelEvent'
    return new Promise((resolve, _reject) => {
      window.cfInstance.nodeProviderConfig.node.once(NodeEventNameCreateChannel, data => {
        return resolve(data)
      })
    })
  }

  static async metamaskRequestBalancesRPC (multisigAddress) {
    const query = {
      type: 'getFreeBalanceState',
      requestId: uuid.v4(),
      params: { multisigAddress },
    }
    const response = await window.cfInstance.nodeProviderConfig.node.call(query.type, query)
    return response.result.state
  }

  static metamaskGetNodeAddressRPC () {
    return window.cfInstance.nodeProviderConfig.node.publicIdentifier
  }

  metamaskSetupInit (provider, tab) {
    provider.getSigner = () => {
      const mockSigner = {}
      mockSigner.getAddress = () => {
        // Adding getSigner method to provider to "mock" web3 JSONRPC Provider
        return new Promise((resolve, reject) => {
          const getAddressCB = event => {
            if (
              event.data &&
              event.data.message === 'metamask:response:signer:address'
            ) {
              this.platform.removeMessageListener(getAddressCB)
              resolve(event.data.data)
            }
          }
          this.platform.addMessageListener(getAddressCB)
          const getSignerAddressMessage = {
            message: 'metamask:request:signer:address',
          }

  configureMessagePorts (tabId) {
    this.nodeProviderConfig.eventHolder[tabId] = []
    function relayMessageToNode (event) {
      this.node.emit(event.data.type, event.data)
    }

    function relayMessageToDapp (event) {
      try {
        if (!this.nodeProviderConfig.eventHolder[tabId].includes(event.type)) {
          // We only allow the same event type to be called in 20ms intervals to prevent multiple
          // messages being emitted for the same event
          this.nodeProviderConfig.eventHolder[tabId].push(event.type)
          this.nodeProviderConfig.ports[tabId].postMessage({
            name: 'cfNodeProvider',
            event,
          })
          window.setTimeout(() => {
            this.nodeProviderConfig.eventHolder[tabId].pop(event.type)
          }, 20)
        }
      } catch (error) {
        // There is sometimes a race condition where nodeProviderConfig.ports[tabId] is undefined
      }
    }

    this.node.on(
      'proposeInstallVirtual',
      relayMessageToDapp.bind(this)
    )
    this.node.on(
      'installVirtualEvent',
      relayMessageToDapp.bind(this)
    )
    this.node.on(
      'getAppInstanceDetails',
      relayMessageToDapp.bind(this)
    )
    this.node.on('getState', relayMessageToDapp.bind(this))
    this.node.on('takeAction', relayMessageToDapp.bind(this))
    this.node.on(
      'updateStateEvent',
      relayMessageToDapp.bind(this)
    )
    this.node.on('uninstallEvent', relayMessageToDapp.bind(this))

    const backgroundPort = this.platform.tabsConnect(tabId, 'cfNodeProvider')
    this.nodeProviderConfig.ports[tabId] = backgroundPort
    backgroundPort.onMessage.addListener(relayMessageToNode.bind(this))
    backgroundPort.onDisconnect.addListener(() => {
      delete this.nodeProviderConfig.ports[tabId]
    })
  }

  async playgroundRequestMatchmakeRPC () {
    const userToken = this.getUserToken()
    const matchmakeData = {
      type: 'matchmakingRequest',
      attributes: { matchmakeWith: 'HighRollerBot' },
    }
    const response = await fetch(`${BASE_URL}/api/matchmaking-requests`, {
      method: 'POST',
      body: JSON.stringify({
        data: matchmakeData,
      }),
      headers: {
        'Content-Type': 'application/json; charset=utf-8',
        Authorization: 'Bearer ' + userToken,
      },
    })
    const data = await response.json()
    return data.data
  }

  async playgroundRequestUserRPC () {
    const userToken = this.getUserToken()
    const response = await fetch(`${BASE_URL}/api/users/me`, {
      method: 'GET',
      headers: {
        Authorization: 'Bearer ' + userToken,
      },
    })
    const data = await response.json()
    const userData = data.data[0]
    const account = {
      balance: '0.2',
      user: Object.assign({
        id: userData.id,
        token: userToken,
      }, userData.attributes),
    }
    return account
  }

  getUserToken () {
    return window.localStorage.getItem(
      'playground:user:token'
    )
  }
}