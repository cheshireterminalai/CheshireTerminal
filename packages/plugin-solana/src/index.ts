export * from "./providers/token.js";
export * from "./providers/wallet.js";
export * from "./providers/trustScoreProvider.js";
export * from "./evaluators/trust.js";

import { Plugin } from "@ai16z/eliza";
//import { executeSwap } from "./actions/swap.js";
//import take_order from "./actions/takeOrder";
//import pumpfun from "./actions/pumpfun.js";
//import { executeSwapForDAO } from "./actions/swapDao";
//import transferToken from "./actions/transfer.js";
import { walletProvider } from "./providers/wallet.js";
import { trustScoreProvider } from "./providers/trustScoreProvider.js";
import { trustEvaluator } from "./evaluators/trust.js";

export const solanaPlugin: Plugin = {
    name: "solana",
    description: "Solana Plugin for Eliza",
    actions: [
        //executeSwap,
        //pumpfun,
        //transferToken,
        //executeSwapForDAO,
        //take_order,
    ],
    evaluators: [trustEvaluator],
    providers: [walletProvider, trustScoreProvider],
};

export default solanaPlugin;
