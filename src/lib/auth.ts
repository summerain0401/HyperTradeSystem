import { WalletClient, Hex } from "viem";
import { arbitrum } from "viem/chains";

// Hyperliquid Constants
export const HYPERLIQUID_API_URL = "https://api.hyperliquid.xyz/exchange";

// EIP-712 Domain
const DOMAIN = {
    name: "HyperliquidSignTransaction",
    version: "1",
    chainId: 42161, // Arbitrum One
    verifyingContract: "0x0000000000000000000000000000000000000000" as Hex,
};

// EIP-712 Types
const TYPES = {
    "HyperliquidTransaction:ApproveAgent": [
        { name: "hyperliquidChain", type: "string" },
        { name: "signatureChainId", type: "uint64" },
        { name: "agentAddress", type: "address" },
        { name: "agentName", type: "string" },
        { name: "nonce", type: "uint64" },
    ],
};

// Wait, "HyperliquidTransaction:ApproveAgent" is a weird type name.
// Usually it's just "ApproveAgent".
// Let's try "ApproveAgent".

const APPROVE_AGENT_TYPES = {
    ApproveAgent: [
        { name: "hyperliquidChain", type: "string" },
        { name: "signatureChainId", type: "uint64" },
        { name: "agentAddress", type: "address" },
        { name: "agentName", type: "string" },
        { name: "nonce", type: "uint64" },
    ],
};

export async function approveAgent(
    walletClient: WalletClient,
    account: Hex,
    agentAddress: string,
    agentName: string = "HyperTrade Agent"
) {
    const nonce = Date.now();
    const message = {
        hyperliquidChain: "Mainnet",
        signatureChainId: BigInt(42161),
        agentAddress: agentAddress as Hex,
        agentName: agentName,
        nonce: BigInt(nonce),
    };

    const signature = await walletClient.signTypedData({
        account,
        domain: DOMAIN,
        types: APPROVE_AGENT_TYPES,
        primaryType: "ApproveAgent",
        message,
    });

    // Construct the payload for the API
    const payload = {
        action: {
            type: "approveAgent",
            hyperliquidChain: "Mainnet",
            signatureChainId: "0xa4b1", // Hex of 42161
            agentAddress: agentAddress,
            agentName: agentName,
            nonce: nonce,
        },
        nonce: nonce,
        signature: {
            r: signature.slice(0, 66),
            s: "0x" + signature.slice(66, 130),
            v: parseInt(signature.slice(130, 132), 16),
        },
    };

    // Send to API
    const response = await fetch(HYPERLIQUID_API_URL, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
    });

    if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Failed to approve agent: ${errorText}`);
    }

    return response.json();
}
