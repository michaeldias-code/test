import {AI_Easy} from './AI_Easy.js';
import {AI_Medium} from './AI_Medium.js';
import {AI_Hard} from './AI_Hard.js';

class AI {
    constructor(board, validator, enPassant, initialDifficulty = "easy") {
        this.board = board;
        this.validator = validator;
        this.enPassant = enPassant;

        this.strategies = {
            easy: AI_Easy,
            medium: AI_Medium,
            hard: AI_Hard,
        };

        this.currentStrategy = null;
        this.setDifficulty(initialDifficulty);
    }

    setDifficulty(difficulty) {
        const StrategyClass = this.strategies[difficulty.toLowerCase()] || AI_Easy;
        this.currentStrategy = new StrategyClass(
            this.board,
            this.validator,
            this.enPassant
        );
        console.log("AI set to:", difficulty);
    }

    getBestMove(playerColor) {
        if (!this.currentStrategy) return null;
        return this.currentStrategy.findMove(playerColor);
    }
}

export default AI;
