import { vaultService } from '../../services/vaultService';

export const vaultRoutes = [
  {
    path: "/api/vault/chains",
    method: "GET" as const,
    createHandler: async ({ mastra }: any) => async (c: any) => {
      const logger = mastra.getLogger();
      try {
        const chains = await vaultService.getSupportedChains();
        return c.json({ success: true, chains });
      } catch (error: any) {
        logger?.error('❌ [Vault] Get chains error', { error: error.message });
        return c.json({ error: error.message }, 500);
      }
    }
  },

  {
    path: "/api/vault/create",
    method: "POST" as const,
    createHandler: async ({ mastra }: any) => async (c: any) => {
      const logger = mastra.getLogger();
      try {
        const body = await c.req.json();
        const { name, description, chainId, threshold, signers, timeLock, spendingLimit, userId, createKeyPublicKey } = body;

        if (!name || !chainId || !threshold || !signers || !userId) {
          return c.json({ error: 'Missing required fields: name, chainId, threshold, signers, userId' }, 400);
        }

        if (chainId === 'solana' && !createKeyPublicKey) {
          return c.json({ error: 'createKeyPublicKey is required for Solana vaults. Generate a keypair client-side and provide the public key.' }, 400);
        }

        if (signers.length < threshold) {
          return c.json({ error: 'Number of signers must be >= threshold' }, 400);
        }

        logger?.info('🔐 [Vault] Creating vault', { name, chainId, threshold, signersCount: signers.length });

        const result = await vaultService.createVault({
          name,
          description,
          chainId,
          threshold,
          signers,
          timeLock,
          spendingLimit,
          userId,
          createKeyPublicKey,
        });

        if (result.success) {
          logger?.info('✅ [Vault] Vault created', { vaultId: result.vault?.id });
        }

        return c.json(result);
      } catch (error: any) {
        logger?.error('❌ [Vault] Create error', { error: error.message });
        return c.json({ success: false, error: error.message }, 500);
      }
    }
  },

  {
    path: "/api/vault/prepare-deployment",
    method: "POST" as const,
    createHandler: async ({ mastra }: any) => async (c: any) => {
      const logger = mastra.getLogger();
      try {
        const { vaultId, deployerAddress } = await c.req.json();

        if (!vaultId || !deployerAddress) {
          return c.json({ error: 'vaultId and deployerAddress required' }, 400);
        }

        const result = await vaultService.prepareVaultDeployment(vaultId, deployerAddress);
        return c.json(result);
      } catch (error: any) {
        logger?.error('❌ [Vault] Prepare deployment error', { error: error.message });
        return c.json({ success: false, error: error.message }, 500);
      }
    }
  },

  {
    path: "/api/vault/activate",
    method: "POST" as const,
    createHandler: async ({ mastra }: any) => async (c: any) => {
      const logger = mastra.getLogger();
      try {
        const { vaultId, txHash } = await c.req.json();

        if (!vaultId || !txHash) {
          return c.json({ error: 'vaultId and txHash required' }, 400);
        }

        const result = await vaultService.activateVault(vaultId, txHash);
        logger?.info('✅ [Vault] Vault activated', { vaultId, txHash });
        return c.json(result);
      } catch (error: any) {
        logger?.error('❌ [Vault] Activate error', { error: error.message });
        return c.json({ success: false, error: error.message }, 500);
      }
    }
  },

  {
    path: "/api/vault/list",
    method: "GET" as const,
    createHandler: async ({ mastra }: any) => async (c: any) => {
      const logger = mastra.getLogger();
      try {
        const userId = c.req.query('userId');

        if (!userId) {
          return c.json({ error: 'userId required' }, 400);
        }

        const vaults = await vaultService.getVaults(userId);
        return c.json({ success: true, vaults });
      } catch (error: any) {
        logger?.error('❌ [Vault] List error', { error: error.message });
        return c.json({ success: false, error: error.message }, 500);
      }
    }
  },

  {
    path: "/api/vault/by-signer",
    method: "GET" as const,
    createHandler: async ({ mastra }: any) => async (c: any) => {
      const logger = mastra.getLogger();
      try {
        const signerAddress = c.req.query('address');

        if (!signerAddress) {
          return c.json({ error: 'address required' }, 400);
        }

        const vaults = await vaultService.getVaultsBySignerAddress(signerAddress);
        return c.json({ success: true, vaults });
      } catch (error: any) {
        logger?.error('❌ [Vault] Get by signer error', { error: error.message });
        return c.json({ success: false, error: error.message }, 500);
      }
    }
  },

  {
    path: "/api/vault/:vaultId",
    method: "GET" as const,
    createHandler: async ({ mastra }: any) => async (c: any) => {
      const logger = mastra.getLogger();
      try {
        const vaultId = c.req.param('vaultId');
        const result = await vaultService.getVaultDetails(vaultId);
        return c.json(result);
      } catch (error: any) {
        logger?.error('❌ [Vault] Get details error', { error: error.message });
        return c.json({ success: false, error: error.message }, 500);
      }
    }
  },

  {
    path: "/api/vault/proposal/create",
    method: "POST" as const,
    createHandler: async ({ mastra }: any) => async (c: any) => {
      const logger = mastra.getLogger();
      try {
        const body = await c.req.json();
        const { vaultId, title, description, txType, toAddress, amount, tokenAddress, tokenSymbol, tokenDecimals, newThreshold, signerToAdd, signerToRemove, rawTxData, createdBy } = body;

        if (!vaultId || !title || !txType || !createdBy) {
          return c.json({ error: 'Missing required fields: vaultId, title, txType, createdBy' }, 400);
        }

        logger?.info('📝 [Vault] Creating proposal', { vaultId, title, txType });

        const result = await vaultService.createProposal({
          vaultId,
          title,
          description,
          txType,
          toAddress,
          amount,
          tokenAddress,
          tokenSymbol,
          tokenDecimals,
          newThreshold,
          signerToAdd,
          signerToRemove,
          rawTxData,
          createdBy,
        });

        if (result.success) {
          logger?.info('✅ [Vault] Proposal created', { proposalId: result.proposal?.id });
        }

        return c.json(result);
      } catch (error: any) {
        logger?.error('❌ [Vault] Create proposal error', { error: error.message });
        return c.json({ success: false, error: error.message }, 500);
      }
    }
  },

  {
    path: "/api/vault/proposal/vote",
    method: "POST" as const,
    createHandler: async ({ mastra }: any) => async (c: any) => {
      const logger = mastra.getLogger();
      try {
        const { proposalId, signerAddress, vote, signature } = await c.req.json();

        if (!proposalId || !signerAddress || !vote) {
          return c.json({ error: 'Missing required fields: proposalId, signerAddress, vote' }, 400);
        }

        if (vote !== 'approve' && vote !== 'reject') {
          return c.json({ error: 'Vote must be "approve" or "reject"' }, 400);
        }

        logger?.info('🗳️ [Vault] Voting on proposal', { proposalId, signerAddress, vote });

        const result = await vaultService.voteOnProposal(proposalId, signerAddress, vote, signature);

        if (result.success) {
          logger?.info('✅ [Vault] Vote recorded', { proposalId, vote, canExecute: result.canExecute });
        }

        return c.json(result);
      } catch (error: any) {
        logger?.error('❌ [Vault] Vote error', { error: error.message });
        return c.json({ success: false, error: error.message }, 500);
      }
    }
  },

  {
    path: "/api/vault/proposal/prepare-execution",
    method: "POST" as const,
    createHandler: async ({ mastra }: any) => async (c: any) => {
      const logger = mastra.getLogger();
      try {
        const { proposalId, executorAddress } = await c.req.json();

        if (!proposalId || !executorAddress) {
          return c.json({ error: 'proposalId and executorAddress required' }, 400);
        }

        const result = await vaultService.prepareProposalExecution(proposalId, executorAddress);
        return c.json(result);
      } catch (error: any) {
        logger?.error('❌ [Vault] Prepare execution error', { error: error.message });
        return c.json({ success: false, error: error.message }, 500);
      }
    }
  },

  {
    path: "/api/vault/proposal/executed",
    method: "POST" as const,
    createHandler: async ({ mastra }: any) => async (c: any) => {
      const logger = mastra.getLogger();
      try {
        const { proposalId, executedBy, txHash } = await c.req.json();

        if (!proposalId || !executedBy || !txHash) {
          return c.json({ error: 'proposalId, executedBy, and txHash required' }, 400);
        }

        const result = await vaultService.markProposalExecuted(proposalId, executedBy, txHash);
        logger?.info('✅ [Vault] Proposal marked executed', { proposalId, txHash });
        return c.json(result);
      } catch (error: any) {
        logger?.error('❌ [Vault] Mark executed error', { error: error.message });
        return c.json({ success: false, error: error.message }, 500);
      }
    }
  },

  {
    path: "/api/vault/proposals",
    method: "GET" as const,
    createHandler: async ({ mastra }: any) => async (c: any) => {
      const logger = mastra.getLogger();
      try {
        const vaultId = c.req.query('vaultId');
        const status = c.req.query('status');

        if (!vaultId) {
          return c.json({ error: 'vaultId required' }, 400);
        }

        const proposals = await vaultService.getProposals(vaultId, status);
        return c.json({ success: true, proposals });
      } catch (error: any) {
        logger?.error('❌ [Vault] Get proposals error', { error: error.message });
        return c.json({ success: false, error: error.message }, 500);
      }
    }
  },

  {
    path: "/api/vault/signer/add",
    method: "POST" as const,
    createHandler: async ({ mastra }: any) => async (c: any) => {
      const logger = mastra.getLogger();
      try {
        const { vaultId, signerAddress, nickname, addedBy } = await c.req.json();

        if (!vaultId || !signerAddress || !addedBy) {
          return c.json({ error: 'vaultId, signerAddress, and addedBy required' }, 400);
        }

        const result = await vaultService.addSigner(vaultId, signerAddress, nickname, addedBy);
        logger?.info('✅ [Vault] Signer added', { vaultId, signerAddress });
        return c.json(result);
      } catch (error: any) {
        logger?.error('❌ [Vault] Add signer error', { error: error.message });
        return c.json({ success: false, error: error.message }, 500);
      }
    }
  },

  {
    path: "/api/vault/signer/remove",
    method: "POST" as const,
    createHandler: async ({ mastra }: any) => async (c: any) => {
      const logger = mastra.getLogger();
      try {
        const { vaultId, signerAddress, removedBy } = await c.req.json();

        if (!vaultId || !signerAddress || !removedBy) {
          return c.json({ error: 'vaultId, signerAddress, and removedBy required' }, 400);
        }

        const result = await vaultService.removeSigner(vaultId, signerAddress, removedBy);
        logger?.info('✅ [Vault] Signer removed', { vaultId, signerAddress });
        return c.json(result);
      } catch (error: any) {
        logger?.error('❌ [Vault] Remove signer error', { error: error.message });
        return c.json({ success: false, error: error.message }, 500);
      }
    }
  },

  {
    path: "/api/vault/threshold",
    method: "POST" as const,
    createHandler: async ({ mastra }: any) => async (c: any) => {
      const logger = mastra.getLogger();
      try {
        const { vaultId, newThreshold, updatedBy } = await c.req.json();

        if (!vaultId || !newThreshold || !updatedBy) {
          return c.json({ error: 'vaultId, newThreshold, and updatedBy required' }, 400);
        }

        const result = await vaultService.updateThreshold(vaultId, newThreshold, updatedBy);
        logger?.info('✅ [Vault] Threshold updated', { vaultId, newThreshold });
        return c.json(result);
      } catch (error: any) {
        logger?.error('❌ [Vault] Update threshold error', { error: error.message });
        return c.json({ success: false, error: error.message }, 500);
      }
    }
  },

  {
    path: "/api/vault/activity",
    method: "GET" as const,
    createHandler: async ({ mastra }: any) => async (c: any) => {
      const logger = mastra.getLogger();
      try {
        const vaultId = c.req.query('vaultId');
        const limit = parseInt(c.req.query('limit') || '50');

        if (!vaultId) {
          return c.json({ error: 'vaultId required' }, 400);
        }

        const activity = await vaultService.getActivityLog(vaultId, limit);
        return c.json({ success: true, activity });
      } catch (error: any) {
        logger?.error('❌ [Vault] Get activity error', { error: error.message });
        return c.json({ success: false, error: error.message }, 500);
      }
    }
  },

  {
    path: "/api/vault/settings",
    method: "PUT" as const,
    createHandler: async ({ mastra }: any) => async (c: any) => {
      const logger = mastra.getLogger();
      try {
        const { vaultId, spendingLimit, spendingLimitToken, timeLock, updatedBy } = await c.req.json();

        if (!vaultId || !updatedBy) {
          return c.json({ error: 'vaultId and updatedBy required' }, 400);
        }

        logger?.info('⚙️ [Vault] Updating vault settings', { vaultId, spendingLimit, timeLock });

        const result = await vaultService.updateVaultSettings(vaultId, {
          spendingLimit,
          spendingLimitToken,
          timeLock,
        }, updatedBy);

        if (result.success) {
          logger?.info('✅ [Vault] Settings updated', { vaultId });
        }

        return c.json(result);
      } catch (error: any) {
        logger?.error('❌ [Vault] Update settings error', { error: error.message });
        return c.json({ success: false, error: error.message }, 500);
      }
    }
  },

  {
    path: "/api/vault/signer/role",
    method: "PUT" as const,
    createHandler: async ({ mastra }: any) => async (c: any) => {
      const logger = mastra.getLogger();
      try {
        const { vaultId, signerAddress, role, updatedBy } = await c.req.json();

        if (!vaultId || !signerAddress || !role || !updatedBy) {
          return c.json({ error: 'vaultId, signerAddress, role, and updatedBy required' }, 400);
        }

        logger?.info('👤 [Vault] Updating signer role', { vaultId, signerAddress, role });

        const result = await vaultService.updateSignerRole(vaultId, signerAddress, role, updatedBy);

        if (result.success) {
          logger?.info('✅ [Vault] Signer role updated', { vaultId, signerAddress, role });
        }

        return c.json(result);
      } catch (error: any) {
        logger?.error('❌ [Vault] Update signer role error', { error: error.message });
        return c.json({ success: false, error: error.message }, 500);
      }
    }
  },
];
