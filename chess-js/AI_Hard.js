export class AI_Hard {
    constructor() {
        console.log("🤖 AI_Easy carregada (modo fácil).");
    }

    /**
     * Decide qual jogada usar entre todas as válidas
     * @param {Array} validMoves
     * @returns {object|null}
     */
    chooseMove(validMoves) {
        if (!validMoves || validMoves.length === 0) return null;

        const randomIndex = Math.floor(Math.random() * validMoves.length);
        return validMoves[randomIndex];
    }
}
