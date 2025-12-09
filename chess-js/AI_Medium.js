// AI_Medium.js

export class AI_Medium {

    constructor(board, validator, enPassant) {
        this.board = board;
        this.validator = validator;
        this.enPassant = enPassant;

        console.log("🤖 AI_Medium carregada (modo médio).");
    }

    findMove(color) {
        const allMoves = this.getAllLegalMoves(color);

        if (allMoves.length === 0) return null;

        // Lógica igual ao Easy por enquanto
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
