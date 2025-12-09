  // interface pública chamada pelo AI pai / GameController
    makeMove(color) {
        console.log("Modo Medium:");
        const enemyColor = color === "brancas" ? "pretas" : "brancas";

        // 1) coletar movimentos
        let myMoves = this.getAllMovesForColor(color);
        if (myMoves.length === 0) return null;

        const enemyMoves = this.getAllMovesForColor(enemyColor);

        // 2) filtrar movimentos que repetem o último sem motivo válido
        myMoves = myMoves.filter(m => !this.isForbiddenRepeat(m));

		// regra extra: impedir mover de volta para a posição anterior apenas por voltar
		// (mesmo que não seja captura ou escape)
		// regra extra: impedir mover de volta para a posição anterior apenas por voltar
		myMoves = myMoves.filter(m => {
			if (!this.lastMove) return true;
			const isReverse = m.from === this.lastMove.to && m.to === this.lastMove.from;
			if (!isReverse) return true;
			if (m.capturedPiece) return true;
			if (this.willRemoveCheck(m)) return true;
			return false;
		});

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
        const safeMoves = myMoves.filter(m => !this.wouldBeAttackedAfterMove(m, enemyColor));
        if (safeMoves.length > 0) {
            // desempate: preferir movimentos que capturem peças de maior valor (mesmo sem captura aqui)
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
