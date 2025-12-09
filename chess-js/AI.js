// AI.js (AI Controller)

import AI_Easy from './AI_Easy.js';
import AI_Medium from './AI_Medium.js';
// Você adicionaria o AI_Hard aqui quando for a hora.

class AI {
    constructor(difficulty = 'easy') {
        // Mapeamento das classes de estratégia
        this.strategies = {
            'easy': AI_Easy,
            'medium': AI_Medium,
            // 'hard': AI_Hard,
        };
        
        // Instância da estratégia de IA atualmente selecionada
        this.currentStrategy = null; 
        
        // Define a dificuldade inicial
        this.setDifficulty(difficulty);
    }

    /**
     * Define a estratégia de IA a ser usada com base na string de dificuldade.
     * @param {string} difficulty - 'easy', 'medium', etc.
     */
    setDifficulty(difficulty) {
        const StrategyClass = this.strategies[difficulty];

        if (StrategyClass) {
            // Cria uma nova instância da estratégia (AI_Easy, AI_Medium, etc.)
            this.currentStrategy = new StrategyClass();
            console.log(`AI Dificuldade definida para: ${difficulty}`);
        } else {
            console.error(`Dificuldade desconhecida: ${difficulty}. Usando 'easy'.`);
            this.currentStrategy = new AI_Easy();
        }
    }

    /**
     * MÉTODO PÚBLICO PRINCIPAL: Mantém a mesma interface para os outros módulos.
     * Delega a chamada para a estratégia de IA selecionada.
     * * @param {object} boardState - O estado atual do tabuleiro (e.g., array, objeto FEN).
     * @param {string} playerColor - A cor da peça que a IA está jogando ('w' ou 'b').
     * @returns {object} O melhor movimento encontrado.
     */
    getBestMove(boardState, playerColor) {
        if (!this.currentStrategy || !this.currentStrategy.findMove) {
            console.error("Estratégia de IA não inicializada ou faltando método findMove.");
            return null; // Retorna um valor seguro, ou talvez um movimento aleatório
        }
        
        // **A ORQUESTRAÇÃO ACONTECE AQUI:** // Chama o método específico da estratégia (Easy, Medium, etc.)
        return this.currentStrategy.findMove(boardState, playerColor);
    }

    // Você pode ter outros métodos públicos aqui que também delegam ou executam lógica do controlador
    // ...
}

export default AI;


