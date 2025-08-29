//evals.ts

import { EvalConfig } from 'mcp-evals';
import { openai } from "@ai-sdk/openai";
import { grade, EvalFunction } from "mcp-evals";

const get_clojars_latest_versionEval: EvalFunction = {
    name: 'get_clojars_latest_version Evaluation',
    description: 'Evaluates the retrieval of the latest version of a Clojars dependency',
    run: async () => {
        const result = await grade(openai("gpt-4"), "What is the latest version for the dependency 'metosin/reitit' on Clojars?");
        return JSON.parse(result);
    }
};

const check_clojars_version_existsEval: EvalFunction = {
    name: 'check_clojars_version_exists',
    description: 'Evaluates the check_clojars_version_exists tool',
    run: async () => {
        const result = await grade(openai("gpt-4"), "Check if the version 0.7.2 of the 'metosin/reitit' dependency exists on Clojars.");
        return JSON.parse(result);
    }
};

const config: EvalConfig = {
    model: openai("gpt-4"),
    evals: [get_clojars_latest_versionEval, check_clojars_version_existsEval]
};
  
export default config;
  
export const evals = [get_clojars_latest_versionEval, check_clojars_version_existsEval];