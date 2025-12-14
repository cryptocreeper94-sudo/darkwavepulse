import * as multisig from '@sqds/multisig';
import { Connection, PublicKey, Keypair, LAMPORTS_PER_SOL, SystemProgram, TransactionMessage } from '@solana/web3.js';
import Safe, { PredictedSafeProps } from '@safe-global/protocol-kit';
import SafeApiKit from '@safe-global/api-kit';
import { ethers } from 'ethers';
import crypto from 'crypto';
import { db } from '../db/client';
import { multisigVaults, vaultSigners, vaultProposals, proposalVotes, vaultActivityLog } from '../db/schema';
import { eq, and, desc } from 'drizzle-orm';

const HELIUS_API_KEY = process.env.HELIUS_API_KEY;
const SOLANA_RPC = HELIUS_API_KEY 
  ? `https://mainnet.helius-rpc.com/?api-key=${HELIUS_API_KEY}`
  : 'https://api.mainnet-beta.solana.com';

interface VaultConfig {
  name: string;
  description?: string;
  chainId: string;
  threshold: number;
  signers: { address: string; nickname?: string }[];
  timeLock?: number;
  spendingLimit?: number;
  userId: string;
  createKeyPublicKey?: string;
}

interface ProposalConfig {
  vaultId: string;
  title: string;
  description?: string;
  txType: 'transfer' | 'token_transfer' | 'config_change' | 'add_signer' | 'remove_signer' | 'change_threshold' | 'custom';
  toAddress?: string;
  amount?: number;
  tokenAddress?: string;
  tokenSymbol?: string;
  tokenDecimals?: number;
  newThreshold?: number;
  signerToAdd?: string;
  signerToRemove?: string;
  rawTxData?: string;
  createdBy: string;
}

const EVM_CHAINS: Record<string, { rpcUrl: string; chainId: number; safeApiUrl?: string }> = {
  ethereum: { rpcUrl: 'https://eth.llamarpc.com', chainId: 1, safeApiUrl: 'https://safe-transaction-mainnet.safe.global' },
  base: { rpcUrl: 'https://mainnet.base.org', chainId: 8453, safeApiUrl: 'https://safe-transaction-base.safe.global' },
  polygon: { rpcUrl: 'https://polygon-rpc.com', chainId: 137, safeApiUrl: 'https://safe-transaction-polygon.safe.global' },
  arbitrum: { rpcUrl: 'https://arb1.arbitrum.io/rpc', chainId: 42161, safeApiUrl: 'https://safe-transaction-arbitrum.safe.global' },
  bsc: { rpcUrl: 'https://bsc-dataseed.binance.org', chainId: 56, safeApiUrl: 'https://safe-transaction-bsc.safe.global' },
  optimism: { rpcUrl: 'https://mainnet.optimism.io', chainId: 10, safeApiUrl: 'https://safe-transaction-optimism.safe.global' },
  avalanche: { rpcUrl: 'https://api.avax.network/ext/bc/C/rpc', chainId: 43114, safeApiUrl: 'https://safe-transaction-avalanche.safe.global' },
  gnosis: { rpcUrl: 'https://rpc.gnosischain.com', chainId: 100, safeApiUrl: 'https://safe-transaction-gnosis-chain.safe.global' },
};

class MultiChainVaultService {
  private solanaConnection: Connection;

  constructor() {
    this.solanaConnection = new Connection(SOLANA_RPC, 'confirmed');
  }

  private generateId(): string {
    return crypto.randomBytes(16).toString('hex');
  }

  private isEVMChain(chainId: string): boolean {
    return chainId !== 'solana';
  }

  async getSupportedChains() {
    return [
      { id: 'solana', name: 'Solana', type: 'solana', protocol: 'Squads' },
      ...Object.entries(EVM_CHAINS).map(([id, config]) => ({
        id,
        name: id.charAt(0).toUpperCase() + id.slice(1),
        type: 'evm',
        chainId: config.chainId,
        protocol: 'Safe'
      }))
    ];
  }

  async createVault(config: VaultConfig): Promise<{ success: boolean; vault?: any; error?: string }> {
    try {
      const vaultId = this.generateId();
      const isEVM = this.isEVMChain(config.chainId);

      if (isEVM) {
        return await this.createEVMVault(vaultId, config);
      } else {
        return await this.createSolanaVault(vaultId, config);
      }
    } catch (error: any) {
      console.error('[Vault] Create error:', error);
      return { success: false, error: error.message };
    }
  }

  private async createSolanaVault(vaultId: string, config: VaultConfig) {
    if (!config.createKeyPublicKey) {
      throw new Error('createKeyPublicKey is required for Solana vaults. Generate a keypair client-side and provide the public key.');
    }

    const createKeyPubkey = new PublicKey(config.createKeyPublicKey);
    
    const [multisigPda] = multisig.getMultisigPda({
      createKey: createKeyPubkey,
    });

    const [vaultPda, vaultBump] = multisig.getVaultPda({
      multisigPda,
      index: 0,
    });

    const members = config.signers.map((signer: { address: string }) => ({
      key: new PublicKey(signer.address),
      permissions: multisig.types.Permissions.all(),
    }));

    const vaultRecord = {
      id: vaultId,
      userId: config.userId,
      name: config.name,
      description: config.description || null,
      chainType: 'solana',
      chainId: 'solana',
      vaultAddress: vaultPda.toBase58(),
      multisigPda: multisigPda.toBase58(),
      createKey: createKeyPubkey.toBase58(),
      vaultBump,
      transactionIndex: 0,
      threshold: config.threshold,
      timeLock: config.timeLock || 0,
      status: 'pending',
    };

    await db.insert(multisigVaults).values(vaultRecord);

    for (const [index, signer] of config.signers.entries()) {
      await db.insert(vaultSigners).values({
        id: this.generateId(),
        vaultId,
        address: signer.address,
        nickname: signer.nickname || null,
        role: index === 0 ? 'owner' : 'signer',
        canInitiate: true,
        canVote: true,
        canExecute: true,
        status: 'active',
        addedBy: config.userId,
      });
    }

    await this.logActivity(vaultId, 'vault_created', config.userId, {
      name: config.name,
      threshold: config.threshold,
      signersCount: config.signers.length,
      chainId: 'solana',
    });

    return {
      success: true,
      vault: {
        ...vaultRecord,
        signers: config.signers,
        members: members.map((m: { key: PublicKey }) => ({ key: m.key.toBase58(), permissions: 7 })),
        instructions: 'Sign the multisig creation transaction client-side using your createKey, then call /api/vault/activate with the tx hash.',
      },
    };
  }

  private async createEVMVault(vaultId: string, config: VaultConfig) {
    const chainConfig = EVM_CHAINS[config.chainId];
    if (!chainConfig) {
      throw new Error(`Unsupported EVM chain: ${config.chainId}`);
    }

    const owners = config.signers.map(s => s.address);
    const safeVersion = '1.4.1';
    
    const predictedSafe: PredictedSafeProps = {
      safeAccountConfig: {
        owners,
        threshold: config.threshold,
      },
      safeDeploymentConfig: {
        saltNonce: vaultId,
        safeVersion,
      },
    };

    let predictedAddress: string;
    let deploymentTransaction: any = null;

    try {
      const protocolKit = await Safe.init({
        provider: chainConfig.rpcUrl,
        predictedSafe,
      });

      predictedAddress = await protocolKit.getAddress();
      
      deploymentTransaction = await protocolKit.createSafeDeploymentTransaction();
    } catch (error: any) {
      console.error('[Vault] Safe SDK prediction error:', error);
      throw new Error(`Failed to predict Safe address: ${error.message}`);
    }

    const vaultRecord = {
      id: vaultId,
      userId: config.userId,
      name: config.name,
      description: config.description || null,
      chainType: 'evm',
      chainId: config.chainId,
      vaultAddress: predictedAddress,
      safeAddress: predictedAddress,
      safeVersion,
      threshold: config.threshold,
      timeLock: config.timeLock || 0,
      status: 'pending',
    };

    await db.insert(multisigVaults).values(vaultRecord);

    for (const [index, signer] of config.signers.entries()) {
      await db.insert(vaultSigners).values({
        id: this.generateId(),
        vaultId,
        address: signer.address,
        nickname: signer.nickname || null,
        role: index === 0 ? 'owner' : 'signer',
        canInitiate: true,
        canVote: true,
        canExecute: true,
        status: 'active',
        addedBy: config.userId,
      });
    }

    await this.logActivity(vaultId, 'vault_created', config.userId, {
      name: config.name,
      threshold: config.threshold,
      signersCount: config.signers.length,
      chainId: config.chainId,
    });

    return {
      success: true,
      vault: {
        ...vaultRecord,
        signers: config.signers,
        deploymentConfig: {
          owners,
          threshold: config.threshold,
          saltNonce: vaultId,
          safeVersion,
          rpcUrl: chainConfig.rpcUrl,
          chainId: chainConfig.chainId,
        },
        deploymentTransaction: deploymentTransaction ? {
          to: deploymentTransaction.to,
          value: deploymentTransaction.value,
          data: deploymentTransaction.data,
        } : null,
        instructions: 'To deploy this Safe, send the deployment transaction from any owner wallet.',
      },
    };
  }

  async prepareVaultDeployment(vaultId: string, deployerAddress: string) {
    const vault = await db.query.multisigVaults.findFirst({
      where: eq(multisigVaults.id, vaultId),
    });

    if (!vault) {
      return { success: false, error: 'Vault not found' };
    }

    const signers = await db.query.vaultSigners.findMany({
      where: eq(vaultSigners.vaultId, vaultId),
    });

    if (vault.chainType === 'solana') {
      return {
        success: true,
        chainType: 'solana',
        deploymentData: {
          multisigPda: vault.multisigPda,
          vaultAddress: vault.vaultAddress,
          createKey: vault.createKey,
          threshold: vault.threshold,
          timeLock: vault.timeLock,
          members: signers.map((s: { address: string }) => ({
            key: s.address,
            permissions: 7,
          })),
        },
        instructions: 'Sign this transaction with your Solana wallet to create the multisig vault.',
      };
    } else {
      const chainConfig = EVM_CHAINS[vault.chainId];
      const owners = signers.map((s: { address: string }) => s.address);
      
      const predictedSafe: PredictedSafeProps = {
        safeAccountConfig: {
          owners,
          threshold: vault.threshold,
        },
        safeDeploymentConfig: {
          saltNonce: vault.id,
          safeVersion: vault.safeVersion || '1.4.1',
        },
      };

      try {
        const protocolKit = await Safe.init({
          provider: chainConfig.rpcUrl,
          predictedSafe,
        });

        const deploymentTransaction = await protocolKit.createSafeDeploymentTransaction();

        return {
          success: true,
          chainType: 'evm',
          deploymentData: {
            safeAddress: vault.safeAddress,
            safeVersion: vault.safeVersion,
            owners,
            threshold: vault.threshold,
            saltNonce: vault.id,
            rpcUrl: chainConfig.rpcUrl,
            chainId: chainConfig.chainId,
          },
          deploymentTransaction: {
            to: deploymentTransaction.to,
            value: deploymentTransaction.value,
            data: deploymentTransaction.data,
          },
          instructions: 'Send this transaction from any owner wallet to deploy the Safe.',
        };
      } catch (error: any) {
        console.error('[Vault] Safe deployment preparation error:', error);
        return { success: false, error: `Failed to prepare deployment: ${error.message}` };
      }
    }
  }

  async activateVault(vaultId: string, txHash: string) {
    await db.update(multisigVaults)
      .set({ status: 'active', updatedAt: new Date() })
      .where(eq(multisigVaults.id, vaultId));

    await this.logActivity(vaultId, 'vault_activated', null, { txHash });

    return { success: true };
  }

  async getVaults(userId: string) {
    const vaults = await db.query.multisigVaults.findMany({
      where: eq(multisigVaults.userId, userId),
      orderBy: desc(multisigVaults.createdAt),
    });

    const vaultsWithSigners = await Promise.all(
      vaults.map(async (vault: typeof vaults[0]) => {
        const signers = await db.query.vaultSigners.findMany({
          where: eq(vaultSigners.vaultId, vault.id),
        });
        
        const pendingProposals = await db.query.vaultProposals.findMany({
          where: and(
            eq(vaultProposals.vaultId, vault.id),
            eq(vaultProposals.status, 'pending')
          ),
        });

        return {
          ...vault,
          signers,
          pendingProposalsCount: pendingProposals.length,
        };
      })
    );

    return vaultsWithSigners;
  }

  async getVaultsBySignerAddress(signerAddress: string) {
    const signerRecords = await db.query.vaultSigners.findMany({
      where: and(
        eq(vaultSigners.address, signerAddress),
        eq(vaultSigners.status, 'active')
      ),
    });

    const vaultIds = signerRecords.map((s: { vaultId: string }) => s.vaultId);
    
    if (vaultIds.length === 0) {
      return [];
    }

    const vaults = await Promise.all(
      vaultIds.map(async (vaultId: string) => {
        const vault = await db.query.multisigVaults.findFirst({
          where: eq(multisigVaults.id, vaultId),
        });
        
        if (!vault) return null;

        const signers = await db.query.vaultSigners.findMany({
          where: eq(vaultSigners.vaultId, vaultId),
        });

        return { ...vault, signers };
      })
    );

    return vaults.filter(Boolean);
  }

  async getVaultDetails(vaultId: string) {
    const vault = await db.query.multisigVaults.findFirst({
      where: eq(multisigVaults.id, vaultId),
    });

    if (!vault) {
      return { success: false, error: 'Vault not found' };
    }

    const signers = await db.query.vaultSigners.findMany({
      where: eq(vaultSigners.vaultId, vaultId),
    });

    const proposals = await db.query.vaultProposals.findMany({
      where: eq(vaultProposals.vaultId, vaultId),
      orderBy: desc(vaultProposals.createdAt),
    });

    const recentActivity = await db.query.vaultActivityLog.findMany({
      where: eq(vaultActivityLog.vaultId, vaultId),
      orderBy: desc(vaultActivityLog.createdAt),
      limit: 20,
    });

    let balance = null;
    if (vault.status === 'active') {
      balance = await this.getVaultBalance(vault);
    }

    return {
      success: true,
      vault: {
        ...vault,
        signers,
        proposals,
        recentActivity,
        balance,
      },
    };
  }

  private async getVaultBalance(vault: any) {
    try {
      if (vault.chainType === 'solana') {
        const pubkey = new PublicKey(vault.vaultAddress);
        const lamports = await this.solanaConnection.getBalance(pubkey);
        return {
          native: lamports / LAMPORTS_PER_SOL,
          symbol: 'SOL',
          usd: 0,
        };
      } else {
        const chainConfig = EVM_CHAINS[vault.chainId];
        const provider = new ethers.JsonRpcProvider(chainConfig.rpcUrl);
        const balance = await provider.getBalance(vault.vaultAddress);
        return {
          native: parseFloat(ethers.formatEther(balance)),
          symbol: 'ETH',
          usd: 0,
        };
      }
    } catch (error) {
      console.error('[Vault] Balance check error:', error);
      return null;
    }
  }

  async createProposal(config: ProposalConfig) {
    try {
      const vault = await db.query.multisigVaults.findFirst({
        where: eq(multisigVaults.id, config.vaultId),
      });

      if (!vault) {
        return { success: false, error: 'Vault not found' };
      }

      if (vault.status !== 'active') {
        return { success: false, error: 'Vault is not active' };
      }

      const existingProposals = await db.query.vaultProposals.findMany({
        where: eq(vaultProposals.vaultId, config.vaultId),
      });

      const proposalIndex = existingProposals.length + 1;
      const proposalId = this.generateId();

      let safeTxHash: string | null = null;
      let safeNonce: number | null = null;
      let signingData: any = null;

      if (vault.chainType === 'evm' && vault.safeAddress) {
        const chainConfig = EVM_CHAINS[vault.chainId];
        
        try {
          const protocolKit = await Safe.init({
            provider: chainConfig.rpcUrl,
            safeAddress: vault.safeAddress,
          });

          safeNonce = await protocolKit.getNonce();
          
          let txValue = '0';
          let txData = '0x';
          let txTo = config.toAddress || vault.safeAddress;

          if (config.txType === 'transfer' && config.toAddress && config.amount) {
            txValue = ethers.parseEther(config.amount.toString()).toString();
          } else if (config.rawTxData) {
            txData = config.rawTxData;
          }

          const safeTransaction = await protocolKit.createTransaction({
            transactions: [{
              to: txTo,
              value: txValue,
              data: txData,
            }],
            options: { nonce: safeNonce },
          });

          safeTxHash = await protocolKit.getTransactionHash(safeTransaction);
          
          signingData = {
            safeTxHash,
            safeNonce,
            domain: {
              chainId: chainConfig.chainId,
              verifyingContract: vault.safeAddress,
            },
            message: {
              to: txTo,
              value: txValue,
              data: txData,
              operation: 0,
              safeTxGas: 0,
              baseGas: 0,
              gasPrice: 0,
              gasToken: ethers.ZeroAddress,
              refundReceiver: ethers.ZeroAddress,
              nonce: safeNonce,
            },
          };
        } catch (error: any) {
          console.error('[Vault] Safe transaction creation error:', error);
          return { success: false, error: `Failed to create Safe transaction: ${error.message}` };
        }
      }

      const proposalRecord = {
        id: proposalId,
        vaultId: config.vaultId,
        title: config.title,
        description: config.description || null,
        proposalIndex,
        txType: config.txType,
        toAddress: config.toAddress || null,
        amount: config.amount?.toString() || null,
        tokenAddress: config.tokenAddress || null,
        tokenSymbol: config.tokenSymbol || null,
        tokenDecimals: config.tokenDecimals || null,
        newThreshold: config.newThreshold || null,
        signerToAdd: config.signerToAdd || null,
        signerToRemove: config.signerToRemove || null,
        rawTxData: config.rawTxData || null,
        safeTxHash,
        safeNonce,
        approvalsRequired: vault.threshold,
        approvalsReceived: 0,
        rejectionsReceived: 0,
        status: 'pending',
        createdBy: config.createdBy,
      };

      await db.insert(vaultProposals).values(proposalRecord);

      await this.logActivity(config.vaultId, 'proposal_created', config.createdBy, {
        proposalId,
        title: config.title,
        txType: config.txType,
        amount: config.amount,
      });

      return {
        success: true,
        proposal: proposalRecord,
        signingData,
      };
    } catch (error: any) {
      console.error('[Vault] Create proposal error:', error);
      return { success: false, error: error.message };
    }
  }

  async voteOnProposal(proposalId: string, signerAddress: string, vote: 'approve' | 'reject', signature?: string) {
    try {
      const proposal = await db.query.vaultProposals.findFirst({
        where: eq(vaultProposals.id, proposalId),
      });

      if (!proposal) {
        return { success: false, error: 'Proposal not found' };
      }

      if (proposal.status !== 'pending') {
        return { success: false, error: 'Proposal is not pending' };
      }

      const signer = await db.query.vaultSigners.findFirst({
        where: and(
          eq(vaultSigners.vaultId, proposal.vaultId),
          eq(vaultSigners.address, signerAddress),
          eq(vaultSigners.status, 'active')
        ),
      });

      if (!signer) {
        return { success: false, error: 'Not authorized to vote on this proposal' };
      }

      const existingVote = await db.query.proposalVotes.findFirst({
        where: and(
          eq(proposalVotes.proposalId, proposalId),
          eq(proposalVotes.signerAddress, signerAddress)
        ),
      });

      if (existingVote) {
        return { success: false, error: 'Already voted on this proposal' };
      }

      await db.insert(proposalVotes).values({
        id: this.generateId(),
        proposalId,
        vaultId: proposal.vaultId,
        signerAddress,
        vote,
        signature: signature || null,
      });

      const newApprovals = vote === 'approve' 
        ? (proposal.approvalsReceived || 0) + 1 
        : proposal.approvalsReceived || 0;
      const newRejections = vote === 'reject' 
        ? (proposal.rejectionsReceived || 0) + 1 
        : proposal.rejectionsReceived || 0;

      let newStatus = 'pending';
      if (newApprovals >= proposal.approvalsRequired) {
        newStatus = 'approved';
      }

      const vault = await db.query.multisigVaults.findFirst({
        where: eq(multisigVaults.id, proposal.vaultId),
      });
      
      const signers = await db.query.vaultSigners.findMany({
        where: eq(vaultSigners.vaultId, proposal.vaultId),
      });

      const remainingVotes = signers.length - (newApprovals + newRejections);
      if (newRejections > signers.length - proposal.approvalsRequired) {
        newStatus = 'rejected';
      }

      await db.update(vaultProposals)
        .set({
          approvalsReceived: newApprovals,
          rejectionsReceived: newRejections,
          status: newStatus,
          updatedAt: new Date(),
        })
        .where(eq(vaultProposals.id, proposalId));

      await this.logActivity(proposal.vaultId, 'vote_cast', signerAddress, {
        proposalId,
        vote,
        approvalsReceived: newApprovals,
        approvalsRequired: proposal.approvalsRequired,
      });

      return {
        success: true,
        proposal: {
          ...proposal,
          approvalsReceived: newApprovals,
          rejectionsReceived: newRejections,
          status: newStatus,
        },
        canExecute: newStatus === 'approved',
      };
    } catch (error: any) {
      console.error('[Vault] Vote error:', error);
      return { success: false, error: error.message };
    }
  }

  async prepareProposalExecution(proposalId: string, executorAddress: string) {
    const proposal = await db.query.vaultProposals.findFirst({
      where: eq(vaultProposals.id, proposalId),
    });

    if (!proposal) {
      return { success: false, error: 'Proposal not found' };
    }

    if (proposal.status !== 'approved') {
      return { success: false, error: 'Proposal is not approved' };
    }

    const vault = await db.query.multisigVaults.findFirst({
      where: eq(multisigVaults.id, proposal.vaultId),
    });

    if (!vault) {
      return { success: false, error: 'Vault not found' };
    }

    const votes = await db.query.proposalVotes.findMany({
      where: and(
        eq(proposalVotes.proposalId, proposalId),
        eq(proposalVotes.vote, 'approve')
      ),
    });

    if (vault.chainType === 'solana') {
      return {
        success: true,
        chainType: 'solana',
        executionData: {
          multisigPda: vault.multisigPda,
          vaultAddress: vault.vaultAddress,
          transactionIndex: proposal.proposalIndex,
          proposal: {
            txType: proposal.txType,
            toAddress: proposal.toAddress,
            amount: proposal.amount,
            tokenAddress: proposal.tokenAddress,
          },
        },
        instructions: 'Sign this transaction to execute the approved proposal.',
      };
    } else {
      const chainConfig = EVM_CHAINS[vault.chainId];
      
      if (!proposal.safeTxHash || proposal.safeNonce === null || proposal.safeNonce === undefined) {
        return { success: false, error: 'Missing Safe transaction metadata. This proposal may have been created before Safe integration was complete.' };
      }

      const vaultSignersList = await db.query.vaultSigners.findMany({
        where: and(
          eq(vaultSigners.vaultId, vault.id),
          eq(vaultSigners.status, 'active')
        ),
      });
      const authorizedAddresses = new Set(vaultSignersList.map((s: { address: string }) => s.address.toLowerCase()));

      const seenSigners = new Set<string>();
      const validSignatures: { signer: string; signature: string }[] = [];
      
      for (const vote of votes) {
        if (!vote.signature) continue;
        
        const signerLower = vote.signerAddress.toLowerCase();
        
        if (!authorizedAddresses.has(signerLower)) {
          console.warn(`[Vault] Signature from non-authorized address: ${vote.signerAddress}`);
          continue;
        }
        
        if (seenSigners.has(signerLower)) {
          console.warn(`[Vault] Duplicate signature from: ${vote.signerAddress}`);
          continue;
        }
        
        seenSigners.add(signerLower);
        validSignatures.push({
          signer: vote.signerAddress,
          signature: vote.signature,
        });
      }

      if (validSignatures.length < vault.threshold) {
        return { 
          success: false, 
          error: `Insufficient valid signatures: ${validSignatures.length}/${vault.threshold} required. Signatures must be from unique, authorized vault signers.` 
        };
      }

      const signatures = validSignatures;

      let txValue = '0';
      let txData = '0x';
      let txTo = proposal.toAddress || vault.safeAddress || '';

      if (proposal.txType === 'transfer' && proposal.toAddress && proposal.amount) {
        txValue = ethers.parseEther(proposal.amount.toString()).toString();
      } else if (proposal.rawTxData) {
        txData = proposal.rawTxData;
      }

      return {
        success: true,
        chainType: 'evm',
        executionData: {
          safeAddress: vault.safeAddress,
          rpcUrl: chainConfig.rpcUrl,
          chainId: chainConfig.chainId,
          nonce: proposal.safeNonce,
          safeTxHash: proposal.safeTxHash,
          transaction: {
            to: txTo,
            value: txValue,
            data: txData,
            operation: 0,
            safeTxGas: '0',
            baseGas: '0',
            gasPrice: '0',
            gasToken: ethers.ZeroAddress,
            refundReceiver: ethers.ZeroAddress,
          },
          proposal: {
            txType: proposal.txType,
            toAddress: proposal.toAddress,
            amount: proposal.amount,
            tokenAddress: proposal.tokenAddress,
          },
          signatures,
        },
        instructions: 'Execute this Safe transaction by calling executeTransaction on the Safe contract with the collected signatures.',
      };
    }
  }

  async markProposalExecuted(proposalId: string, executedBy: string, txHash: string) {
    const proposal = await db.query.vaultProposals.findFirst({
      where: eq(vaultProposals.id, proposalId),
    });

    if (!proposal) {
      return { success: false, error: 'Proposal not found' };
    }

    await db.update(vaultProposals)
      .set({
        status: 'executed',
        executedBy,
        executedTxHash: txHash,
        executedAt: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(vaultProposals.id, proposalId));

    await this.logActivity(proposal.vaultId, 'proposal_executed', executedBy, {
      proposalId,
      txHash,
      txType: proposal.txType,
      amount: proposal.amount,
    }, txHash);

    return { success: true };
  }

  async addSigner(vaultId: string, signerAddress: string, nickname: string | null, addedBy: string) {
    const existingSigner = await db.query.vaultSigners.findFirst({
      where: and(
        eq(vaultSigners.vaultId, vaultId),
        eq(vaultSigners.address, signerAddress)
      ),
    });

    if (existingSigner) {
      if (existingSigner.status === 'removed') {
        await db.update(vaultSigners)
          .set({ status: 'active', updatedAt: new Date() })
          .where(eq(vaultSigners.id, existingSigner.id));
        return { success: true, action: 'reactivated' };
      }
      return { success: false, error: 'Signer already exists' };
    }

    await db.insert(vaultSigners).values({
      id: this.generateId(),
      vaultId,
      address: signerAddress,
      nickname,
      role: 'signer',
      status: 'active',
      addedBy,
    });

    await this.logActivity(vaultId, 'signer_added', addedBy, {
      signerAddress,
      nickname,
    });

    return { success: true, action: 'added' };
  }

  async removeSigner(vaultId: string, signerAddress: string, removedBy: string) {
    const signer = await db.query.vaultSigners.findFirst({
      where: and(
        eq(vaultSigners.vaultId, vaultId),
        eq(vaultSigners.address, signerAddress),
        eq(vaultSigners.status, 'active')
      ),
    });

    if (!signer) {
      return { success: false, error: 'Signer not found' };
    }

    await db.update(vaultSigners)
      .set({ status: 'removed', updatedAt: new Date() })
      .where(eq(vaultSigners.id, signer.id));

    await this.logActivity(vaultId, 'signer_removed', removedBy, {
      signerAddress,
    });

    return { success: true };
  }

  async updateThreshold(vaultId: string, newThreshold: number, updatedBy: string) {
    const vault = await db.query.multisigVaults.findFirst({
      where: eq(multisigVaults.id, vaultId),
    });

    if (!vault) {
      return { success: false, error: 'Vault not found' };
    }

    const signers = await db.query.vaultSigners.findMany({
      where: and(
        eq(vaultSigners.vaultId, vaultId),
        eq(vaultSigners.status, 'active')
      ),
    });

    if (newThreshold > signers.length) {
      return { success: false, error: 'Threshold cannot exceed number of signers' };
    }

    if (newThreshold < 1) {
      return { success: false, error: 'Threshold must be at least 1' };
    }

    await db.update(multisigVaults)
      .set({ threshold: newThreshold, updatedAt: new Date() })
      .where(eq(multisigVaults.id, vaultId));

    await this.logActivity(vaultId, 'threshold_changed', updatedBy, {
      oldThreshold: vault.threshold,
      newThreshold,
    });

    return { success: true };
  }

  private async logActivity(
    vaultId: string,
    eventType: string,
    actorAddress: string | null,
    eventData: any,
    txHash?: string
  ) {
    await db.insert(vaultActivityLog).values({
      id: this.generateId(),
      vaultId,
      eventType,
      actorAddress,
      eventData: JSON.stringify(eventData),
      txHash: txHash || null,
    });
  }

  async getProposals(vaultId: string, status?: string) {
    const conditions = [eq(vaultProposals.vaultId, vaultId)];
    
    if (status) {
      conditions.push(eq(vaultProposals.status, status));
    }

    const proposals = await db.query.vaultProposals.findMany({
      where: and(...conditions),
      orderBy: desc(vaultProposals.createdAt),
    });

    const proposalsWithVotes = await Promise.all(
      proposals.map(async (proposal: typeof proposals[0]) => {
        const votes = await db.query.proposalVotes.findMany({
          where: eq(proposalVotes.proposalId, proposal.id),
        });
        return { ...proposal, votes };
      })
    );

    return proposalsWithVotes;
  }

  async getActivityLog(vaultId: string, limit = 50) {
    return await db.query.vaultActivityLog.findMany({
      where: eq(vaultActivityLog.vaultId, vaultId),
      orderBy: desc(vaultActivityLog.createdAt),
      limit,
    });
  }
}

export const vaultService = new MultiChainVaultService();
