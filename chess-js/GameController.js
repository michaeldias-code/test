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

        this.currentTurn = "brancas"; // O jogo começa com as brancas
        this.gameOver = false;
        this.lastMove = null;

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
        this.view.lastMove = { from, to }; // registra o movimento para destaque
        this.view.render();

        // Troca de turno
        this.currentTurn = this.currentTurn === "brancas" ? "pretas" : "brancas";

        // Verifica xeque
        const enemy = this.currentTurn;
        if (this.validator.isKingInCheck(enemy)) {
            console.log(`Xeque em ${enemy}!`);
            if (this.validator.isCheckmate(enemy)) {
                console.log(`Checkmate! ${piece.cor} venceu!`);
                this.gameOver = true;
                this.view.onGameOver({ winner: piece.cor, reason: "checkmate" });
                return true;
            }
        }

        // Turno da IA
        if (this.currentTurn === "pretas") {
            setTimeout(() => {
                const m = this.ai.makeMove("pretas"); // retorna {from, to}
                if (m) {
                    this.view.lastMove = { from: m.from, to: m.to };
                    this.view.render();
                    this.view.highlightCell(m.to); // destaque amarelo temporário
                    console.log(`IA moveu de ${m.from} para ${m.to}`);
                }

                // Verifica xeque após movimento da IA
                this.currentTurn = "brancas";
                if (this.validator.isKingInCheck("brancas")) {
                    console.log("Xeque para brancas!");
                    if (this.validator.isCheckmate("brancas")) {
                        console.log("Xeque-mate! Pretas venceram!");
                        this.gameOver = true;
                        // Chama a View para mostrar a mensagem de fim de jogo
                        this.view.onGameOver({ winner: "pretas", reason: "checkmate" });
                    }
                }
            }, 300); // atraso de 300ms para animação
        }

        return true;
    }

    /* ---------------- Novo método para resetar o jogo ---------------- */
    resetGame() {
        console.log("Reiniciando o jogo...");

        // Resetando o tabuleiro
        this.board.resetBoard();

        // Resetando as variáveis de controle
        this.gameOver = false;
        this.currentTurn = "brancas";  // Pode ser "brancas" ou "pretas", dependendo de como você quer iniciar
        this.lastMove = null;          // Limpa o último movimento

        // Resetando a IA
        this.ai.reset();  // Resetando a IA para não fazer o movimento da partida anterior

        // Re-renderizando o tabuleiro
        this.view.render();

        console.log("Jogo reiniciado!");
    }
}
