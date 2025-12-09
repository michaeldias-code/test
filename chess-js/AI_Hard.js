// AI_Hard.js

export class AI_Hard {

    constructor(board, validator, enPassant) {
        this.board = board;
        this.validator = validator;
        this.enPassant = enPassant;

        console.log("🤖 AI_Hard carregada (modo difícil).");
    }

    findMove(color) {
        const allMoves = this.getAllLegalMoves(color);

        if (allMoves.length === 0) return null;

        // Em breve posso transformar isso num minimax...
        const idx = Math.floor(Math.random() * allMoves.length);
        return allMoves[idx];
    }

    getAllLegalMoves(color) {
        const moves = [];

        for (let i = 0; i < 64; i++) {
            const p = this.board.board[i];
            if (!p || p.cor !== color) continue;

            const possible = this.validator.getPossibleMoves(i);
            for (const d of possible) {
                moves.push({ from: i, to: d });
            }
        }

        return moves;
    }
}
