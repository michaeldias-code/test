// AI_HardEvo.js
import { AI_Medium } from './AI_Medium.js';

export class AI_Hard extends AI_Medium {
    constructor(board, validator, enPassant) {
        super(board, validator, enPassant);

        // memória de aprendizado: { "from-to": { score, count } }
        this.learning = this.loadLearning();
        this.learningWeight = 1; // peso inicial do aprendizado
        this.totalGames = 0;
    }

    makeMove(color) {
        const enemyColor = color === "brancas" ? "pretas" : "brancas";

        let myMoves = this.getAllMovesForColor(color);
        if (myMoves.length === 0) return null;

        // filtros Medium/Hard
        myMoves = myMoves.filter(m => !this.isForbiddenRepeat(m));
        myMoves = myMoves.filter(m => {
            if (!this.lastMove) return true;
            if (m.from === this.lastMove.to && m.to === this.lastMove.from) {
                if (m.capturedPiece) return true;
                if (this.willRemoveCheck(m)) return true;
                return false;
            }
            return true;
        });

        // calcular score combinado: heurística + aprendizado
        const scoredMoves = myMoves.map(m => {
            // HEURÍSTICA
            let heuristic = 0;
            if (m.capturedPiece) {
                const wouldBeAttacked = this.wouldBeAttackedAfterMove(m, enemyColor);
                heuristic = this.valueOfPiece(m.capturedPiece);
                if (wouldBeAttacked) {
                    heuristic -= this.estimatedAttackerValueOnSquareAfterMove(m, enemyColor);
                }
            }

            // APRENDIZADO
            const key = `${m.from}-${m.to}`;
            let learned = 0;
            if (this.learning[key]) {
                // média ponderada do aprendizado
                learned = this.learning[key].score / this.learning[key].count;
            }

            // peso do aprendizado cresce com o número de jogos
            const weight = 1 + Math.log1p(this.totalGames) * this.learningWeight;

            const score = heuristic + learned * weight;
            return { move: m, score };
        });

        // ordenar por score combinado
        scoredMoves.sort((a, b) => b.score - a.score);

        const chosen = scoredMoves[0].move;
        this.applyMoveWithEPAndRegister(chosen);
        this.lastMove = { from: chosen.from, to: chosen.to };
        return chosen;
    }

    // registra aprendizado no final da partida
    updateLearning(movesSequence, result) {
        // result: +1 vitória, 0 empate, -1 derrota
        this.totalGames += 1;

        movesSequence.forEach(move => {
            const key = `${move.from}-${move.to}`;
            if (!this.learning[key]) this.learning[key] = { score: 0, count: 0 };
            this.learning[key].score += result;
            this.learning[key].count += 1;
        });

        this.saveLearning();
    }

    // salvar no localStorage
    saveLearning() {
        try {
            const data = {
                learning: this.learning,
                totalGames: this.totalGames
            };
            localStorage.setItem('AI_HardEvo_Data', JSON.stringify(data));
        } catch (e) {
            console.warn("Falha ao salvar aprendizado:", e);
        }
    }

    // carregar do localStorage
    loadLearning() {
        try {
            const data = JSON.parse(localStorage.getItem('AI_HardEvo_Data'));
            if (data && data.learning) {
                this.totalGames = data.totalGames || 0;
                return data.learning;
            }
            return {};
        } catch (e) {
            console.warn("Falha ao carregar aprendizado:", e);
            return {};
        }
    }
}
