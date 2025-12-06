// GameController.js
import { View } from './View.js?v=999';
import { AI } from './AI.js?v=999';
import { Board } from './Board.js?v=999';
import { MoveValidator } from './MoveValidator.js?v=999';

export class GameController {
    constructor() {
        console.log("GameController inicializando...");

        this.board = new Board();
        this.validator = new MoveValidator(this.board.board);
        this.ai = new AI(this.board, this.validator);

        this.view = new View(this.board, this);

        this.currentTurn = "brancas";
        this.gameOver = false;
        this.lastMove = null;

        // Guardar ID do timer da IA para podermos limpar no reset
        this.aiTimerId = null;

        console.log("GameController carregado!");
    }

    movePiece(from, to) {
        if (this.gameOver) return false;

        const piece = this.board.board[from];
        if (!piece) return false;
        if (piece.cor !== this.currentTurn) return false;

        const validMoves = this.validator.getPossibleMoves(from);
        if (!validMoves.includes(to)) return false;

        // Executa o movimento
        this.board.movePiece(from, to);
        this.view.lastMove = { from, to };
        this.view.render();

        // Troca de turno
        this.currentTurn = this.currentTurn === "brancas" ? "pretas" : "brancas";

        // Verifica xeque / xeque-mate
        if (this.validator.isKingInCheck(this.currentTurn)) {
            console.log(`Xeque em ${this.currentTurn}!`);
            if (this.validator.isCheckmate(this.currentTurn)) {
                console.log(`Checkmate! ${piece.cor} venceu!`);
                this.gameOver = true;
                this.view.onGameOver({ winner: piece.cor, reason: "checkmate" });
                return true;
            }
        }

        // Turno da IA
        if (this.currentTurn === "pretas") {
            // limpar timer anterior por segurança
            if (this.aiTimerId) {
                clearTimeout(this.aiTimerId);
                this.aiTimerId = null;
            }

            this.aiTimerId = setTimeout(() => {
                // se jogo for reiniciado durante o timeout, respeitamos gameOver
                if (this.gameOver) return;

                const m = this.ai.makeMove("pretas"); // retorna {from, to}
                if (m) {
                    this.view.lastMove = { from: m.from, to: m.to };
                    this.view.render();
                    this.view.highlightCell(m.to);
                    console.log(`IA moveu de ${m.from} para ${m.to}`);
                }

                // Marca fim do timeout
                this.aiTimerId = null;

                // Verifica xeque após movimento da IA
                this.currentTurn = "brancas";
                if (this.validator.isKingInCheck("brancas")) {
                    console.log("Xeque para brancas!");
                    if (this.validator.isCheckmate("brancas")) {
                        console.log("Xeque-mate! Pretas venceram!");
                        this.gameOver = true;
                        this.view.onGameOver({ winner: "pretas", reason: "checkmate" });
                    }
                }
            }, 300);
        }

        return true;
    }

    /* ---------------- Novo método para resetar o jogo (melhorado) ---------------- */
    resetGame() {
        console.log("Reiniciando o jogo...");

        // Limpa timers pendentes da IA
        if (this.aiTimerId) {
            clearTimeout(this.aiTimerId);
            this.aiTimerId = null;
        }

        // Recria o tabuleiro (novo objeto com novo array interno)
        this.board = new Board();

        // Recria o validator apontando para o novo array do tabuleiro
        this.validator = new MoveValidator(this.board.board);

        // Recria a IA com as referências atualizadas
        this.ai = new AI(this.board, this.validator);

        // Reset variáveis de controle
        this.gameOver = false;
        this.currentTurn = "brancas";
        this.lastMove = null;

        // Atualiza a View para apontar pro novo board e limpa seleção/último-movimento
        this.view.board = this.board;
        this.view.selected = null;
        this.view.lastMove = null;

        // Re-renderiza
        this.view.render();

        console.log("Jogo reiniciado!");
    }
}
