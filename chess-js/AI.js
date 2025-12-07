import { MoveValidator } from "./MoveValidator.js";

export class AI {
    constructor(board, validator, testMode = false) {
        this.board = board;
        this.validator = validator;
        this.testMode = testMode; // controla modo teste
        console.log("AI carregado! Validator recebido:", this.validator, "TestMode:", this.testMode);
    }

    // -------------------------------------
    // MODO TESTE: Move só peões duas casas
    // -------------------------------------
    getPawnDoubleMove(color) {
        for (let i = 0; i < 64; i++) {
            const p = this.board.board[i];
            if (!p || p.cor !== color) continue;

            if (p.tipo === "♙" && i >= 48 && i <= 55) { // peão branco na 7ª linha
                if (!this.board.board[i - 8] && !this.board.board[i - 16]) {
                    return { from: i, to: i - 16 };
                }
            }

            if (p.tipo === "♟" && i >= 8 && i <= 15) { // peão preto na 2ª linha
                if (!this.board.board[i + 8] && !this.board.board[i + 16]) {
                    return { from: i, to: i + 16 };
                }
            }
        }
        return null;
    }

    // -------------------------------------
    // MODO NORMAL: Random
    // -------------------------------------
    getRandomMove(color) {
        const moves = [];
        for (let i = 0; i < 64; i++) {
            const p = this.board.board[i];
            if (!p || p.cor !== color) continue;

            const possible = this.validator.getPossibleMoves(i);
            for (let dest of possible) moves.push({ from: i, to: dest });
        }

        if (moves.length === 0) return null;
        return moves[Math.floor(Math.random() * moves.length)];
    }

    // -------------------------------------
    // FAZ MOVIMENTO (escolhe método de acordo com testMode)
    // -------------------------------------
    makeMove(color) {
        let move = null;
        if (this.testMode) {
            move = this.getPawnDoubleMove(color);
        } else {
            move = this.getRandomMove(color);
        }

        if (move) {
            this.board.movePiece(move.from, move.to);
            return move;
        }
        return null;
    }

    // -------------------------------------
    // Reset
    // -------------------------------------
    reset() {
        console.log("Resetando IA...");
    }
}
