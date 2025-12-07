// MoveValidator.js
export class MoveValidator {

    constructor(boardArray) {
        this.board = boardArray;
        console.log("MoveValidator carregado!");
        this.enPassantList = [];  // Lista de peões que podem fazer en passant
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

	/**
	* Verifica se a jogada é válida para en passant e se a captura pode ser feita.
	* 
	* @param {Object} move - O movimento da peça, contendo as posições de origem e destino.
	* @returns {Boolean} - Retorna verdadeiro se a jogada de en passant for válida.
	*/
	checkEnPassant(move) {
		const { from, to, piece } = move;  // de onde a peça está indo e a peça em si
		const direction = piece.cor === "brancas" ? 1 : -1;  // Direção do movimento: +1 para brancas, -1 para pretas
		const oppositeDirection = piece.cor === "brancas" ? -1 : 1;  // Direção oposta (oponente)

		// Log para entender o movimento
		console.log(`Recebido movimento: ${piece.cor} ${piece.tipo} de ${from} para ${to}`);

		// 1. Verifica se o movimento é válido para um peão
		if (piece.tipo !== "peao") {
			console.log("Movimento não é de peão, en passant não é possível.");
			return false;  // Não é um peão, não há como realizar en passant
		}

		// 2. Verifica se o movimento foi para a captura em en passant
		if (this.isEnPassantCapture(move)) {
			console.log("Captura en passant detectada!");

			// 3. Verifica se o peão está apto para a captura en passant
			if (this.enPassantList.includes(to)) {
				console.log(`Movimento de en passant válido: de ${from} para ${to}`);
				return true;
			} else {
				console.log(`Captura en passant não permitida: peão não apto para captura.`);
				return false;
			}
		}

		// 4. Se não é captura en passant, retorna false
		console.log("Movimento não é uma captura en passant.");
		return false;
	}

	/**
	* Verifica se o movimento é uma captura en passant.
	* 
	* @param {Object} move - O movimento que está sendo validado.
	* @returns {Boolean} - Retorna verdadeiro se for uma captura en passant.
	*/
	isEnPassantCapture(move) {
		const { from, to, piece } = move;
		const direction = piece.cor === "brancas" ? 1 : -1;  // +1 para brancas, -1 para pretas
		const oppositeDirection = piece.cor === "brancas" ? -1 : 1;  // Direção oposta (oponente)

		// Log para acompanhar a verificação
		console.log(`Verificando se ${piece.cor} pode capturar en passant de ${from} para ${to}`);

		// 1. Verifica se a célula de destino está ocupada pelo peão inimigo
		const targetPiece = this.board[to];
		if (targetPiece && targetPiece.tipo === "peao" && targetPiece.cor !== piece.cor) {
			// 2. Verifica se o movimento foi feito por um peão inimigo nas condições certas
			const lastMove = this.board[this.lastMoveIndex];  // Pega o último movimento (para verificar a jogada de 2 casas)
			if (lastMove && lastMove.piece.tipo === "peao" && lastMove.piece.cor !== piece.cor) {
				const isTwoSquaresMove = Math.abs(lastMove.from - lastMove.to) === 16;  // Movimento de 2 casas
				if (isTwoSquaresMove && Math.abs(from - to) === 1 && to === lastMove.to) {
					// A célula do inimigo foi movida duas casas para a frente
					console.log(`Captura en passant possível: ${piece.cor} peão de ${from} para ${to}`);
					return true;
				}
			}
		}

		// Se não for uma captura en passant, retorna false
		return false;
	}

	/**
	* Atualiza a lista de peões aptos para en passant após um movimento.
	* Esta função é chamada após cada movimento para adicionar ou remover peões da lista de en passant.
	* 
	* @param {Object} move - O movimento que foi realizado.
	*/
	updateEnPassantList(move) {
		const { from, to, piece } = move;

		// Se for um peão e moveu duas casas, marca ele como apto para en passant
		if (piece.tipo === "peao" && Math.abs(from - to) === 16) {
			console.log(`Peão de ${piece.cor} de ${from} para ${to} pode ser capturado em en passant.`);
			this.enPassantList.push(to);  // Adiciona à lista de peões aptos para captura en passant
		}
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

        const add = (to) => {
            if (!this.isValidPosition(to)) return;
            const tgt = this.board[to];
            if (!tgt || tgt.cor !== piece.cor) moves.push(to);
        };

        switch (piece.tipo) {
            case "♙": // peão branco
                if (r > 0 && !this.board[pos - 8]) add(pos - 8);
                if (r === 6 && !this.board[pos - 8] && !this.board[pos - 16]) add(pos - 16);
                if (c > 0 && this.board[pos - 9] && this.board[pos - 9].cor === "pretas") add(pos - 9);
                if (c < 7 && this.board[pos - 7] && this.board[pos - 7].cor === "pretas") add(pos - 7);
                
				// ✅ LINHA NOVA: en passant
			    if (this.enPassantList.includes(pos - 9)) moves.push(pos - 9);
    			if (this.enPassantList.includes(pos - 7)) moves.push(pos - 7);
				break;
				
            case "♟": // peão preto
                if (r < 7 && !this.board[pos + 8]) add(pos + 8);
                if (r === 1 && !this.board[pos + 8] && !this.board[pos + 16]) add(pos + 16);
                if (c < 7 && this.board[pos + 9] && this.board[pos + 9].cor === "brancas") add(pos + 9);
                if (c > 0 && this.board[pos + 7] && this.board[pos + 7].cor === "brancas") add(pos + 7);
                
				// ✅ LINHA NOVA: en passant
    			if (this.enPassantList.includes(pos + 9)) moves.push(pos + 9);
    			if (this.enPassantList.includes(pos + 7)) moves.push(pos + 7);
				
				break;

            case "♖": case "♜":
                moves.push(...this.getSlidingMoves(pos, [-1,1,-8,8]));
                break;

            case "♗": case "♝":
                moves.push(...this.getSlidingMoves(pos, [-9,-7,7,9]));
                break;

            case "♕": case "♛":
                moves.push(...this.getSlidingMoves(pos, [-1,1,-8,8,-9,-7,7,9]));
                break;

            case "♘": case "♞":
                const k = [-17,-15,-10,-6,6,10,15,17];
                for (let off of k) {
                    let to = pos + off;
                    if (!this.isValidPosition(to)) continue;
                    if (Math.abs(this.row(to) - r) + Math.abs(this.col(to) - c) === 3) {
                        const tgt = this.board[to];
                        if (!tgt || tgt.cor !== piece.cor) moves.push(to);
                    }
                }
                break;

            case "♔": case "♚":
                const ko = [-9,-8,-7,-1,1,7,8,9];
                for (let off of ko) {
                    let to = pos + off;
                    if (!this.isValidPosition(to)) continue;
                    if (Math.abs(this.row(to) - r) <= 1 &&
                        Math.abs(this.col(to) - c) <= 1) {
                        const tgt = this.board[to];
                        if (!tgt || tgt.cor !== piece.cor) moves.push(to);
                    }
                }
                break;
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


