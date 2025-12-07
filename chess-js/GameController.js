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
		
		console.log(
			`?? Jogador: ${this.indexToNotation(from)} ? ${this.indexToNotation(to)}`
		);

		if (piece.tipo === "?" || piece.tipo === "?") {
    		this.handleEnPassant(from, to, piece);       // captura en passant, se aplicável
    		this.validator.updateEnPassantList({ from, to, piece }); // atualiza lista de peões aptos
		}		
		
		this.moveValidator.updateEnPassant(from, to, piece);
		
		// Detecta roque
		if (piece.tipo === "?" || piece.tipo === "?") {
			const row = piece.cor === "brancas" ? 7 : 0;
			// Roque curto
			if (to === row * 8 + 6) {
				console.log("? Roque curto!");
				this.board.movePiece(row * 8 + 7, row * 8 + 5); // torre pula
			}
			// Roque longo
			if (to === row * 8 + 2) {
				console.log("? Roque longo!");
				this.board.movePiece(row * 8 + 0, row * 8 + 3); // torre pula
			}
		}
		
        this.view.lastMove = { from, to };
        this.view.render();

        /* ------------------------------------------------------------------
           ?? DETECÇÃO DE PROMOÇÃO DE PEÃO (SEM ALTERAR SUA LÓGICA EXISTENTE)
        ------------------------------------------------------------------ */
        if (piece.tipo === "?" || piece.tipo === "?") {
            if ((piece.cor === "brancas" && to < 8) || (piece.cor === "pretas" && to >= 56)) {            
                // É AQUI QUE VOCÊ COLOCA AS 3 LINHAS
				console.log(
					`? Promoção detectada! Peão chegou em ${this.indexToNotation(to)}`
				);
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
					console.log(
						`?? IA: ${this.indexToNotation(from)} ? ${this.indexToNotation(to)}`
					);

                    /* ?? PROMOÇÃO DE PEÃO PELA IA */
                    const moved = this.board.board[m.to];
					// IA promove automaticamente para rainha
					if (moved.tipo === "?" && m.to < 8) {
						this.promotePawn(m.to, "rainha");
					}
					if (moved.tipo === "?" && m.to >= 56) {
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

		handleEnPassant(from, to, piece) {
		const move = { from, to, piece };
	
		console.log(`GameController: Verificando en passant de ${this.indexToNotation(from)} para ${this.indexToNotation(to)}`);
	
		// Checa se a jogada é válida para en passant
		if (this.validator.checkEnPassant(move)) {
			// Determina a posição do peão capturado
			const captureRank = piece.cor === "brancas" ? "5" : "4"; // linha onde o peão inimigo está
			const captureFile = this.indexToNotation(to)[0];       // mesma coluna do peão que moveu
			const capturePos = this.notationToIndex(`${captureFile}${captureRank}`);
	
			console.log(`En passant executado! Peão capturado em ${this.indexToNotation(capturePos)}`);
	
			// Remove o peão capturado
			this.board.board[capturePos] = null;
	
			// Atualiza a lista de peões aptos para en passant
			this.validator.enPassantList = this.validator.enPassantList.filter(pos => pos !== to);
	
			this.view.render();
			return true;
		}
	
		return false;
	}
	
	// Função auxiliar para converter notação para índice
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

    /* ------------------------------------------------------
       ?? MÉTODO NOVO — executa a promoção após escolha do modal
    ------------------------------------------------------ */
	promotePawn(pos, escolha) {
		const piece = this.board.board[pos];
		if (!piece) return;
	
		const cor = piece.cor;
	
		const simboloParaNome = {
			"?": "rainha", "?": "rainha",
			"?": "torre",  "?": "torre",
			"?": "bispo",  "?": "bispo",
			"?": "cavalo", "?": "cavalo"
		};
	
		if (simboloParaNome[escolha]) {
			escolha = simboloParaNome[escolha];
		}
	
		const mapa = {
			rainha: cor === "brancas" ? "?" : "?",
			torre:  cor === "brancas" ? "?" : "?",
			bispo:  cor === "brancas" ? "?" : "?",
			cavalo: cor === "brancas" ? "?" : "?"
		};
	
		piece.tipo = mapa[escolha];
	
		console.log(
			`?? Promoção concluída em ${this.indexToNotation(pos)} para: ${escolha}`
		);
	
		this.view.hidePromotionModal();
		this.view.render();
	
		this.currentTurn = cor === "brancas" ? "pretas" : "brancas";
		// ?? Após a promoção, inicia turno da IA (se for vez das pretas)
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

