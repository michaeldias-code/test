// EnPassant.js -vGem
/**
 * Módulo responsável por gerenciar o estado e validar movimentos En Passant (EP).
 * Deve ser passado para MoveValidator e AI.
 */
export class EnPassant {
	// A posição no tabuleiro para onde o peão pode se mover para capturar.
	// Esta posição deve ser ZERADA a cada novo turno do jogador.
	// O GameController é responsável por atualizar este estado.
	constructor() {
		this.targetPos = null; // Índice (0-63) do quadrado VAZIO alvo EP.
	}

	/**
	 * Zera o estado EP no início do turno do próximo jogador,
	 * garantindo que o EP seja válido apenas no turno seguinte a um passo duplo.
	 */
	resetTarget() {
		this.targetPos = null;
		// console.log("EP target resetado.");
	}
	
	/**
	 * Registra o alvo EP após um movimento de peão de 2 casas.
	 * O GameController é quem deve chamar esta função.
	 * @param {number|null} pos O índice do quadrado vazio alvo (ou null).
	 */
	setTarget(pos) {
		this.targetPos = pos;
		// if (pos !== null) console.log(`EP target definido para: ${pos}`);
	}

	/**
	 * Retorna o alvo EP para o MoveValidator.rawMoves (para listar os movimentos possíveis).
	 * O peão só pode ter um alvo EP de cada vez.
	 * @param {number} pawnPos A posição atual do peão que está verificando.
	 * @returns {number[]} Array contendo 0 ou 1 alvo EP.
	 */
	getEnPassantTargetsForPawn(pawnPos) {
		if (this.targetPos === null) return [];

		// 1. Checar se o alvo EP está na mesma linha EP que o peão.
		const pawnRow = Math.floor(pawnPos / 8);
		const targetRow = Math.floor(this.targetPos / 8);
		
		// Linha EP para Brancas: 3 (índices 24-31). Peão Branco: Linha 4 (índices 32-39).
		// Linha EP para Pretas: 6 (índices 40-47). Peão Preto: Linha 5 (índices 32-39).
		if (pawnRow !== 3 && pawnRow !== 4) return [];

		// 2. Checar se o peão está adjacente (coluna) ao alvo EP.
		const pawnCol = pawnPos % 8;
		const targetCol = this.targetPos % 8;

		if (Math.abs(pawnCol - targetCol) !== 1) return [];
		
		// 3. Checar se o alvo EP está na linha correta (ex: peão branco na linha 4 mira linha 3)
		// Brancas (Linha 4 -> Linha 3): target deve ser pos-8.
		if (pawnRow === 4 && targetRow === 2 && this.targetPos === pawnPos - 8) {
			return [this.targetPos];
		}
		// Pretas (Linha 3 -> Linha 4): target deve ser pos+8.
		if (pawnRow === 3 && targetRow === 5 && this.targetPos === pawnPos + 8) {
			return [this.targetPos];
		}

		return [];
	}

	/**
	 * Determina se o movimento é um En Passant e retorna a posição da peça capturada.
	 *
	 * O MoveValidator usa isso na simulação de xeque (`wouldNotLeaveKingInCheck`).
	 * O GameController usa isso para saber se deve chamar `movePiece` com 4 argumentos.
	 *
	 * @param {number} from Índice de origem do Peão que se move
	 * @param {number} to Índice de destino (o quadrado vazio EP)
	 * @param {Object} piece Peça que está se movendo (deve ser um Peão)
	 * @returns {number|null} Posição da peça capturada (o peão adversário) ou null.
	 */
	isEnPassantMove(from, to, piece) {
		// 1. Não é peão? Não é EP.
		if (piece.tipo !== '♙' && piece.tipo !== '♟') return null;

		// 2. O destino 'to' é um alvo EP válido para esta peça?
		const targets = this.getEnPassantTargetsForPawn(from);
		if (!targets.includes(to)) return null;

		// 3. Se for EP, o índice da peça capturada é o peão adjacente.
		if (piece.tipo === '♙') { // Peão branco (se move de 4 para 3. Captura em 4)
			return to + 8;
		} else if (piece.tipo === '♟') { // Peão preto (se move de 3 para 4. Captura em 3)
			return to - 8;
		}

		return null;
	}
}

// export default EnPassant; // (Como o GameController importa com 'EnPassant from', usaremos export default)

