"use strict";
/**
 * Firebase Cloud Functions
 * AI proxy to LiteLLM gateway
 */
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.webSearch = exports.api = void 0;
const functions = __importStar(require("firebase-functions"));
const admin = __importStar(require("firebase-admin"));
const params_1 = require("firebase-functions/params");
// Initialize Firebase Admin
admin.initializeApp();
// Define secrets
const litellmApiKey = (0, params_1.defineSecret)('LITELLM_API_KEY');
// LiteLLM Configuration
const LITELLM_ENDPOINT = process.env.LITELLM_ENDPOINT || 'https://app-litellmsn66ka.azurewebsites.net';
// Brave Search Configuration
const BRAVE_SEARCH_ENDPOINT = 'https://api.search.brave.com/res/v1/web/search';
/**
 * AI Chat Proxy Function
 * Forwards requests to LiteLLM and handles streaming responses
 */
exports.api = functions
    .runWith({ secrets: [litellmApiKey] })
    .https.onRequest(async (req, res) => {
    // CORS headers
    res.set('Access-Control-Allow-Origin', '*');
    res.set('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.set('Access-Control-Allow-Headers', 'Content-Type');
    if (req.method === 'OPTIONS') {
        res.status(204).send('');
        return;
    }
    if (req.method !== 'POST') {
        res.status(405).json({ error: 'Method not allowed' });
        return;
    }
    const apiKey = litellmApiKey.value();
    if (!apiKey) {
        console.error('LITELLM_API_KEY not configured');
        res.status(500).json({ error: 'AI service not configured' });
        return;
    }
    const { model, messages, stream, temperature, max_tokens } = req.body;
    console.log(`[AI] Request: model=${model}, messages=${messages?.length}, stream=${stream}`);
    try {
        const response = await fetch(`${LITELLM_ENDPOINT}/v1/chat/completions`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${apiKey}`,
            },
            body: JSON.stringify({
                model: model || 'anthropic/claude-sonnet-4-5',
                messages,
                stream: stream || false,
                temperature: temperature ?? 0.7,
                max_tokens: max_tokens ?? 2048,
            }),
        });
        if (!response.ok) {
            const errorText = await response.text();
            console.error(`[AI] LiteLLM error: ${response.status} - ${errorText}`);
            res.status(response.status).json({ error: `AI service error: ${response.status}` });
            return;
        }
        if (stream) {
            // Streaming response
            res.set('Content-Type', 'text/event-stream');
            res.set('Cache-Control', 'no-cache');
            res.set('Connection', 'keep-alive');
            const reader = response.body?.getReader();
            if (!reader) {
                res.status(500).json({ error: 'No response body' });
                return;
            }
            const decoder = new TextDecoder();
            try {
                while (true) {
                    const { done, value } = await reader.read();
                    if (done)
                        break;
                    const chunk = decoder.decode(value, { stream: true });
                    res.write(chunk);
                }
            }
            catch (streamError) {
                console.error('[AI] Stream error:', streamError);
            }
            finally {
                res.end();
            }
        }
        else {
            // Non-streaming response
            const data = await response.json();
            // Add token usage headers if available
            if (data.usage) {
                res.set('X-Token-Usage-Prompt', String(data.usage.prompt_tokens || 0));
                res.set('X-Token-Usage-Completion', String(data.usage.completion_tokens || 0));
                res.set('X-Token-Usage-Total', String(data.usage.total_tokens || 0));
            }
            res.json(data);
        }
    }
    catch (error) {
        console.error('[AI] Error:', error);
        res.status(500).json({ error: 'AI service error' });
    }
});
/**
 * Web Search Proxy Function
 * Forwards requests to Brave Search API
 */
exports.webSearch = functions
    .https.onRequest(async (req, res) => {
    // CORS headers
    res.set('Access-Control-Allow-Origin', '*');
    res.set('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.set('Access-Control-Allow-Headers', 'Content-Type');
    if (req.method === 'OPTIONS') {
        res.status(204).send('');
        return;
    }
    if (req.method !== 'POST') {
        res.status(405).json({ error: 'Method not allowed' });
        return;
    }
    const searchApiKey = process.env.BRAVE_SEARCH_API_KEY;
    if (!searchApiKey) {
        console.error('BRAVE_SEARCH_API_KEY not configured');
        res.status(500).json({ error: 'Search service not configured' });
        return;
    }
    const { query, count = 10 } = req.body;
    if (!query) {
        res.status(400).json({ error: 'Query is required' });
        return;
    }
    console.log(`[Search] Query: "${query}", count=${count}`);
    try {
        const searchUrl = new URL(BRAVE_SEARCH_ENDPOINT);
        searchUrl.searchParams.set('q', query);
        searchUrl.searchParams.set('count', String(count));
        const response = await fetch(searchUrl.toString(), {
            method: 'GET',
            headers: {
                'Accept': 'application/json',
                'X-Subscription-Token': searchApiKey,
            },
        });
        if (!response.ok) {
            console.error(`[Search] Brave API error: ${response.status}`);
            res.status(response.status).json({ error: 'Search service error' });
            return;
        }
        const data = await response.json();
        res.json(data);
    }
    catch (error) {
        console.error('[Search] Error:', error);
        res.status(500).json({ error: 'Search service error' });
    }
});
//# sourceMappingURL=index.js.map