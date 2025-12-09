// AI.js (AI Controller/Manager)

import AI_Easy from './AI_Easy.js';
import AI_Medium from './AI_Medium.js'; 
import AI_Hard from './AI_Hard.js';   

class AI {
    /**
     * @param {string} [initialDifficulty='easy'] - O nível de dificuldade inicial.
     */
    constructor(initialDifficulty = 'easy') {
        this.strategies = {
            'easy': AI_Easy,
            'medium': AI_Medium,
            'hard': AI_Hard,
        };
        
        this.currentStrategy = null; 
        
        const difficultyToSet = this.strategies[initialDifficulty.toLowerCase()] 
                                ? initialDifficulty.toLowerCase() 
                                : 'easy';

        this.setDifficulty(difficultyToSet);
    }

    /**
     * Define a estratégia de IA a ser usada.
     * @param {string} difficulty - 'easy', 'medium', 'hard', etc.
     */
    setDifficulty(difficulty) {
        const difficultyKey = difficulty.toLowerCase();
        const StrategyClass = this.strategies[difficultyKey];

        if (StrategyClass) {
            this.currentStrategy = new StrategyClass();
            console.log(`✅ AI Dificuldade definida para: ${difficultyKey}`);
        } else {
            console.error(`❌ Dificuldade desconhecida: ${difficulty}. Falha na definição.`);
            if (!this.currentStrategy) {
                this.currentStrategy = new AI_Easy();
                console.log(`✅ AI Dificuldade forçada para: easy (fallback)`);
            }
        }
    }

    /**
     * Método público principal para obter um movimento.
     * **CORREÇÃO:** Inclui a chamada de delegação completa para a estratégia.
     * * @param {object} boardState - O estado atual do tabuleiro.
     * @param {string} playerColor - A cor da peça que a IA está jogando.
     * @returns {object|null} O movimento escolhido.
     */
    getBestMove(boardState, playerColor) {
        if (!this.currentStrategy || typeof this.currentStrategy.findMove !== 'function') {
            console.error("AI: Estratégia de IA não inicializada ou método 'findMove' ausente.");
            return null; 
        }
        
        // *** AQUI ESTÁ A CHAMA DELEGADA COMPLETA ***
        return this.currentStrategy.findMove(boardState, playerColor);
    }

    /**
     * Exemplo de método original que precisa ser mantido ou delegado.
     * Se este método existia no seu AI.js original, ele deve continuar aqui.
     * Você pode delegá-lo à estratégia atual (se ela tiver um método correspondente)
     * ou usar lógica de controle aqui.
     */
    isThinking() {
        // Exemplo de delegação: Se a estratégia atual tiver um método 'isSearching'
        if (this.currentStrategy && typeof this.currentStrategy.isSearching === 'function') {
            return this.currentStrategy.isSearching();
        }
        
        // Lógica de controle: Se não houver método de delegação, o controlador assume um padrão.
        return false; 
    }
    
    // Inclua quaisquer outros métodos públicos que seu motor de jogo utiliza!
}

export default AI;


