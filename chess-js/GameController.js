// GameController.js — v2.3
import { Board } from './Board.js';
import { MoveValidator } from './MoveValidator.js';
import { AI } from './AI.js';
import { View } from './View.js';

export class GameController {
    constructor() {
        console.log("GameController inicializando...");

        this.board = new Board();
        this.validator = new MoveValidator(this.board.board);
        this.ai = new AI(this.board, this.validator);

        this.view = new View(this.board, this);

        this.currentTurn = "brancas";
        this.gameOver = false;

        console.log("GameController carregado!");
    }

    movePiece(from, to) {
        if (this.gameOver) return false;

        const piece = this.board.board[from];
        if (!piece) return false;

        if (piece.cor !== this.currentTurn) return false;

        const validMoves = this.validator.getPossibleMoves(from);
        if (!validMoves.includes(to)) return false;

        this.board.movePiece(from, to);
        this.view.render();

        const enemy = this.currentTurn === "brancas" ? "pretas" : "brancas";
        this.currentTurn = enemy;

        if (this.validator.isKingInCheck(enemy)) {
            console.log(`Xeque em ${enemy}!`);

            if (this.validator.isCheckmate(enemy)) {
                console.log(`Checkmate! ${piece.cor} venceu!`);
                this.gameOver = true;

                this.view.onGameOver({
                    winner: piece.cor,
                    reason: "checkmate"
                });

                return true;
            }
        }

        if (this.currentTurn === 'pretas') {
            setTimeout(() => {
                const m = this.ai.makeMove('pretas'); // agora retorna o movimento
                this.view.render(); 
                this.currentTurn = 'brancas';

                // Aqui você pode usar `m.from` e `m.to` se quiser destacar a casa
                if (m) {
                    console.log(`IA moveu de ${m.from} para ${m.to}`);
                    this.view.highlightCell(m.to);
                }

                // Verifica xeque
                if (this.validator.isKingInCheck(this.currentTurn)) {
                    console.log(`Xeque para ${this.currentTurn}!`);
                    if (this.validator.isCheckmate(this.currentTurn)) {
                        console.log(`Xeque-mate! Pretas venceram!`);
                        this.gameOver = true; 
                        this.view.onGameOver({
                            winner: this.currentTurn,
                            reason: 'checkmate'
                        });                      
                    }
                }
            }, 300);
        }
        return true;
    }
}

console.log("GameController carregado!");




