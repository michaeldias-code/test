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
        this.pendingPromotionPos = null;

        this.aiTimerId = null;

        this.view.setupRestartButton(() => this.resetGame());

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
        console.log(`?? Jogador: ${this.indexToNotation(from)} ? ${this.indexToNotation(to)}`);

        // ---------------------- EN PASSANT ----------------------
        if (piece.tipo === "♙" || piece.tipo === "♟") {
            this.handleEnPassant(from, to, piece);

            // Atualiza lista de peões aptos para en passant (apenas se andou 2 casas)
            if (Math.abs(from - to) === 16) {
                this.validator.enPassantList.push({ pos: to, piece });
            }
        }

        // ---------------------- ROQUE ----------------------
        if (piece.tipo === "♔" || piece.tipo === "♚") {
            const row = piece.cor === "brancas" ? 7 : 0;
            // Roque curto
            if (to === row * 8 + 6) this.board.movePiece(row * 8 + 7, row * 8 + 5);
            // Roque longo
            if (to === row * 8 + 2) this.board.movePiece(row * 8 + 0, row * 8 + 3);
        }

        this.view.lastMove = { from, to };
        this.view.render();

        // ---------------------- PROMOÇÃO ----------------------
        if (piece.tipo === "♙" || piece.tipo === "♟") {
            if ((piece.cor === "brancas" && to < 8) || (piece.cor === "pretas" && to >= 56)) {
                console.log(`? Promoção detectada! Peão chegou em ${this.indexToNotation(to)}`);
                this.pendingPromotionPos = to;
                this.view.showPromotionModal(piece.cor, (simbolo) => {
                    this.promotePawn(this.pendingPromotionPos, simbolo);
                });
                return true;
            }
        }

        // Troca turno
        this.currentTurn = this.currentTurn === "brancas" ? "pretas" : "brancas";

        // Loga estado de check/checkmate para o próximo jogador
        this.logCheckState(this.currentTurn);
        if (this.gameOver) return true;

        // ---------------------- TURNO DA IA ----------------------
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
                    console.log(`?? IA: ${this.indexToNotation(m.from)} ? ${this.indexToNotation(m.to)}`);

                    const moved = this.board.board[m.to];
                    // Promoção da IA
                    if ((moved.tipo === "♙" && m.to < 8) || (moved.tipo === "♟" && m.to >= 56)) {
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

    // ---------------------- EN PASSANT ----------------------
    handleEnPassant(from, to, piece) {
        console.log(`Verificando en passant de ${this.indexToNotation(from)} para ${this.indexToNotation(to)}`);

        const targetIndex = this.validator.enPassantList.find(
            e => e.pos === to && e.piece.cor !== piece.cor
        );

        if (targetIndex) {
            const captureRank = piece.cor === "brancas" ? "5" : "4"; // linha do peão inimigo
            const captureFile = this.indexToNotation(to)[0];
            const capturePos = this.notationToIndex(`${captureFile}${captureRank}`);

            console.log(`En passant executado! Peão capturado em ${this.indexToNotation(capturePos)}`);
            this.board.board[capturePos] = null;

            // Remove da lista
            this.validator.enPassantList = this.validator.enPassantList.filter(e => e.pos !== to);

            this.view.render();
            return true;
        }

        return false;
    }

    // ---------------------- AUXILIARES ----------------------
    notationToIndex(notation) {
        const files = "abcdefgh";
        const file = files.indexOf(notation[0]);
        const rank = 8 - parseInt(notation[1]);
        return rank * 8 + file;
    }

    indexToNotation(i) {
        const files = "abcdefgh";
        const file = files[i % 8];
        const rank = 8 - Math.floor(i / 8);
        return `${file}${rank}`;
    }

    // ---------------------- PROMOÇÃO ----------------------
    promotePawn(pos, escolha) {
        const piece = this.board.board[pos];
        if (!piece) return;

        const cor = piece.cor;

        const mapa = {
            rainha: cor === "brancas" ? "♕" : "♛",
            torre: cor === "brancas" ? "♖" : "♜",
            bispo: cor === "brancas" ? "♗" : "♝",
            cavalo: cor === "brancas" ? "♘" : "♞"
        };

        piece.tipo = mapa[escolha.toLowerCase()] || mapa.rainha;

        console.log(`?? Promoção concluída em ${this.indexToNotation(pos)} para: ${escolha}`);
        this.view.hidePromotionModal();
        this.view.render();

        this.currentTurn = cor === "brancas" ? "pretas" : "brancas";

        if (this.currentTurn === "pretas" && !this.gameOver) {
            setTimeout(() => {
                const m = this.ai.makeMove("pretas");
                if (m) {
                    this.view.lastMove = { from: m.from, to: m.to };
                    this.view.render();
                    this.view.highlightCell(m.to);
                    console.log(`?? IA: ${this.indexToNotation(m.from)} ? ${this.indexToNotation(m.to)}`);
                }
                this.currentTurn = "brancas";
            }, 300);
        }
    }

    logCheckState(cor) {
        if (this.validator.isKingInCheck(cor)) {
            console.log(`?? Check em ${cor}!`);
            if (this.validator.isCheckmate(cor)) {
                console.log(`?? Checkmate! ${cor === "brancas" ? "pretas" : "brancas"} venceu!`);
                this.gameOver = true;
                this.view.onGameOver({ 
                    winner: cor === "brancas" ? "pretas" : "brancas",
                    reason: "checkmate"
                });
            }
        }
    }

    // ---------------------- RESET ----------------------
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
        this.pendingPromotionPos = null;

        this.view.board = this.board;
        this.view.selected = null;
        this.view.lastMove = null;

        this.view.render();
        this.view.hidePromotionModal();

        console.log("Jogo reiniciado!");
    }
}
