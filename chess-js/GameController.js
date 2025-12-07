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
        this.ai = new AI(this.board, this.validator, true);

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

    // Método principal para mover peças, agora usando notação algébrica
    movePiece(fromNotation, toNotation) {
        if (this.gameOver) return false;

        const from = this.notationToIndex(fromNotation);  // Convertendo notação para índice
        const to = this.notationToIndex(toNotation);  // Convertendo notação para índice

        const piece = this.board.board[from];
        if (!piece || piece.cor !== this.currentTurn) return false;

        const validMoves = this.validator.getPossibleMoves(from);
        if (!validMoves.includes(to)) return false;

        // ----------------------------
        // Captura en passant
        // ----------------------------
        if ((piece.tipo === "♙" || piece.tipo === "♟") && from % 8 !== to % 8 && !this.board.board[to]) {
            const epIndex = this.validator.enPassantTarget;
            if (epIndex !== null) {
                this.board.board[epIndex] = null;
                console.log(`♙ Captura en passant em ${this.indexToNotation(epIndex)}`);
            }
        }

        // ----------------------------
        // Executa movimento normal
        // ----------------------------
        this.board.movePiece(from, to);
        console.log(`👤 Jogador: ${fromNotation} → ${toNotation}`);

        // ----------------------------
        // Atualiza enPassantTarget
        // ----------------------------
        this.validator.enPassantTarget = null;
        if (piece.tipo === "♙" && from - to === 16) this.validator.enPassantTarget = from - 8;
        if (piece.tipo === "♟" && to - from === 16) this.validator.enPassantTarget = from + 8;

        // ----------------------------
        // Detecta roque
        // ----------------------------
        if (piece.tipo === "♔" || piece.tipo === "♚") {
            const row = piece.cor === "brancas" ? 7 : 0;
            // Roque curto
            if (to === row * 8 + 6) {
                console.log("♔ Roque curto!");
                this.board.movePiece(row * 8 + 7, row * 8 + 5);
            }
            // Roque longo
            if (to === row * 8 + 2) {
                console.log("♔ Roque longo!");
                this.board.movePiece(row * 8 + 0, row * 8 + 3);
            }
        }

        this.view.lastMove = { from: fromNotation, to: toNotation };
        this.view.render();

        // ----------------------------
        // Promoção de peão
        // ----------------------------
        if ((piece.tipo === "♙" && to < 8) || (piece.tipo === "♟" && to >= 56)) {
            console.log(`✨ Promoção detectada! Peão chegou em ${toNotation}`);
            this.pendingPromotionPos = to;
            this.view.showPromotionModal(piece.cor, (simbolo) => {
                this.promotePawn(this.pendingPromotionPos, simbolo);
            });
            return true;
        }

        // ----------------------------
        // Troca de turno
        // ----------------------------
        this.currentTurn = this.currentTurn === "brancas" ? "pretas" : "brancas";

        // Loga estado de check/checkmate
        this.logCheckState(this.currentTurn);
        if (this.gameOver) return true;

        // ----------------------------
        // Turno da IA
        // ----------------------------
        if (this.currentTurn === "pretas") {
            if (this.aiTimerId) {
                clearTimeout(this.aiTimerId);
                this.aiTimerId = null;
            }

            this.aiTimerId = setTimeout(() => {
                if (this.gameOver) return;

                const m = this.ai.makeMove("pretas");
                if (m) {
                    this.view.lastMove = { from: this.indexToNotation(m.from), to: this.indexToNotation(m.to) };
                    this.view.render();
                    this.view.highlightCell(m.to);
                    console.log(`♟️ IA: ${this.indexToNotation(m.from)} → ${this.indexToNotation(m.to)}`);

                    // Promoção automática da IA
                    const moved = this.board.board[m.to];
                    if (moved.tipo === "♙" && m.to < 8) this.promotePawn(m.to, "rainha");
                    if (moved.tipo === "♟" && m.to >= 56) this.promotePawn(m.to, "rainha");
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

    // Método para converter de notação para índice (ex: 'e2' -> 8)
    notationToIndex(notation) {
        const files = "abcdefgh";
        const file = notation[0];
        const rank = parseInt(notation[1], 10);
        const fileIndex = files.indexOf(file);

        if (fileIndex === -1 || rank < 1 || rank > 8) return -1;  // Retorna inválido se for notação errada

        return (8 - rank) * 8 + fileIndex;
    }

    indexToNotation(i) {
        const files = "abcdefgh";
        const file = files[i % 8];
        const rank = 8 - Math.floor(i / 8);
        return `${file}${rank}`;
    }

    /* ------------------------------------------------------
       🔥 MÉTODO NOVO — executa a promoção após escolha do modal
    ------------------------------------------------------ */
    promotePawn(pos, escolha) {
        const piece = this.board.board[pos];
        if (!piece) return;

        const cor = piece.cor;

        const simboloParaNome = {
            "♕": "rainha", "♛": "rainha",
            "♖": "torre",  "♜": "torre",
            "♗": "bispo",  "♝": "bispo",
            "♘": "cavalo", "♞": "cavalo"
        };

        if (simboloParaNome[escolha]) {
            escolha = simboloParaNome[escolha];
        }

        const mapa = {
            rainha: cor === "brancas" ? "♕" : "♛",
            torre:  cor === "brancas" ? "♖" : "♜",
            bispo:  cor === "brancas" ? "♗" : "♝",
            cavalo: cor === "brancas" ? "♘" : "♞"
        };

        piece.tipo = mapa[escolha];

        console.log(
            `🚀 Promoção concluída em ${this.indexToNotation(pos)} para: ${escolha}`
        );

        this.view.hidePromotionModal();
        this.view.render();

        this.currentTurn = cor === "brancas" ? "pretas" : "brancas";
        // 🔥 Após a promoção, inicia turno da IA (se for vez das pretas)
        if (this.currentTurn === "pretas" && !this.gameOver) {
            setTimeout(() => {
                const m = this.ai.makeMove("pretas");
                if (m) {
                    this.view.lastMove = { from: this.indexToNotation(m.from), to: this.indexToNotation(m.to) };
                    this.view.render();
                    this.view.highlightCell(m.to);
                    console.log(`♟️ IA: ${this.indexToNotation(m.from)} → ${this.indexToNotation(m.to)}`);
                }
                this.currentTurn = "brancas";
            }, 300);
        }
    }

    logCheckState(cor) {
        if (this.validator.isKingInCheck(cor)) {
            console.log(`⚠️ Check em ${cor}!`);

            if (this.validator.isCheckmate(cor)) {
                console.log(`💀 Checkmate! ${cor === "brancas" ? "pretas" : "brancas"} venceu!`);
                this.gameOver = true;
                this.view.onGameOver({ 
                    winner: cor === "brancas" ? "pretas" : "brancas",
                    reason: "checkmate"
                });
            }
        }
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
