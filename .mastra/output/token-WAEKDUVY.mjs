import { r as require_token_util } from './chunk-SIW6CYO3.mjs';
import { _ as __commonJS, r as require_token_error } from './index.mjs';
import '@mastra/core/eval';
import '@mastra/core/hooks';
import '@mastra/core/storage';
import '@mastra/core/scores/scoreTraces';
import '@mastra/core/utils';
import '@mastra/core';
import '@mastra/core/error';
import '@mastra/loggers';
import '@mastra/mcp';
import 'inngest';
import 'zod';
import 'drizzle-orm';
import 'axios';
import '@mastra/pg';
import '@inngest/realtime';
import '@mastra/inngest';
import 'crypto';
import './client.mjs';
import 'drizzle-orm/node-postgres';
import 'pg';
import 'drizzle-orm/pg-core';
import '@solana/web3.js';
import 'bs58';
import './technicalAnalysisTool.mjs';
import '@mastra/core/tools';
import 'technicalindicators';
import './subscriptionCheck.mjs';
import 'uuid';
import 'pino';
import 'ethers';
import './tools/80fb484b-4414-4d4e-8361-a8719c7fa862.mjs';
import './tools/1a05062b-e6ae-4f69-91e1-acf867c1c541.mjs';
import './tools/f7b13dd5-6a59-4d9a-937a-f3c9e2469b7c.mjs';
import './tools/3434570f-a68b-43d1-87d6-0a5befa27239.mjs';
import './tools/7808a400-4bac-44c1-95e8-d91205ebed3d.mjs';
import './tools/203baab7-3002-4fc5-aa73-65fbb13e624d.mjs';
import '@ai-sdk/openai';
import '@mastra/core/agent';
import '@mastra/memory';
import './tools/d0f200af-f319-483f-89c7-001bb4d4ed47.mjs';
import './tools/f07acc8f-efa8-4e31-a9c5-1d569cc4992b.mjs';
import './tools/49ac72b7-af14-4299-b5ab-c45bdc1a2434.mjs';
import './tools/6529c947-2601-498d-a408-401ef77681d5.mjs';
import './tools/28c1ab66-8317-451e-9b44-b3e518751f11.mjs';
import './tools/6f425571-e468-412d-ae19-eddf5d969e88.mjs';
import './tools/bc847d90-a932-43b6-8ed0-3547d25c404b.mjs';
import './tools/8781cb9e-bc25-4a9a-a5fa-b40500b6d189.mjs';
import './tools/376823ad-7309-4308-9aa4-4db5e3c2ccf1.mjs';
import './tools/db8fdf00-e82d-45bb-a3b1-560f08482419.mjs';
import './tools/b2b0584e-6f5a-44b0-9dd1-8d6be165fe6f.mjs';
import './tools/ca531808-a090-48e5-9b9d-b29040f72d9c.mjs';
import './tools/ca929340-ccbc-4f56-b9bf-012c3c82455b.mjs';
import './tools/8461386e-cdfd-48fc-a233-cba812f68391.mjs';
import 'stripe';
import 'bip39';
import 'ed25519-hd-key';
import '@trustwallet/wallet-core';
import '@solana/spl-token';
import '@sqds/multisig';
import '@safe-global/protocol-kit';
import 'bcrypt';
import '@simplewebauthn/server';
import 'fs/promises';
import 'https';
import 'path/posix';
import 'http';
import 'http2';
import 'stream';
import 'fs';
import 'path';
import '@mastra/core/runtime-context';
import '@mastra/core/telemetry';
import '@mastra/core/llm';
import '@mastra/core/stream';
import 'util';
import 'buffer';
import '@mastra/core/ai-tracing';
import '@mastra/core/utils/zod-to-json';
import '@mastra/core/a2a';
import 'stream/web';
import '@mastra/core/memory';
import 'zod/v4';
import 'zod/v3';
import 'child_process';
import 'module';
import 'os';
import '@mastra/core/workflows';
import './tools.mjs';

// ../../node_modules/.pnpm/@vercel+oidc@3.0.1/node_modules/@vercel/oidc/dist/token.js
var require_token = __commonJS({
  "../../node_modules/.pnpm/@vercel+oidc@3.0.1/node_modules/@vercel/oidc/dist/token.js"(exports, module) {
    var __defProp = Object.defineProperty;
    var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
    var __getOwnPropNames = Object.getOwnPropertyNames;
    var __hasOwnProp = Object.prototype.hasOwnProperty;
    var __export = (target, all) => {
      for (var name in all)
        __defProp(target, name, { get: all[name], enumerable: true });
    };
    var __copyProps = (to, from, except, desc) => {
      if (from && typeof from === "object" || typeof from === "function") {
        for (let key of __getOwnPropNames(from))
          if (!__hasOwnProp.call(to, key) && key !== except)
            __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
      }
      return to;
    };
    var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);
    var token_exports = {};
    __export(token_exports, {
      refreshToken: () => refreshToken
    });
    module.exports = __toCommonJS(token_exports);
    var import_token_error = require_token_error();
    var import_token_util = require_token_util();
    async function refreshToken() {
      const { projectId, teamId } = (0, import_token_util.findProjectInfo)();
      let maybeToken = (0, import_token_util.loadToken)(projectId);
      if (!maybeToken || (0, import_token_util.isExpired)((0, import_token_util.getTokenPayload)(maybeToken.token))) {
        const authToken = (0, import_token_util.getVercelCliToken)();
        if (!authToken) {
          throw new import_token_error.VercelOidcTokenError(
            "Failed to refresh OIDC token: login to vercel cli"
          );
        }
        if (!projectId) {
          throw new import_token_error.VercelOidcTokenError(
            "Failed to refresh OIDC token: project id not found"
          );
        }
        maybeToken = await (0, import_token_util.getVercelOidcToken)(authToken, projectId, teamId);
        if (!maybeToken) {
          throw new import_token_error.VercelOidcTokenError("Failed to refresh OIDC token");
        }
        (0, import_token_util.saveToken)(maybeToken, projectId);
      }
      process.env.VERCEL_OIDC_TOKEN = maybeToken.token;
      return;
    }
  }
});
var tokenWAEKDUVY = require_token();

export { tokenWAEKDUVY as default };
//# sourceMappingURL=token-WAEKDUVY.mjs.map
