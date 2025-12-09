import { AI_Easy } from "./AI_Easy.js";
import { AI_Medium } from "./AI_Medium.js";
import { AI_Hard } from "./AI_Hard.js";

export class AI {
    constructor(board, validator, enPassant, difficulty = "easy") {
        this.board = board;
        this.validator = validator;
        this.enPassant = enPassant;

        this.strategies = {
            easy: AI_Easy,
            medium: AI_Medium,
            hard: AI_Hard
        };

        this.setDifficulty(difficulty);
    }

    setDifficulty(level) {
        const Strategy = this.strategies[level] || this.strategies["easy"];
        this.current = new Strategy(this.board, this.validator, this.enPassant);
        console.log("AI Strategy =", level);
    }

    makeMove(color) {
        return this.current.makeMove(color); // delega
    }
}
