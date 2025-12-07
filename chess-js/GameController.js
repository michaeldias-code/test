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

        this.aiTimerId = null;

        this.view.setupRestartButton(() => {
            this.resetGame();
        });

        console.log("GameController carregado!");
    }

    movePiece(from, to) {
        if (this.gameOver) return false;

        const piece = this.board.board[from];
        if (!piece) return false;
        if (piece.cor !== this.currentTurn) return false;

        const validMoves = this.validator.getPossibleMoves(from);
        if (!validMoves.includes(to)) return false;

        // Executa movimento
        this.board.movePiece(from, to);
        this.view.lastMove = { from, to };
        this.view.render();

        /* ------------------------------------------------------------------
           🔥 DETECÇÃO DE PROMOÇÃO DE PEÃO (SEM ALTERAR SUA LÓGICA EXISTENTE)
        ------------------------------------------------------------------ */
        if (piece.tipo === "♙" || piece.tipo === "♟") {
            if ((piece.cor === "brancas" && to < 8) || (piece.cor === "pretas" && to >= 56)) {            
                // É AQUI QUE VOCÊ COLOCA AS 3 LINHAS
				this.pendingPromotionPos = to;
				this.view.showPromotionModal(piece.cor, (symbol) => {
					this.promotePawn(this.pendingPromotionPos, symbol);
				});
				return true;
            }
        }
        // Troca turno
        this.currentTurn = this.currentTurn === "brancas" ? "pretas" : "brancas";

        // Xeque / xeque-mate
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
            if (this.aiTimerId) {
                clearTimeout(this.aiTimerId);
                this.aiTimerId = null;
            }

            this.aiTimerId = setTimeout(() => {
                if (this.gameOver) return;

                const m = this.ai.makeMove("pretas");
                if (m) {
                    this.view.lastMove = { from: m.from, to: m.to };
                    this.view.render();
                    this.view.highlightCell(m.to);
                    console.log(`IA moveu de ${m.from} para ${m.to}`);

                    /* 🔥 PROMOÇÃO DE PEÃO PELA IA */
                    const moved = this.board.board[m.to];
					// IA promove automaticamente para rainha
					if (moved.tipo === "♙" && m.to < 8) {
						this.promotePawn(m.to, "rainha");
					}
					if (moved.tipo === "♟" && m.to >= 56) {
						this.promotePawn(m.to, "rainha");
					}
                }

                this.aiTimerId = null;

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

    /* ------------------------------------------------------
       🔥 MÉTODO NOVO — executa a promoção após escolha do modal
    ------------------------------------------------------ */
	promotePawn(pos, escolha) {
		const piece = this.board.board[pos];
		if (!piece) return;
	
		const cor = piece.cor;
	
		// Conversão de símbolo → nome
		const simboloParaNome = {
			"♕": "rainha", "♛": "rainha",
			"♖": "torre",  "♜": "torre",
			"♗": "bispo",  "♝": "bispo",
			"♘": "cavalo", "♞": "cavalo"
		};
	
		// se veio símbolo, converte para nome
		if (simboloParaNome[escolha]) {
			escolha = simboloParaNome[escolha];
		}
	
		const mapa = {
			rainha: cor === "brancas" ? "♕" : "♛",
			torre:  cor === "brancas" ? "♖" : "♜",
			bispo:  cor === "brancas" ? "♗" : "♝",
			cavalo: cor === "brancas" ? "♘" : "♞"
		};
	
		// proteção contra qualquer erro
		if (!mapa[escolha]) {
			console.error("Promoção inválida:", escolha);
			return;
		}
	
		piece.tipo = mapa[escolha];
	
		this.view.hidePromotionModal();
		this.view.render();
	
		this.currentTurn = cor === "brancas"
			? "pretas"
			: "brancas";
	}
    
    /* ---------------- Reset do jogo (inalterado exceto correções seguras) ---------------- */
    resetGame() {
        console.log("Reiniciando o jogo...");

        if (this.aiTimerId) {
            clearTimeout(this.aiTimerId);
            this.aiTimerId = null;
        }

        this.board = new Board();
        this.validator = new MoveValidator(this.board.board);
        this.ai = new AI(this.board, this.validator);

        this.gameOver = false;
        this.currentTurn = "brancas";
        this.lastMove = null;

        this.view.board = this.board;
        this.view.selected = null;
        this.view.lastMove = null;

        this.view.render();
        this.view.hidePromotionModal();

        console.log("Jogo reiniciado!");
    }
}
