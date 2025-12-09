// AI_Hard.js
import { AI_Medium } from './AI_Medium.js';

export class AI_Hard extends AI_Medium {
    constructor(board, validator, enPassant) {
        super(board, validator, enPassant);
        // histórico de aprendizado incremental
        // key: "from-to-piece", value: score acumulado (+ vitória, - derrota)
        this.learningData = {};
    }

    makeMove(color) {
        console.log("Modo Hard:");

        // pega movimentos possíveis do Medium
        let move = super.makeMove(color); 

        if (!move) return null;

        // 🔹 AQUI: priorizar movimentos que tiveram sucesso em jogos anteriores
        const key = `${move.from}-${move.to}-${move.piece.tipo}`;

        // se houver movimentos conhecidos no aprendizado, reforça
        const allMoves = this.getAllMovesForColor(color);

        // cria ranking baseado no learningData
        const rankedMoves = allMoves.slice().sort((a, b) => {
            const keyA = `${a.from}-${a.to}-${a.piece.tipo}`;
            const keyB = `${b.from}-${b.to}-${b.piece.tipo}`;
            const scoreA = this.learningData[keyA] || 0;
            const scoreB = this.learningData[keyB] || 0;
            // prioriza score maior
            return scoreB - scoreA;
        });

        if (rankedMoves.length > 0) {
            // escolhe o movimento top aprendido, mas ainda respeitando Medium/Hard heurísticas
            const topMove = rankedMoves[0];

            // substitui move apenas se score for positivo
            const topKey = `${topMove.from}-${topMove.to}-${topMove.piece.tipo}`;
            if ((this.learningData[topKey] || 0) > 0) {
                move = topMove;
            }
        }

        // aplicar movimento final no board
        this.applyMoveWithEPAndRegister(move);
        this.lastMove = { from: move.from, to: move.to };
        return move;
    }

    // método de aprendizado incremental
    updateLearning(move, result) {
        // move: { from, to, piece, capturedPiece }
        // result: +1 vitória, 0 empate, -1 derrota
        const key = `${move.from}-${move.to}-${move.piece.tipo}`;
        if (!this.learningData[key]) this.learningData[key] = 0;
        this.learningData[key] += result;
    }
}
