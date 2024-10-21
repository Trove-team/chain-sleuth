import {
    NearBindgen,
    near,
    call,
    view,
    initialize,
    LookupMap,
    UnorderedMap,
    assert,
  } from 'near-sdk-js';
  
  interface NFTMetadata {
    title: string;
    description: string;
    media: string;
    summary: string;
    queried_name: string;
    querier: string;
    reputation_score: number;
  }
  
  @NearBindgen({})
  class NFTContract {
    owner: string;
    nftMetadata: LookupMap<any>;
    tokenToOwner: LookupMap<string>;
    ownerToTokens: UnorderedMap<string[]>;
    mintPrice: bigint;
    totalSupply: number;
  
    constructor() {
      this.owner = '';
      this.nftMetadata = new LookupMap('nft_metadata');
      this.tokenToOwner = new LookupMap('token_to_owner');
      this.ownerToTokens = new UnorderedMap('owner_to_tokens');
      this.mintPrice = BigInt(1 * 1e24); // 1 NEAR
      this.totalSupply = 0;
    }
  
    @initialize({})
    init({ owner }: { owner: string }): void {
      this.owner = owner;
    }
  
    @call({ payableFunction: true })
    mint_nft({ token_id, metadata, recipient }: { token_id: string; metadata: NFTMetadata; recipient: string }): void {
      const deposit = BigInt(near.attachedDeposit());
      assert(deposit >= this.mintPrice, "Not enough attached deposit");
      assert(!this.tokenToOwner.get(token_id), "Token already exists");
  
      this.nftMetadata.set(token_id, metadata);
      this.tokenToOwner.set(token_id, recipient);
  
      const recipientTokens = this.ownerToTokens.get(recipient) || [];
      recipientTokens.push(token_id);
      this.ownerToTokens.set(recipient, recipientTokens);
  
      this.totalSupply += 1;
  
      near.log(`Minted NFT ${token_id} for ${recipient} with metadata: ${JSON.stringify(metadata)}`);
    }
  
    @view({})
    nft_token({ token_id }: { token_id: string }): any | null {
      const metadata = this.nftMetadata.get(token_id);
      const owner_id = this.tokenToOwner.get(token_id);
      if (!metadata || !owner_id) return null;
      return { token_id, owner_id, metadata };
    }
  
    @view({})
    nft_tokens_for_owner({ account_id }: { account_id: string }): string[] {
      return this.ownerToTokens.get(account_id) || [];
    }
  
    @call({})
    nft_transfer({ receiver_id, token_id }: { receiver_id: string; token_id: string }): void {
      const sender_id = near.predecessorAccountId();
      const owner_id = this.tokenToOwner.get(token_id);
      assert(owner_id === sender_id, "Sender must be the owner of the token");
  
      this.tokenToOwner.set(token_id, receiver_id);
  
      const senderTokens = this.ownerToTokens.get(sender_id) || [];
      const updatedSenderTokens = senderTokens.filter(id => id !== token_id);
      this.ownerToTokens.set(sender_id, updatedSenderTokens);
  
      const receiverTokens = this.ownerToTokens.get(receiver_id) || [];
      receiverTokens.push(token_id);
      this.ownerToTokens.set(receiver_id, receiverTokens);
  
      near.log(`Transferred NFT ${token_id} from ${sender_id} to ${receiver_id}`);
    }
  
    @call({})
    set_mint_price({ new_price }: { new_price: string }): void {
      this.assert_owner();
      this.mintPrice = BigInt(new_price);
    }
  
    @view({})
    get_mint_price(): string {
      return this.mintPrice.toString();
    }
  
    @view({})
    nft_total_supply(): number {
      return this.totalSupply;
    }
  
    private assert_owner(): void {
      assert(near.predecessorAccountId() === this.owner, "Only the owner can call this method");
    }
  }
