// AI_Hard.js
import { AI_Medium } from './AI_Medium.js';

export class AI_Hard extends AI_Medium {
    constructor(board, validator, enPassant) {
        super(board, validator, enPassant);

        // Memória de aprendizado: { "from-to": { score, count } }
        this.learning = this.loadLearning();
        
        // Peso inicial do aprendizado. Aumentar para que o aprendizado tenha mais impacto.
        this.learningWeight = 5; 
        this.totalGames = 0;
        
        // Novo: Penalidade forte para jogadas que historicamente resultaram em derrota (score médio < -0.9)
        this.DEFEAT_THRESHOLD = -0.9;
        console.log(`AI_Hard inicializada. Jogos totais carregados: ${this.totalGames}`);
    }

    makeMove(color) {
        const enemyColor = color === "brancas" ? "pretas" : "brancas";

        let myMoves = this.getAllMovesForColor(color);
        if (myMoves.length === 0) return null;

        // FILTROS HERDADOS (Medium)
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

        // NOVO FILTRO HARD: EVITAR MOVIMENTOS QUE HISTORICAMENTE RESULTARAM EM DERROTA
        let initialMovesCount = myMoves.length;
        myMoves = myMoves.filter(m => {
            const key = `${m.from}-${m.to}`;
            if (this.learning[key]) {
                const avgScore = this.learning[key].score / this.learning[key].count;
                // Se a jogada levou consistentemente à derrota, proíba-a no modo Hard
                if (avgScore < this.DEFEAT_THRESHOLD) {
                    console.log(`? AI_Hard: Proibindo jogada perdedora aprendida: ${key} (Score Avg: ${avgScore.toFixed(2)})`);
                    return false;
                }
            }
            return true;
        });
        
        // Se todas as jogadas foram proibidas, desfazemos a proibição e dependemos da pontuação
        if (myMoves.length === 0 && initialMovesCount > 0) {
            console.warn("AI_Hard: Todas as jogadas proibidas, re-permitindo para evitar Null Move.");
            myMoves = this.getAllMovesForColor(color); // Recarrega todas
        }


        // calcular score combinado: heurística + aprendizado
        const scoredMoves = myMoves.map(m => {
            // HEURÍSTICA (mantida a lógica de captura + contra-ataque)
            let heuristic = this.evaluateMove(m, color, enemyColor); // Assume que você tem um evaluateMove mais robusto no Medium
            
            // Se o Medium não tem evaluateMove, use o seu cálculo original:
            /*
            let heuristic = 0;
            if (m.capturedPiece) {
                const wouldBeAttacked = this.wouldBeAttackedAfterMove(m, enemyColor);
                heuristic = this.valueOfPiece(m.capturedPiece);
                if (wouldBeAttacked) {
                    heuristic -= this.estimatedAttackerValueOnSquareAfterMove(m, enemyColor);
                }
            }
            */

            // APRENDIZADO
            const key = `${m.from}-${m.to}`;
            let learned = 0;
            if (this.learning[key]) {
                // média ponderada do aprendizado
                learned = this.learning[key].score / this.learning[key].count;
            }

            // peso do aprendizado cresce exponencialmente com o número de jogos para torná-lo 'Hard'
            const weight = this.learningWeight * Math.log1p(this.totalGames + 1);

            // IMPORTANTE: Combine Heurística (curto prazo) + Aprendizado (longo prazo)
            const score = heuristic + learned * weight; 
            return { move: m, score };
        });

        // Se o filtro anterior removeu tudo, escolha o de maior pontuação
        if (scoredMoves.length === 0) {
            // Isso só deve acontecer se myMoves foi esvaziado, mas garantimos
            console.warn("AI_Hard: Nenhum movimento elegível restante, escolhendo o de maior pontuação bruta.");
            myMoves = this.getAllMovesForColor(color);
            // Recalcular pontuações, talvez sem o filtro DEFEAT_THRESHOLD, ou escolher o que tem o melhor score heurístico puro
            return this.selectBestHeuristicMove(myMoves); // Chama um método que o Medium já deveria ter
        }


        // ordenar por score combinado
        scoredMoves.sort((a, b) => b.score - a.score);
        
        const chosen = scoredMoves[0].move;
        this.applyMoveWithEPAndRegister(chosen); // Aplica o movimento na instância AI (se necessário)
        this.lastMove = { from: chosen.from, to: chosen.to };
        
        return chosen;
    }
    
    // ... métodos updateLearning, saveLearning, loadLearning (mantidos) ...

    updateLearning(movesSequence, result) {
        // ... código mantido, mas garanta que 'result' seja +1, 0, ou -1 ...
        this.totalGames += 1;

        movesSequence.forEach(move => {
            const key = `${move.from}-${move.to}`;
            if (!this.learning[key]) this.learning[key] = { score: 0, count: 0 };
            
            // O score agora reflete o resultado: +1 (vitória) ou -1 (derrota)
            this.learning[key].score += result; 
            this.learning[key].count += 1;
        });

        this.saveLearning();
        console.log(`? AI_Hard: Aprendizado atualizado! Resultado: ${result}. Total de jogos: ${this.totalGames}`);
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
    // ... Aqui estariam os métodos isForbiddenRepeat, willRemoveCheck, evaluateMove, etc., herdados do AI_Medium.
}
