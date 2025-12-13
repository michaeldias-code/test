// AI_Medium.js - vGem-Corrigido
// Estratégia "Medium" com heurísticas: prefere capturas, evita casas atacadas,
// não repete o último movimento sem motivo, avalia sacrifícios por valor.

export class AI_Medium {
	constructor(board, validator, enPassant) {
		this.board = board;
		this.validator = validator;
		this.enPassant = enPassant;

		// guarda último movimento que esta IA executou (para evitar repetir)
		this.lastMove = null;

		// valores das peças por símbolo (fallbacks caso não reconheça)
		this.pieceValueBySymbol = {
			"♙": 1, "♟": 1,    // peão
			"♘": 3, "♞": 3,    // cavalo
			"♗": 3, "♝": 3,    // bispo
			"♖": 5, "♜": 5,    // torre
			"♕": 9, "♛": 9,    // rainha
			"♔": 1000, "♚": 1000 // rei (valor alto para evitar trocas que percam o rei)
		};
	}

	// interface pública chamada pelo AI pai / GameController
	makeMove(color) {
		console.log("Modo Medium:");
		const enemyColor = color === "brancas" ? "pretas" : "brancas";

		// 1) coletar movimentos RAW (filtrados por cheque)
		let myRawMoves = this.getAllMovesForColor(color);
		if (myRawMoves.length === 0) return null;

		// 1.1) EXPANDIR MOVIMENTOS DESLIZANTES
		let myMoves = this.expandAllSlidingMoves(myRawMoves);

		const enemyMoves = this.getAllMovesForColor(enemyColor);

		// 2) filtrar movimentos que repetem o último sem motivo válido
		myMoves = myMoves.filter(m => !this.isForbiddenRepeat(m));

		// regra extra: impedir mover de volta para a posição anterior apenas por voltar
		myMoves = myMoves.filter(m => {
			if (!this.lastMove) return true;
			const isReverse = m.from === this.lastMove.to && m.to === this.lastMove.from;
			if (!isReverse) return true;
			if (m.capturedPiece) return true;
			if (this.willRemoveCheck(m)) return true;
			return false;
		});

		const threatened = this.getThreatenedPieces(color);
		if (threatened.length > 0) {
			console.log("⚠️ Tentando responder a ameaças...");
			
			// --- 1. CALCULAR RESPOSTAS ATIVAS (Capturar o atacante) ---
			let activeResponses = [];
			const allCaptures = myMoves.filter(m => m.capturedPiece);
			
			for (const threat of threatened) {
				const attackersPos = this.getAttackersOnSquare(threat.index, enemyColor);
				
				const safeNeutralizingCaptures = allCaptures.filter(m => {
					if (!attackersPos.includes(m.to)) return false; 
					
					// Verifica se o movimento é materialmente vantajoso (netGain >= 0)
					const capturedVal = this.valueOfPiece(m.capturedPiece);
					let netGain = capturedVal;
					
					// Simular se a peça capturadora seria atacada depois
					if (this.wouldBeAttackedAfterMove(m, enemyColor)) {
						const attackerVal = this.estimatedAttackerValueOnSquareAfterMove(m, enemyColor);
						netGain = capturedVal - attackerVal;
					}
					
					return netGain >= 0; 
				});

				activeResponses.push(...safeNeutralizingCaptures);
			}
			
			activeResponses = Array.from(new Set(activeResponses.map(JSON.stringify))).map(JSON.parse);

			
			// --- 2. EXECUTAR RESPOSTA ATIVA SE SEGURA/VANTAGEM ---

			if (activeResponses.length > 0) {
				console.log("Possíveis respostas ativas (Capturas de atacantes):", activeResponses.length);
				
				activeResponses.sort((a, b) => this.valueOfPiece(b.capturedPiece) - this.valueOfPiece(a.capturedPiece));
				
				const chosen = activeResponses[0];
				
				this.applyMoveWithEPAndRegister(chosen);
				this.lastMove = { from: chosen.from, to: chosen.to };
				return chosen; // <--- MOVE ESCOLHIDO: CAPTURA DE ATACANTE
			}
			
			// --- 3. EXECUTAR FUGA PASSIVA (Se a resposta ativa falhou) ---
			
			console.log("⚠️ Tentando fugir de peças ameaçadas (Passiva)...");
			const escapeMoves = myMoves.filter(m =>
				threatened.some(t => t.index === m.from) && !this.wouldBeAttackedAfterMove(m, enemyColor)
			);
			console.log("Possíveis movimentos de fuga (Passiva):", escapeMoves.length);
	
			if (escapeMoves.length > 0) {
				const captureEscapes = escapeMoves.filter(m => m.capturedPiece);
				const chosen = captureEscapes.length > 0
					? captureEscapes[Math.floor(Math.random() * captureEscapes.length)]
					: escapeMoves[Math.floor(Math.random() * escapeMoves.length)];
			
				this.applyMoveWithEPAndRegister(chosen);
				this.lastMove = { from: chosen.from, to: chosen.to };
				return chosen; // <--- MOVE ESCOLHIDO: FUGA SEGURA
			} else {
				console.log("Nenhuma resposta (ativa ou passiva) segura encontrada. Prosseguindo.");
			}
		}

		// 3) tentar capturas (priorizar melhores)
		const captureMoves = myMoves.filter(m => m.capturedPiece !== null);
		
		// filtra capturas que não deixam a peça capturada imediatamente (evitar suicídio)
		const safeCaptures = captureMoves.filter(m => !this.wouldBeAttackedAfterMove(m, enemyColor));

		// substitui captureMoves por safeCaptures se houver pelo menos uma segura
		if (safeCaptures.length > 0) {
			captureMoves.splice(0, captureMoves.length, ...safeCaptures);
		}
		
		if (captureMoves.length > 0) {
			const bestCapture = this.chooseBestCapture(captureMoves, color, enemyMoves);
			if (bestCapture) {
				this.applyMoveWithEPAndRegister(bestCapture);
				this.lastMove = { from: bestCapture.from, to: bestCapture.to };
				return bestCapture;
			}
		}
		// 🔥 REGRA PRINCIPAL: se existe captura, a IA deve capturar SEMPRE,
		// mesmo que a heurística chooseBestCapture não escolha uma.
		if (captureMoves.length > 0) {
			// fallback obrigatório: escolhe qualquer captura disponível
			const forcedCapture = captureMoves[Math.floor(Math.random() * captureMoves.length)];
			this.applyMoveWithEPAndRegister(forcedCapture);
			this.lastMove = { from: forcedCapture.from, to: forcedCapture.to };
			return forcedCapture;
		}


		// 4) buscar movimentos totalmente seguros (não atacados após execução)
		const safeMoves = myMoves.filter(m => !m.capturedPiece && !this.wouldBeAttackedAfterMove(m, enemyColor));
		if (safeMoves.length > 0) {
			const chosen = this.pickPreferableMove(safeMoves);
			this.applyMoveWithEPAndRegister(chosen);
			this.lastMove = { from: chosen.from, to: chosen.to };
			return chosen;
		}

		// 5) tentar movimentos que minimizam risco (menor valor do atacante possível)
		const leastRiskMoves = this.rankMovesByRisk(myMoves, enemyColor);
		if (leastRiskMoves.length > 0) {
			const chosen = leastRiskMoves[0];
			this.applyMoveWithEPAndRegister(chosen);
			this.lastMove = { from: chosen.from, to: chosen.to };
			return chosen;
		}

		// 6) fallback: escolher aleatório entre todos os movimentos
		const random = myMoves[Math.floor(Math.random() * myMoves.length)];
		this.applyMoveWithEPAndRegister(random);
		this.lastMove = { from: random.from, to: random.to };
		return random;
	}

	/* ---------------- Helper utilities ---------------- */

	// ----------------------------------------------------
	// NOVO: EXPANSÃO DE MOVIMENTOS DESLIZANTES
	// ----------------------------------------------------
	expandSlidingMove(from, to, pieceType) {
		const expandedMoves = [];
		const diff = to - from;
		let direction;
		
		// 1. Determinar a Direção (Offset)
		if (Math.abs(diff) % 9 === 0) direction = diff > 0 ? 9 : -9; // Diagonal 9
		else if (Math.abs(diff) % 7 === 0) direction = diff > 0 ? 7 : -7; // Diagonal 7
		else if (Math.abs(diff) % 8 === 0 && this.validator.sameCol(from, to)) direction = diff > 0 ? 8 : -8; // Vertical 8
		else if (this.validator.sameRow(from, to)) direction = diff > 0 ? 1 : -1; // Horizontal 1
		else return []; 

		// 2. Determinar se o movimento é legal para o tipo de peça (segurança)
		const isBishopMove = Math.abs(direction) === 7 || Math.abs(direction) === 9;
		const isRookMove = Math.abs(direction) === 1 || Math.abs(direction) === 8;

		if ((pieceType.includes('♗') || pieceType.includes('♝')) && isRookMove) return [];
		if ((pieceType.includes('♖') || pieceType.includes('♜')) && isBishopMove) return [];

		// 3. Gerar os pontos intermediários
		let step = from + direction;
		while (step !== to && this.validator.isValidPosition(step)) {
			// A checagem isCellAttacked e wouldBeAttackedAfterMove no MoveValidator
			// é que impede os wraps, mas aqui validamos se a casa está vazia
			if (!this.board.board[step]) { 
				expandedMoves.push({
					from: from,
					to: step,
					piece: this.board.board[from],
					capturedPiece: null,
				});
			} else {
				// Se a casa intermediária não estiver vazia, significa que o MoveValidator
				// não deveria ter permitido o destino final 'to', ou 'to' é uma captura
				// e estamos tentando gerar passos após a captura, o que é errado.
				break; 
			}
			step += direction;
		}

		return expandedMoves;
	}

	expandAllSlidingMoves(myRawMoves) {
		const myMoves = [];
		for (const move of myRawMoves) {
			myMoves.push(move); // Adiciona o movimento original
			
			const piece = move.piece;
			if (piece.tipo.includes('♗') || piece.tipo.includes('♝') || 
				piece.tipo.includes('♖') || piece.tipo.includes('♜') || 
				piece.tipo.includes('♕') || piece.tipo.includes('♛')) {
				
				// Adicionar todos os passos intermediários como movimentos válidos (se não forem capturas)
				if (!move.capturedPiece) {
					const intermediateMoves = this.expandSlidingMove(move.from, move.to, piece.tipo);
					myMoves.push(...intermediateMoves);
				}
			}
		}
		// Remove duplicatas
		return myMoves.filter((v, i, a) => a.findIndex(t => (t.from === v.from && t.to === v.to)) === i);
	}
	// ----------------------------------------------------
	// FIM DA EXPANSÃO DE MOVIMENTOS
	// ----------------------------------------------------


	// retorna lista de movimentos { from, to, piece, capturedPiece }
	getAllMovesForColor(color) {
		const moves = [];
		const boardArr = this.board.board;

		for (let from = 0; from < 64; from++) {
			const piece = boardArr[from];
			if (!piece || piece.cor !== color) continue;

			const possible = this.validator.getPossibleMoves(from) || [];
			for (const to of possible) {
				const captured = this.board.board[to] || null;
				moves.push({
					from,
					to,
					piece,
					capturedPiece: captured
				});
			}
		}

		return moves;
	}

	// evita repetir o mesmo movimento sem motivo
	isForbiddenRepeat(move) {
		if (!this.lastMove) return false;
		if (move.from === this.lastMove.from && move.to === this.lastMove.to) {
			// permitir se for captura
			if (move.capturedPiece) return false;

			// permitir se o movimento evita perda (i.e., seria atacado antes mas não depois)
			const color = move.piece.cor;
			const enemyColor = color === "brancas" ? "pretas" : "brancas";
			const wasAttackedBefore = this.isSquareAttacked(move.from, this.getAllMovesForColor(enemyColor));
			const wouldBeAttackedAfter = this.wouldBeAttackedAfterMove(move, enemyColor);
			if (wasAttackedBefore && !wouldBeAttackedAfter) return false;

			// permitir se sair de check (simulação)
			if (this.willRemoveCheck(move)) return false;

			// caso contrário, proibimos repetir
			return true;
		}
		return false;
	}

	getAttackersOnSquare(squareIndex, attackerColor) {
		const attackers = [];
		const enemyMoves = this.getAllMovesForColor(attackerColor);
		for (const m of enemyMoves) {
			if (m.to === squareIndex) {
				attackers.push(m.from); 
			}
		}
		return attackers; 
	}

	// escolhe melhor captura segundo ganho material (simula riscos).
	chooseBestCapture(captureMoves, myColor, enemyMoves) {
		const evaluated = captureMoves.map(m => {
			const capturedVal = this.valueOfPiece(m.capturedPiece);
			const enemyColor = myColor === "brancas" ? "pretas" : "brancas";
			
			const wouldBeAttacked = this.wouldBeAttackedAfterMove(m, enemyColor);
			let netGain = capturedVal;
			
			if (wouldBeAttacked) {
				const attackerVal = this.estimatedAttackerValueOnSquareAfterMove(m, enemyColor);
				netGain = capturedVal - attackerVal;
			}
			return { move: m, capturedVal, wouldBeAttacked, netGain };
		});
	
		// Filtra capturas com netGain < 0 (evita suicídios onde perde mais do que ganha)
		const safeEvaluated = evaluated.filter(e => e.netGain >= 0);
	
		const usedEvaluated = safeEvaluated.length > 0 ? safeEvaluated : evaluated;
	
		const positive = usedEvaluated.filter(e => e.netGain > 0);
	
		if (positive.length > 0) {
			positive.sort((a, b) => {
				if (b.capturedVal !== a.capturedVal) return b.capturedVal - a.capturedVal;
				return b.netGain - a.netGain;
			});
			const topVal = positive[0].capturedVal;
			const topCandidates = positive.filter(x => x.capturedVal === topVal);
			return topCandidates[Math.floor(Math.random() * topCandidates.length)].move;
		}
	
		const neutral = evaluated.filter(e => e.netGain === 0);
		if (neutral.length > 0) {
			const topVal = Math.max(...neutral.map(n => n.capturedVal));
			const topCandidates = neutral.filter(x => x.capturedVal === topVal);
			return topCandidates[Math.floor(Math.random() * topCandidates.length)].move;
		}
	
		return null;
	}


	// verifica se um quadrado será atacado depois de aplicar move (simulação)
	wouldBeAttackedAfterMove(move, enemyColor) {
		let attacked = false;
		this.simulateMove(move, () => {
			// Não recalculamos 'enemyMoves' aqui para evitar loops desnecessários,
			// mas confiamos no isCellAttacked do MoveValidator se ele estiver disponível.
			// Como o MoveValidator não está disponível aqui, re-calculamos.
			const enemyMoves = this.getAllMovesForColor(enemyColor); 
			attacked = enemyMoves.some(em => em.to === move.to);

			// Comentado para evitar flood de logs:
			// console.log(`Movimento de ${move.piece.tipo} ${this.indexToNotation(move.from)} -> ${this.indexToNotation(move.to)} foi simulado, atacado depois? ${attacked}`);
		});
		return attacked;
	}


	// estima valor do atacante que pode capturar nessa casa após move (menor valor atacante)
	estimatedAttackerValueOnSquareAfterMove(move, enemyColor) {
		let minVal = Infinity;
		this.simulateMove(move, () => {
			const enemyMoves = this.getAllMovesForColor(enemyColor);
			const attackers = enemyMoves.filter(em => em.to === move.to);
			for (const a of attackers) {
				const val = this.valueOfPiece(a.piece);
				if (val < minVal) minVal = val;
			}
		});
		if (minVal === Infinity) return 0;
		return minVal;
	}

	// calcula valor heurístico de uma peça (aceita Piece ou null)
	valueOfPiece(piece) {
		if (!piece) return 0;
		const v = this.pieceValueBySymbol[piece.tipo];
		if (v !== undefined) return v;
		return 1;
	}

	// ----------------------------------------------------
	// CORRIGIDO: rankMovesByRisk com Penalidade de Perda
	// ----------------------------------------------------
	rankMovesByRisk(moves, enemyColor) {
		const rated = moves.map(m => {
			const capturedVal = this.valueOfPiece(m.capturedPiece);
			let risk = 0;
			let lossPenalty = 0; // Penalidade extrema para movimentos suicidas (Problema 2)

			this.simulateMove(m, () => {
				const enemyMoves = this.getAllMovesForColor(enemyColor);
				const attackers = enemyMoves.filter(em => em.to === m.to);

				if (attackers.length > 0) {
					// 1. Risco: menor valor do atacante
					risk = Math.min(...attackers.map(a => this.valueOfPiece(a.piece)));
					
					// 2. Penalidade: Se a peça movida for de maior valor que o menor atacante
					// e não for uma captura valiosa, é um movimento arriscado/suicida.
					const myPieceVal = this.valueOfPiece(m.piece);
					
					if (myPieceVal > risk && capturedVal < myPieceVal) {
						// Aplica penalidade severa (1000) para forçar a IA a evitar isso
						lossPenalty = 1000; 
					}

				} else {
					risk = 0;
				}
			});
			// score: (Risco do Atacante - Valor Capturado * 0.1) + Penalidade por Perda
			return { move: m, score: risk - capturedVal * 0.1 + lossPenalty };
		});

		rated.sort((a, b) => a.score - b.score);
		return rated.map(r => r.move);
	}
	// ----------------------------------------------------
	// FIM DA CORREÇÃO rankMovesByRisk
	// ----------------------------------------------------


	indexToNotation(i) {
		const files = "abcdefgh";
		const file = files[i % 8];
		const rank = 8 - Math.floor(i / 8);
		return `${file}${rank}`;
	}
	
	pickPreferableMove(moves) {
		const captures = moves.filter(m => m.capturedPiece);
		if (captures.length > 0) {
			captures.sort((a, b) => this.valueOfPiece(b.capturedPiece) - this.valueOfPiece(a.capturedPiece));
			const topVal = this.valueOfPiece(captures[0].capturedPiece);
			const topCandidates = captures.filter(c => this.valueOfPiece(c.capturedPiece) === topVal);
			return topCandidates[Math.floor(Math.random() * topCandidates.length)];
		}
		return moves[Math.floor(Math.random() * moves.length)];
	}

	isSquareAttacked(squareIndex, enemyMoves) {
		return enemyMoves.some(m => m.to === squareIndex);
	}

	applyMoveWithEPAndRegister(move) {
		if (!move) return;

		const piece = this.board.board[move.from];

		let epCapturedPos = null;
		try {
			if (this.enPassant && typeof this.enPassant.isEnPassantMove === "function") {
				epCapturedPos = this.enPassant.isEnPassantMove(move.from, move.to, piece);
			}
		} catch (e) {
			epCapturedPos = null;
		}

		try {
			if (epCapturedPos !== null && epCapturedPos !== undefined) {
				this.board.movePiece(move.from, move.to, epCapturedPos);
			} else {
				this.board.movePiece(move.from, move.to);
			}
		} catch (e) {
			// Fallback: manipular array diretamente se movePiece falhar
			this.board.board[move.to] = this.board.board[move.from];
			this.board.board[move.from] = null;
		}

		try {
			if (this.enPassant && typeof this.enPassant.registerDoubleStep === "function") {
				this.enPassant.registerDoubleStep(move.from, move.to, piece);
			}
		} catch (e) {
			// ignore
		}
	}

	simulateMove(move, callback) {
		const from = move.from;
		const to = move.to;
		const originalFromPiece = this.board.board[from];
		const originalToPiece = this.board.board[to];

		this.board.board[to] = originalFromPiece;
		this.board.board[from] = null;

		try {
			callback();
		} catch (e) {
			console.error("simulateMove callback error:", e);
		}

		this.board.board[from] = originalFromPiece;
		this.board.board[to] = originalToPiece;
	}

	getThreatenedPieces(color) {
		const threatened = [];
		const enemyColor = color === "brancas" ? "pretas" : "brancas";
		const enemyMoves = this.getAllMovesForColor(enemyColor);
	
		for (let i = 0; i < 64; i++) {
			const piece = this.board.board[i];
			if (!piece || piece.cor !== color) continue;
	
			// Exclui o Rei para simplificar a lógica de 'fuga de ameaça' (o Rei tem a lógica de 'check' separada)
			if (piece.tipo === "♔" || piece.tipo === "♚") continue; 
			
			if (enemyMoves.some(m => m.to === i)) {
				// Comentado para evitar flood de logs:
				// console.log(`⚠️ Peça ameaçada: ${piece.tipo} em ${this.indexToNotation(i)} (índice ${i})`);
				threatened.push({ index: i, piece });
			}
		}
		// console.log(`Peças ameaçadas para ${color}:`, threatened.map(t => `${t.piece.tipo}@${this.indexToNotation(t.index)}`));
		return threatened;
	}

	willRemoveCheck(move) {
		let removed = false;
		const color = this.board.board[move.from]?.cor;
		if (!color) return false;

		this.simulateMove(move, () => {
			try {
				if (this.validator && typeof this.validator.isKingInCheck === "function") {
					removed = !this.validator.isKingInCheck(color);
				}
			} catch (e) {
				removed = false;
			}
		});
		return removed;
	}
}
