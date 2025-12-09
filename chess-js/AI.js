// AI.js  (AI Manager / Orquestrador)

import { AI_Easy } from "./AI_Easy.js";
import { AI_Medium } from "./AI_Medium.js";
import { AI_Hard } from "./AI_Hard.js";

export class AI {
    /**
     * @param {Board} board
     * @param {MoveValidator} validator
     * @param {EnPassant} enPassant
     * @param {string} initialDifficulty - 'easy', 'medium', 'hard'
     */
    constructor(board, validator, enPassant, initialDifficulty = "easy") {
        this.board = board;
        this.validator = validator;
        this.enPassant = enPassant;

        this.strategies = {
            "easy": AI_Easy,
            "medium": AI_Medium,
            "hard": AI_Hard,
        };

        this.currentStrategy = null;

        this.setDifficulty(initialDifficulty);
    }

    /**
     * Define qual estratégia a IA deve usar
     */
    setDifficulty(difficulty) {
        const key = difficulty.toLowerCase();
        const Strategy = this.strategies[key];

        if (!Strategy) {
            console.warn(`Dificuldade desconhecida: ${difficulty}. Usando 'easy'.`);
            this.currentStrategy = new AI_Easy(this.board, this.validator, this.enPassant);
            return;
        }

        this.currentStrategy = new Strategy(this.board, this.validator, this.enPassant);
        console.log(`🤖 IA configurada para dificuldade: ${key}`);
    }

    /**
     * A estratégia devolve somente o movimento.
     * O GameController executa o movimento.
     */
    getBestMove(playerColor) {
        if (!this.currentStrategy) {
            console.error("AI sem estratégia ativa!");
            return null;
        }

        return this.currentStrategy.findMove(playerColor);
    }

    isThinking() {
        if (this.currentStrategy && typeof this.currentStrategy.isSearching === "function") {
            return this.currentStrategy.isSearching();
        }
        return false;
    }
}
