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
import './tools/8ce17b52-915a-4b0d-94e8-c4902710a7d8.mjs';
import './tools/39bb2615-9148-4cb9-bf63-3279df82d1aa.mjs';
import './tools/52e91a59-c830-4812-b29d-66a5df0c2583.mjs';
import './tools/56d53159-eaf4-4654-a0ba-555a53e8471f.mjs';
import './tools/db200f92-78b3-44d8-aa6e-12acaf7c0281.mjs';
import './tools/cae89124-724a-41a3-940d-2f57d4204473.mjs';
import '@ai-sdk/openai';
import '@mastra/core/agent';
import '@mastra/memory';
import './tools/ba72a0c7-8e82-452f-a5e2-5c195c437881.mjs';
import './tools/825374ec-af01-4152-9b98-fcd3b70d74d5.mjs';
import './tools/1d1c0b70-4aad-4789-932a-0309a5e30740.mjs';
import './tools/b4b322fc-1a00-4208-b53c-bb0ebc4a8e18.mjs';
import './tools/46a2a6cb-cba5-4d87-9d8c-c0052476435e.mjs';
import './tools/7198e34f-7965-43d4-9d8c-8c41b24df067.mjs';
import './tools/889d368e-e693-424b-bff6-940806ed6999.mjs';
import './tools/ada075a3-2103-4a85-88e7-f3299ce4a9bb.mjs';
import './tools/c3705bf9-bb85-4623-bc04-0a70922ead89.mjs';
import './tools/c4d2db9e-e36b-43b2-92e0-34bacd1ea736.mjs';
import './tools/4d5875c3-2a08-41bc-8109-6e932a90091f.mjs';
import './tools/7f893c78-51bc-4f43-99af-1b58c0b5f72d.mjs';
import './tools/5debe302-e67b-48d1-b467-67447c7681bd.mjs';
import './tools/09426211-7832-49f6-a3bc-c5af556de6d8.mjs';
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
