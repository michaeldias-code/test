class AI_Hard {
    constructor(board, validator, enPassant) {
        this.board = board;
        this.validator = validator;
        this.enPassant = enPassant;
    }

    findMove(playerColor) {
        const moves = [];

        for (let i = 0; i < 64; i++) {
            const p = this.board.board[i];
            if (p && p.cor === playerColor) {
                const possible = this.validator.getPossibleMoves(i);
                for (let to of possible) moves.push({ from: i, to });
            }
        }

        if (moves.length === 0) return null;
        return moves[Math.floor(Math.random() * moves.length)];
    }
}

export { AI_Hard };
