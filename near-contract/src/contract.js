import { NearContract, NearBindgen, near, call, view, initialize, bytes, NearPromise } from 'near-sdk-js'
import metadata from './metadata.json'

@NearBindgen({ requireInit: true })
class QueryContract extends NearContract {
  constructor() {
    super()
    this.queryPrice = '1000000000000000000000000' // 1 NEAR
    this.owner = ''
  }

  @initialize({})
  init({ owner }) {
    this.owner = owner
  }

  @view({})
  get_contract_metadata() {
    return metadata
  }

  @call({})
  setQueryPrice({ price }) {
    this.assertOwner()
    this.queryPrice = price
  }

  @view({})
  getQueryPrice() {
    return this.queryPrice
  }

  @call({payableFunction: true})
  payForQuery() {
    const amount = near.attachedDeposit()
    if (amount.toString() !== this.queryPrice) {
      near.panic('Incorrect payment amount')
    }
    // Here you would typically emit an event or store the payment
    // For now, we'll just log it
    near.log(`Received payment of ${amount} for a query`)
    return true
  }

  @call({})
  mintNFT({ address, metadata }) {
    // Implement NFT minting logic here
    // For now, we'll just log the minting
    near.log(`Minted NFT for ${address} with metadata: ${JSON.stringify(metadata)}`)
    return true
  }

  assertOwner() {
    if (near.signerAccountId() !== this.owner) {
      near.panic('Only the owner can call this method')
    }
  }
}
