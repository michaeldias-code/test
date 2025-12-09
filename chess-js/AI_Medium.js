import { AI_Easy } from "./AI_Easy.js";

class AI_Medium extends AI_Easy {

    makeMove(color) {
        
        const myMoves = this.getAllMoves(color);
        const enemyMoves = this.getAllMoves(color === "brancas" ? "pretas" : "brancas");

        if (myMoves.length === 0) return null;

        // 1. Identificar jogadas de captura
        const captureMoves = myMoves.filter(m => {
            const target = this.board.board[m.to];
            return target != null; // tem peça = captura
        });

        // 2. Se existe captura boa, deve capturar
        if (captureMoves.length > 0) {
            const safeCaptures = captureMoves.filter(m => this.isSquareSafe(m.to, enemyMoves));

            // Se existem capturas seguras, pegue uma
            if (safeCaptures.length > 0)
                return safeCaptures[Math.floor(Math.random() * safeCaptures.length)];

            // Se não existe captura segura → captura mesmo assim?
            // Regra futura aqui
            return captureMoves[Math.floor(Math.random() * captureMoves.length)];
        }

        // 3. Filtrar movimentos que deixam a peça exposta
        const safeMoves = myMoves.filter(m => this.isSquareSafe(m.to, enemyMoves));

        if (safeMoves.length > 0)
            return safeMoves[Math.floor(Math.random() * safeMoves.length)];

        // 4. Caso não tenha alternativa → joga aleatório como Easy
        return myMoves[Math.floor(Math.random() * myMoves.length)];
    }

    isSquareSafe(position, enemyMoves) {
        return !enemyMoves.some(m => m.to === position);
    }
}

export { AI_Medium };
