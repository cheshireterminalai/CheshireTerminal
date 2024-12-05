import { TwitterPostClient } from "./post.js";
import { TwitterSearchClient } from "./search.js";
import { TwitterInteractionClient } from "./interactions.js";
import { CheshireBot } from "./cheshire.js";
import { GrinPhilosopher } from "./grin-philosopher.js";
import { IAgentRuntime, Client } from "@ai16z/eliza";

class TwitterAllClient {
    post: TwitterPostClient;
    search: TwitterSearchClient;
    interaction: TwitterInteractionClient;
    cheshire: CheshireBot;
    grinPhilosopher: GrinPhilosopher;

    constructor(runtime: IAgentRuntime) {
        this.post = new TwitterPostClient(runtime);
        // this.search = new TwitterSearchClient(runtime); // don't start the search client by default
        // this searches topics from character file, but kind of violates consent of random users
        // burns your rate limit and can get your account banned
        // use at your own risk
        this.interaction = new TwitterInteractionClient(runtime);
        this.cheshire = new CheshireBot(runtime);
        this.grinPhilosopher = new GrinPhilosopher(runtime);
    }
}

export const TwitterClientInterface: Client = {
    async start(runtime: IAgentRuntime) {
        console.log("Twitter client started");
        return new TwitterAllClient(runtime);
    },
    async stop(runtime: IAgentRuntime) {
        console.warn("Twitter client does not support stopping yet");
    },
};

export default TwitterClientInterface;
export { CheshireBot, createCheshireBot } from "./cheshire.js";
export { GrinPhilosopher, createGrinPhilosopher } from "./grin-philosopher.js";
