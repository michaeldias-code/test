import { View } from './View.js?v=999';
import { AI } from './AI.js?v=999';
import { Board } from './Board.js?v=999';
import { MoveValidator } from './MoveValidator.js?v=999';

export class GameController {
    constructor() {
        console.log("GameController inicializando...");
        
        // Inicializando os módulos
        console.log("Inicializando o tabuleiro...");
        this.board = new Board();
        console.log("Tabuleiro inicializado!");
        
        console.log("Inicializando o validador de movimentos...");
        this.validator = new MoveValidator(this.board.board);
        console.log("Validador de movimentos inicializado!");
        
        console.log("Inicializando a IA...");
        this.ai = new AI(this.board, this.validator, true);
        console.log("IA inicializada!");
        
        console.log("Inicializando a View...");
        this.view = new View(this.board, this);
        console.log("View inicializada!");

        // Variáveis do estado do jogo
        this.currentTurn = "brancas";
        this.gameOver = false;
        this.lastMove = null;

        // Timer da IA
        this.aiTimerId = null;

        // Configurações iniciais da View
        console.log("Configurando botão de restart...");
        this.view.setupRestartButton(() => {
            this.resetGame();
        });
        console.log("Botão de restart configurado!");

        console.log("GameController carregado!");
    }

	movePiece(from, to) {
		console.log(`Tentando mover peça de ${this.indexToNotation(from)} para ${this.indexToNotation(to)}...`);
	
		if (this.gameOver) {
			console.log("O jogo acabou! Não é possível mover.");
			return false;
		}
	
		const piece = this.board.board[from];
		if (!piece || piece.cor !== this.currentTurn) {
			console.log(`Movimento inválido! A peça não pertence ao jogador ${this.currentTurn}.`);
			return false;
		}
	
		// Verificando movimentos válidos
		const validMoves = this.validator.getPossibleMoves(from);
		console.log(`Movimentos válidos para ${this.indexToNotation(from)}: ${validMoves}`);
		if (!validMoves.includes(to)) {
			console.log(`Movimento inválido de ${this.indexToNotation(from)} para ${this.indexToNotation(to)}.`);
			return false;
		}
	
		// Captura en passant (não usa mais índices)
		if ((piece.tipo === "♙" || piece.tipo === "♟") && !this.board.board[to]) {
			const epNotation = this.indexToNotation(this.validator.enPassantTarget);
			const fromNotation = this.indexToNotation(from);
			const toNotation = this.indexToNotation(to);
	
			// Verificando se a casa de destino está ao lado do peão adversário
			if (Math.abs(toNotation.charCodeAt(0) - fromNotation.charCodeAt(0)) === 1 && this.validator.enPassantTarget !== null) {
				if (epNotation === toNotation) {
					this.board.board[this.validator.enPassantTarget] = null;  // Remove a peça capturada por en passant
					console.log(`♙ Captura en passant em ${epNotation}`);
				}
			}
		}
	
		// Movimentando a peça
		this.board.movePiece(from, to);
		console.log(`👤 Jogador: ${this.indexToNotation(from)} → ${this.indexToNotation(to)}`);
	
		// Atualizando enPassantTarget
		this.validator.enPassantTarget = null;
		if (piece.tipo === "♙" && Math.abs(from - to) === 16) {
			// Define a casa que será possível para en passant
			const toNotation = this.indexToNotation(to);
			if (toNotation[1] === '4') this.validator.enPassantTarget = to;
		}
	
		if (piece.tipo === "♟" && Math.abs(from - to) === 16) {
			const toNotation = this.indexToNotation(to);
			if (toNotation[1] === '5') this.validator.enPassantTarget = to;
		}
	
		// Detectando roque
		if (piece.tipo === "♔" || piece.tipo === "♚") {
			const row = piece.cor === "brancas" ? 7 : 0;
			if (to === row * 8 + 6) {
				console.log("♔ Roque curto!");
				this.board.movePiece(row * 8 + 7, row * 8 + 5);
			}
			if (to === row * 8 + 2) {
				console.log("♔ Roque longo!");
				this.board.movePiece(row * 8 + 0, row * 8 + 3);
			}
		}
	
		// Atualizando a View
		this.view.lastMove = { from, to };
		this.view.render();
		
		// Verificando promoção de peão
		if ((piece.tipo === "♙" && to < 8) || (piece.tipo === "♟" && to >= 56)) {
			console.log(`✨ Promoção detectada! Peão chegou em ${this.indexToNotation(to)}`);
			this.pendingPromotionPos = to;
			this.view.showPromotionModal(piece.cor, (simbolo) => {
				this.promotePawn(this.pendingPromotionPos, simbolo);
			});
			return true;
		}
	
		// Troca de turno
		this.currentTurn = this.currentTurn === "brancas" ? "pretas" : "brancas";
		console.log(`Turno trocado! Agora é a vez das ${this.currentTurn}.`);
	
		// Checando se o rei está em check/checkmate
		this.logCheckState(this.currentTurn);
		if (this.gameOver) return true;
	
		// Turno da IA
		if (this.currentTurn === "pretas") {
			if (this.aiTimerId) {
				clearTimeout(this.aiTimerId);
				this.aiTimerId = null;
			}
	
			this.aiTimerId = setTimeout(() => {
				if (this.gameOver) return;
	
				console.log("Turno da IA: processando movimento...");
				const m = this.ai.makeMove("pretas");
				if (m) {
					this.view.lastMove = { from: m.from, to: m.to };
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

    indexToNotation(i) {
        const files = "abcdefgh";
        const file = files[i % 8];
        const rank = 8 - Math.floor(i / 8);
        return `${file}${rank}`;
    }

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
        console.log(`🚀 Promoção concluída em ${this.indexToNotation(pos)} para: ${escolha}`);

        this.view.hidePromotionModal();
        this.view.render();

        this.currentTurn = cor === "brancas" ? "pretas" : "brancas";

        // Turno da IA após promoção
        if (this.currentTurn === "pretas" && !this.gameOver) {
            setTimeout(() => {
                const m = this.ai.makeMove("pretas");
                if (m) {
                    this.view.lastMove = { from: m.from, to: m.to };
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
