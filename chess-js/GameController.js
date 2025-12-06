// GameController.js — v2
import { Board } from './Board.js';
import { MoveValidator } from './MoveValidator.js';
import { AI } from './AI.js';
import { View } from './View.js';

export class GameController {
    constructor() {
        console.log("GameController inicializando...");

        this.board = new Board();
        this.validator = new MoveValidator(this.board.board);
        this.ai = new AI(this.board, this);

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

        if (!this.gameOver && this.currentTurn === "pretas") {
            setTimeout(() => {
                this.ai.makeMove("pretas");
                
                // marca último movimento das pretas
                this.lastAIMove = m;
                this.view.renderLastAIMove(m.to); // <--- destaque visual
                
                this.view.render();

                this.currentTurn = "brancas";

                if (this.validator.isKingInCheck("brancas")) {
                    if (this.validator.isCheckmate("brancas")) {
                        this.gameOver = true;
                        this.view.onGameOver({
                            winner: "pretas",
                            reason: "checkmate"
                        });
                    }
                }

            }, 300);
        }

        return true;
    }
}

console.log("GameController carregado!");

