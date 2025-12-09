// AI_Easy.js

export class AI_Easy {

    constructor(board, validator, enPassant) {
        this.board = board;
        this.validator = validator;
        this.enPassant = enPassant;

        console.log("🤖 AI_Easy carregada (modo fácil).");
    }

    /**
     * Retorna um movimento legal aleatório.
     */
    findMove(color) {
        const allMoves = this.getAllLegalMoves(color);

        if (allMoves.length === 0) {
            return null;
        }

        const randomIndex = Math.floor(Math.random() * allMoves.length);
        return allMoves[randomIndex];
    }

    /**
     * Gera uma lista de todos os movimentos possíveis para a cor fornecida.
     */
    getAllLegalMoves(color) {
        const moves = [];

        for (let i = 0; i < 64; i++) {
            const piece = this.board.board[i];

            if (!piece || piece.cor !== color) continue;

            const possibleMoves = this.validator.getPossibleMoves(i);

            for (const dest of possibleMoves) {
                moves.push({
                    from: i,
                    to: dest
                });
            }
        }

        return moves;
    }
}
