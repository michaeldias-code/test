// MoveValidator.js v10
export class MoveValidator {

    constructor(boardArray) {
        this.board = boardArray;
        this.enPassantTarget = null; // posição do peão vulnerável ao en passant
        console.log("MoveValidator carregado!");
    }

    // ---------------------------------------
    // Regras básicas
    // ---------------------------------------
    isValidPosition(pos) {
        return pos >= 0 && pos < 64;
    }

    row(pos) { return Math.floor(pos / 8); }
    col(pos) { return pos % 8; }

    sameRow(a, b) { return this.row(a) === this.row(b); }
    sameCol(a, b) { return this.col(a) === this.col(b); }

    // ---------------------------------------
    // CHECA SE MOVIMENTO DESLIZANTE QUEBRA BORDAS
    // ---------------------------------------
    slidingStepOk(start, next, offset) {
        const sr = this.row(start);
        const sc = this.col(start);
        const nr = this.row(next);
        const nc = this.col(next);

        switch (offset) {
            case -1: return nr === sr && nc === sc - 1;
            case 1: return nr === sr && nc === sc + 1;

            case -8: return nc === sc && nr === sr - 1;
            case 8: return nc === sc && nr === sr + 1;

            case -9: return (nr === sr - 1) && (nc === sc - 1);
            case -7: return (nr === sr - 1) && (nc === sc + 1);
            case 7: return (nr === sr + 1) && (nc === sc - 1);
            case 9: return (nr === sr + 1) && (nc === sc + 1);

            default: return false;
        }
    }

    // ---------------------------------------
    // MOVIMENTOS DESLIZANTES
    // ---------------------------------------
    getSlidingMoves(pos, directions) {
        const moves = [];
        const piece = this.board[pos];

        for (let d of directions) {
            let p = pos + d;

            while (this.isValidPosition(p) && this.slidingStepOk(p - d, p, d)) {
                const target = this.board[p];

                if (!target) {
                    moves.push(p);
                } else {
                    if (target.cor !== piece.cor) moves.push(p);
                    break;
                }

                p += d;
            }
        }

        return moves;
    }

    // ---------------------------------------
    // MOVIMENTOS DE UMA PEÇA (SEM FILTRO DE XEQUE)
    // ---------------------------------------
	rawMoves(pos) {
		const piece = this.board[pos];
		if (!piece) return [];
	
		const moves = [];
		const r = this.row(pos);
		const c = this.col(pos);
	
		const add = (to, reason) => {
			if (!this.isValidPosition(to)) return;
			const tgt = this.board[to];
			if (!tgt || tgt.cor !== piece.cor) {
				moves.push(to);
				console.log(`✔ Movimento válido de ${piece.tipo} em ${this.indexToNotation(pos)} → ${this.indexToNotation(to)} (${reason})`);
			} else {
				console.log(`✖ Movimento bloqueado em ${this.indexToNotation(to)} (${reason})`);
			}
		};
	
		switch (piece.tipo) {
			case "♙": // peão branco
				console.log(`♙ Avaliando peão branco em ${this.indexToNotation(pos)}`);
				// avanço normal
				if (r > 0 && !this.board[pos - 8]) add(pos - 8, 'avançar 1');
				// avanço duplo
				if (r === 6 && !this.board[pos - 8] && !this.board[pos - 16]) add(pos - 16, 'avançar 2');
				// capturas normais
				if (c > 0 && this.board[pos - 9] && this.board[pos - 9].cor === "pretas") add(pos - 9, 'captura esquerda');
				if (c < 7 && this.board[pos - 7] && this.board[pos - 7].cor === "pretas") add(pos - 7, 'captura direita');
				// en passant
				if (r === 3) {
					console.log(`♙ Checando en passant em ${this.indexToNotation(pos)}`);
					if (c > 0 && this.enPassantTarget === pos - 1) {
						moves.push(pos - 9);
						console.log(`♙ En passant disponível à esquerda: ${this.indexToNotation(pos - 9)}`);
					}
					if (c < 7 && this.enPassantTarget === pos + 1) {
						moves.push(pos - 7);
						console.log(`♙ En passant disponível à direita: ${this.indexToNotation(pos - 7)}`);
					}
				}
				break;
	
			case "♟": // peão preto
				console.log(`♟ Avaliando peão preto em ${this.indexToNotation(pos)}`);
				if (r < 7 && !this.board[pos + 8]) add(pos + 8, 'avançar 1');
				if (r === 1 && !this.board[pos + 8] && !this.board[pos + 16]) add(pos + 16, 'avançar 2');
				if (c < 7 && this.board[pos + 9] && this.board[pos + 9].cor === "brancas") add(pos + 9, 'captura direita');
				if (c > 0 && this.board[pos + 7] && this.board[pos + 7].cor === "brancas") add(pos + 7, 'captura esquerda');
				if (r === 4) {
					console.log(`♟ Checando en passant em ${this.indexToNotation(pos)}`);
					if (c > 0 && this.enPassantTarget === pos - 1) {
						moves.push(pos + 7);
						console.log(`♟ En passant disponível à esquerda: ${this.indexToNotation(pos + 7)}`);
					}
					if (c < 7 && this.enPassantTarget === pos + 1) {
						moves.push(pos + 9);
						console.log(`♟ En passant disponível à direita: ${this.indexToNotation(pos + 9)}`);
					}
				}
				break;
	
			// ... aqui entram as outras peças como antes (torre, bispo, etc.)
		}
	
		return moves;
	}

    // ---------------------------------------
    // FILTRO DE CHEQUE
    // ---------------------------------------
    getPossibleMoves(pos) {
        const piece = this.board[pos];
        if (!piece) return [];

        let moves = this.rawMoves(pos);
        const res = [];

        // Roque para o rei
        if (piece.tipo === "♔" || piece.tipo === "♚") {
            const color = piece.cor;
            const row = color === "brancas" ? 7 : 0;

            // Roque curto
            if (!piece.hasMoved) {
                const shortRook = this.board[row*8 + 7];
                if (shortRook && !shortRook.hasMoved) {
                    if (
                        !this.board[row*8 + 5] &&
                        !this.board[row*8 + 6] &&
                        !this.isCellAttacked(row*8 + 4, color) &&
                        !this.isCellAttacked(row*8 + 5, color) &&
                        !this.isCellAttacked(row*8 + 6, color)
                    ) moves.push(row*8 + 6);
                }
            }

            // Roque longo
            if (!piece.hasMoved) {
                const longRook = this.board[row*8 + 0];
                if (longRook && !longRook.hasMoved) {
                    if (
                        !this.board[row*8 + 1] &&
                        !this.board[row*8 + 2] &&
                        !this.board[row*8 + 3] &&
                        !this.isCellAttacked(row*8 + 4, color) &&
                        !this.isCellAttacked(row*8 + 3, color) &&
                        !this.isCellAttacked(row*8 + 2, color)
                    ) moves.push(row*8 + 2);
                }
            }
        }

        for (let to of moves) {
            if (this.wouldNotLeaveKingInCheck(pos, to)) {
                res.push(to);
            }
        }

        return res;
    }

    // ---------------------------------------
    // Movimento temporário seguro
    // ---------------------------------------
    wouldNotLeaveKingInCheck(from, to) {
        const piece = this.board[from];
        const backupFrom = piece;
        const backupTo = this.board[to];

        this.board[to] = piece;
        this.board[from] = null;

        const safe = !this.isKingInCheck(piece.cor);

        this.board[from] = backupFrom;
        this.board[to] = backupTo;

        return safe;
    }

    // ---------------------------------------
    // CHEQUE
    // ---------------------------------------
    isKingInCheck(color) {
        const kingPos = this.board.findIndex(p =>
            p && (
                (p.tipo === "♔" && p.cor === color) ||
                (p.tipo === "♚" && p.cor === color)
            )
        );
        if (kingPos === -1) return false;

        for (let i = 0; i < 64; i++) {
            const p = this.board[i];
            if (!p || p.cor === color) continue;

            const moves = this.rawMoves(i);
            if (moves.includes(kingPos)) return true;
        }

        return false;
    }

    // ---------------------------------------
    // CHEQUE-MATE
    // ---------------------------------------
    isCheckmate(color) {
        if (!this.isKingInCheck(color)) return false;

        for (let i = 0; i < 64; i++) {
            const p = this.board[i];
            if (p && p.cor === color) {
                const moves = this.getPossibleMoves(i);
                if (moves.length > 0) return false;
            }
        }

        return true;
    }

    // ---------------------------------------
    // CASA ATACADA
    // ---------------------------------------
    isCellAttacked(pos, color) {
        const enemyColor = color === "brancas" ? "pretas" : "brancas";

        for (let i = 0; i < 64; i++) {
            const p = this.board[i];
            if (!p || p.cor !== enemyColor) continue;

            const moves = this.rawMoves(i);
            if (moves.includes(pos)) return true;
        }

        return false;
    }
}
