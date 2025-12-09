import { AI_Easy } from "./AI_Easy.js?v=999";

export class AI {
    /**
     * @param {Board} board 
     * @param {MoveValidator} validator 
     * @param {EnPassant} enPassant 
     * @param {string} difficulty 
     */
    constructor(board, validator, enPassant, difficulty = "easy") {

        this.board = board;
        this.validator = validator;
        this.enPassant = enPassant;

        this.setDifficulty(difficulty);

        console.log(`🤖 IA Pai carregada. Dificuldade selecionada: ${difficulty}`);
    }

    /**
     * A única função para mudar a estratégia
     */
    setDifficulty(level) {
        switch (level) {
            case "easy":
            default:
                this.strategy = new AI_Easy();
                break;
        }
    }

    /**
     * GameController chama APENAS ESTE MÉTODO
     * A IA retorna um movimento COMPLETAMENTE executado
     */
    makeMove(color) {

        // 1) IA coleta todos os movimentos legais usando modules do jogo
        const validMoves = this.getValidMoves(color);

        if (validMoves.length === 0) return null;

        // 2) IA_Easy decide apenas QUAL movimento
        const move = this.strategy.chooseMove(validMoves);

        if (!move) return null;

        // 3) IA Pai executa o movimento (continua sendo responsabilidade da AI pai)
        this.executeMove(move);

        return move;
    }

    /**
     * Retorna todas as jogadas legais
     */
    getValidMoves(color) {
        const moves = [];

        for (let from = 0; from < 64; from++) {
            const p = this.board.board[from];
            if (!p || p.cor !== color) continue;

            const possible = this.validator.getPossibleMoves(from);

            for (const to of possible) {
                moves.push({ from, to });
            }
        }

        return moves;
    }

    /**
     * Executa a jogada dentro do Board
     * Aqui você pode incluir EP, promoção, rei em cheque etc.
     */
    executeMove(move) {
        const piece = this.board.board[move.from];

        // Se quiser incluir EP:
        let epCapturedPos = null;
        if (this.enPassant && piece.tipo === "♙" || piece.tipo === "♟") {
            epCapturedPos = this.enPassant.isEnPassantMove(move.from, move.to, piece);
        }

        this.board.movePiece(move.from, move.to, epCapturedPos);
    }
}
