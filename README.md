# Chain Sleuth: Advanced NEAR Protocol Analytics & Investigation Platform

Chain Sleuth is a comprehensive blockchain analytics platform designed specifically for the NEAR Protocol. It combines powerful data querying capabilities with AI-driven analysis to provide deep insights into account behavior, transaction patterns, and network trends.

## Core Components

### 1. Pipeline Service
The Pipeline Service is the backbone of Chain Sleuth's investigation capabilities:

- **Account Analysis**: Processes NEAR accounts to extract:
  - Transaction history and patterns
  - Token holdings and transfers
  - DeFi interactions
  - Smart contract interactions
  - Wealth analysis and financial metrics

- **State Management**: Uses Redis for real-time processing status:
  - Progress tracking
  - Metadata caching
  - Investigation results storage
  - Webhook handling for async updates

### 2. Query Engine
Our Query Engine interfaces with multiple data sources:

- **PikesPeak Integration**:
  - Account transaction counts
  - Balance tracking
  - Token transfers (incoming/outgoing)
  - Smart contract interactions

- **NEAR RPC Node**:
  - Real-time blockchain data
  - Account state queries
  - Contract state access
  - Transaction validation

### 3. AI Analysis Layer
Leverages the Bitte.ai Plugin system to:
- Generate human-readable investigation summaries
- Detect suspicious patterns
- Identify potential bot activities
- Analyze transaction behaviors
- Track fund flows and relationships

## Key Features

### Account Investigation
- Initiates comprehensive account analysis
- Tracks investigation progress
- Stores results in Redis
- Provides webhook updates

### Data Collection
- Transaction history aggregation
- Token balance tracking
- DeFi protocol interaction analysis
- Smart contract usage patterns

### Analysis & Reporting
- Bot detection algorithms
- Wealth analysis
- Transaction pattern recognition
- Relationship mapping
- Risk scoring

## API Endpoints

### Core Endpoints
1. Pipeline Processing:
   - `POST /api/pipeline` - Start new investigation
   - `GET /api/pipeline/status/{taskId}` - Check investigation status
   - `GET /api/pipeline/metadata/{accountId}` - Get account metadata

2. Query Engine:
   - `GET /api/query/transactions/{accountId}` - Get transaction history
   - `GET /api/query/tokens/{accountId}` - Get token holdings
   - `GET /api/query/defi/{accountId}` - Get DeFi interactions

### PikesPeak Integration
- Account Analysis:
  - `GET /api/pikespeak/account/{accountId}` - Get account overview
  - `GET /api/pikespeak/transactions/{accountId}` - Get transaction history
  - `GET /api/pikespeak/tokens/{accountId}` - Get token holdings

## Upcoming Features

### 1. On-Chain Metadata Storage
- NFT-based investigation records
- Permanent investigation results storage
- Decentralized access control
- Cross-reference capabilities

### 2. Smart Contract Implementation
Features planned:
- Investigation NFT minting
- Result storage and retrieval
- Access control and permissions
- Investigation status tracking
- Cross-platform integration

### 3. Enhanced Analytics
- Graph-based relationship mapping
- Machine learning-based pattern detection
- Advanced risk scoring
- Automated investigation triggers
- Custom investigation templates

### 4. Integration Features
- API key management
- Webhook customization
- Custom investigation parameters
- Batch processing capabilities
- Export functionality

## Technical Architecture

### Data Flow
1. Investigation Request → Pipeline Service
2. Pipeline → Query Engine
3. Query Engine → Multiple Data Sources
4. Data Aggregation → AI Analysis
5. Results → Redis Cache & Blockchain Storage
6. Webhook Updates → Client Application

### Storage Strategy
- Redis for real-time state
- NEAR blockchain for permanent records
- NFTs for investigation ownership
- Distributed storage for large datasets

## Development Roadmap

### Phase 1 (Current)
- Core pipeline implementation
- Basic query engine
- Redis integration
- Webhook system

### Phase 2 (In Progress)
- Smart contract development
- NFT-based storage
- Enhanced AI analysis
- Advanced querying capabilities

### Phase 3 (Planned)
- Graph database integration
- Machine learning models
- Custom investigation templates
- API marketplace

## Getting Started

### Prerequisites
- NEAR account and access keys
- Redis instance
- API keys (PikesPeak, etc.)
- Node.js environment

### Installation

bash
Install dependencies
pnpm install
Configure environment
cp .env.example .env.local
Start development server
pnpm dev


## Contributing
We welcome contributions! See our contributing guidelines for details on:
- Code style
- Pull request process
- Development workflow
- Testing requirements