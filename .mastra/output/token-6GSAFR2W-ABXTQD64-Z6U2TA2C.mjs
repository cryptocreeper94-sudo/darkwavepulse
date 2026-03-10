import { r as require_token_util } from './chunk-OS7SAIRA.mjs';
import { _ as __commonJS, r as require_token_error } from './index.mjs';
import '@mastra/core/evals/scoreTraces';
import '@mastra/core';
import '@mastra/core/error';
import '@mastra/loggers';
import '@mastra/mcp';
import 'inngest';
import 'zod';
import 'drizzle-orm';
import './coinGeckoClient.mjs';
import 'axios';
import 'fs';
import 'path';
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
import 'twilio';
import 'ethers';
import './tools/26fe0525-67ef-49fe-b660-3222382c9010.mjs';
import './tools/513cf36f-8e2d-40bd-b04c-9b6f430fb39d.mjs';
import './tools/2ebd7628-ef28-4abb-82c4-eebe888c169c.mjs';
import './tools/34592cef-711e-46dd-b31c-df043cfbbf52.mjs';
import './tools/e4d641b9-011b-4ca6-aef7-49ece37df71d.mjs';
import './tools/9899591a-7b32-4d5d-a085-0968ef72d84f.mjs';
import '@ai-sdk/openai';
import '@mastra/core/agent';
import '@mastra/memory';
import './tools/9e987033-7655-44f1-9fb0-418f5579b8d2.mjs';
import './tools/e28fa757-b4cf-4b45-a237-7ada35f97918.mjs';
import './tools/0f64efc9-f0f3-4bd9-9a38-d4d9c929b04f.mjs';
import './tools/9078af44-c7c1-4b7a-8cf1-815cf8a37023.mjs';
import './tools/0f14fd1e-aba8-4c0c-a344-c7e727f90597.mjs';
import './tools/994db48b-7105-4b79-9852-e61757c697e2.mjs';
import './tools/29364e87-f3c0-4717-96e5-153143f9761d.mjs';
import './tools/b82d311c-1244-43f0-9004-cd0d57516377.mjs';
import './tools/40255a39-b598-43c5-9aa4-eafc80f2c3f6.mjs';
import './tools/6940fc6a-2358-4175-b97a-89d4beb07a2e.mjs';
import './tools/ae4a1dba-22ff-4a38-9070-17d510c093ba.mjs';
import './tools/e425539a-36d0-4b08-b74f-68f1320fd75e.mjs';
import './tools/68ffa6cd-532b-4757-86ba-08ff7037c5f1.mjs';
import './tools/9be49c5b-fc46-4eb7-9d40-4843bdbbd3ff.mjs';
import 'stripe';
import 'bip39';
import 'ed25519-hd-key';
import '@trustwallet/wallet-core';
import '@solana/spl-token';
import '@sqds/multisig';
import '@safe-global/protocol-kit';
import 'bcrypt';
import '@simplewebauthn/server';
import 'rss-parser';
import 'fs/promises';
import 'https';
import 'url';
import 'http';
import 'http2';
import 'stream';
import '@mastra/core/utils/zod-to-json';
import '@mastra/core/features';
import '@mastra/core/processors';
import '@mastra/core/request-context';
import '@mastra/core/llm';
import '@mastra/core/utils';
import '@mastra/core/evals';
import '@mastra/core/storage';
import '@mastra/core/a2a';
import 'stream/web';
import 'zod/v4';
import 'zod/v3';
import '@mastra/core/memory';
import 'child_process';
import 'module';
import 'util';
import 'os';
import '@mastra/core/workflows';
import '@mastra/core/server';
import 'buffer';
import './tools.mjs';

// ../memory/dist/token-6GSAFR2W-ABXTQD64.js
var require_token = __commonJS({
  "../../../node_modules/.pnpm/@vercel+oidc@3.0.5/node_modules/@vercel/oidc/dist/token.js"(exports$1, module) {
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
var token6GSAFR2W = require_token();

export { token6GSAFR2W as default };
//# sourceMappingURL=token-6GSAFR2W-ABXTQD64-Z6U2TA2C.mjs.map
