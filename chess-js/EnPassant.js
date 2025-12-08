// EnPassant.js
// Módulo autocontido para gerenciar a regra de captura "en passant".
// Export default — não exige alterações em outros módulos.
//
// API:
// constructor(boardArray)
// registerDoubleStep(fromIdx, toIdx, piece)
// getEnPassantTargetsForPawn(posIdx) -> [targetIdx, ...]
// isEnPassantMove(fromIdx,toIdx,piece) -> boolean
// applyEnPassantIfPossible(fromIdx,toIdx,piece, boardObj) -> boolean
// clear()

export default class EnPassant {
    constructor(boardArray) {
        this.board = boardArray || null;

        // Índice onde um peão adversário poderia se mover para realizar en passant.
        // Ex.: se peão preto foi e7->e5, enPassantTargetIndex = e6 (índice de e6).
        this.enPassantTargetIndex = null;

        // Índice do peão que pode ser capturado via en passant (o peão que fez o double-step)
        this.capturablePawnIndex = null;

        // Debug: mantém último evento para inspeção
        this._lastLog = null;
    }

    // ---------- Helpers de conversão algébrica (úteis para debug e regras) ----------
    indexToAlgebraic(idx) {
        if (!Number.isInteger(idx) || idx < 0 || idx > 63) return null;
        const file = String.fromCharCode('a'.charCodeAt(0) + (idx % 8));
        const rank = 8 - Math.floor(idx / 8);
        return `${file}${rank}`;
    }
    algebraicToIndex(sq) {
        if (!sq || typeof sq !== 'string' || sq.length !== 2) return null;
        const file = sq.charCodeAt(0) - 'a'.charCodeAt(0);
        const rank = parseInt(sq[1], 10);
        if (isNaN(rank)) return null;
        const row = 8 - rank;
        const idx = row * 8 + file;
        if (idx < 0 || idx > 63) return null;
        return idx;
    }

    _log(...args) {
        // centraliza logs do módulo (podemos trocar para console.debug se preferir)
        try {
            console.log('[EnPassant]', ...args);
            this._lastLog = args;
        } catch (e) { /* nunca quebrar o jogo por causa do log */ }
    }

    // ---------- Registro de passo duplo de peão (deve ser chamado após movimento efetivo) ----------
    // fromIdx, toIdx: índices 0..63; piece: objeto peça movimentada (com .tipo e .cor)
    registerDoubleStep(fromIdx, toIdx, piece) {
        try {
            // Regra de OURO: se algo está errado, limpamos e saímos sem efeito colateral.
            if (!this.board || !Number.isInteger(fromIdx) || !Number.isInteger(toIdx) || !piece) {
                this.enPassantTargetIndex = null;
                this.capturablePawnIndex = null;
                return;
            }

            // Só nos interessam passos duplos de peões
            if (piece.tipo !== '♙' && piece.tipo !== '♟') {
                this.enPassantTargetIndex = null;
                this.capturablePawnIndex = null;
                return;
            }

            const delta = toIdx - fromIdx;

            // White double-step: delta = -16 (ex: 52 -> 36)
            if (piece.tipo === '♙' && delta === -16) {
                // opponent captures to toIdx + 8 (ex: white moved to e4 (36) => enPassantTarget = e3 (44)?)
                // NOTE: indexes: if white moved from e2(52) to e4(36): toIdx=36, capture square = 36+8=44 (e3)
                this.enPassantTargetIndex = toIdx + 8;
                this.capturablePawnIndex = toIdx;
                this._log(`registerDoubleStep: peão branco double-step ${this.indexToAlgebraic(fromIdx)}→${this.indexToAlgebraic(toIdx)}. target=${this.indexToAlgebraic(this.enPassantTargetIndex)}, capturable=${this.indexToAlgebraic(this.capturablePawnIndex)}`);
                return;
            }

            // Black double-step: delta = +16 (ex: 12 -> 28)
            if (piece.tipo === '♟' && delta === 16) {
                this.enPassantTargetIndex = toIdx - 8;
                this.capturablePawnIndex = toIdx;
                this._log(`registerDoubleStep: peão preto double-step ${this.indexToAlgebraic(fromIdx)}→${this.indexToAlgebraic(toIdx)}. target=${this.indexToAlgebraic(this.enPassantTargetIndex)}, capturable=${this.indexToAlgebraic(this.capturablePawnIndex)}`);
                return;
            }

            // Qualquer outro movimento limpa a possibilidade de en passant
            this.enPassantTargetIndex = null;
            this.capturablePawnIndex = null;
            this._log('registerDoubleStep: movimento não é double-step, limpando estado.');
        } catch (e) {
            console.error('[EnPassant] registerDoubleStep erro (ignorado):', e);
            this.enPassantTargetIndex = null;
            this.capturablePawnIndex = null;
        }
    }

    // Retorna array de índices que representam movimentos en passant válidos para o peão em posIdx (0..63)
    // Não altera estado.
    getEnPassantTargetsForPawn(posIdx) {
        const out = [];
        try {
            if (!this.board || !Number.isInteger(posIdx)) return out;
            const piece = this.board[posIdx];
            if (!piece) return out;
            if (piece.tipo !== '♙' && piece.tipo !== '♟') return out;
            if (this.enPassantTargetIndex === null) return out;

            const fileFrom = posIdx % 8;
            const fileTarget = this.enPassantTargetIndex % 8;

            // deve estar exatamente a um arquivo de distância
            if (Math.abs(fileFrom - fileTarget) !== 1) {
                this._log(`getEnPassantTargetsForPawn(${this.indexToAlgebraic(posIdx)}): target ${this.indexToAlgebraic(this.enPassantTargetIndex)} não está a 1 arquivo.`);
                return out;
            }

            const rowFrom = Math.floor(posIdx / 8);
            const rowTarget = Math.floor(this.enPassantTargetIndex / 8);
            const rankDiff = rowTarget - rowFrom;

            if (piece.tipo === '♙' && rankDiff === -1) {
                // White captures upwards (to lower index rows)
                // Assegura que a casa de destino esteja vazia (condição de en passant)
                if (!this.board[this.enPassantTargetIndex]) {
                    out.push(this.enPassantTargetIndex);
                    this._log(`getEnPassantTargetsForPawn(${this.indexToAlgebraic(posIdx)}): adicionando ${this.indexToAlgebraic(this.enPassantTargetIndex)}`);
                } else {
                    this._log(`getEnPassantTargetsForPawn(${this.indexToAlgebraic(posIdx)}): destino ${this.indexToAlgebraic(this.enPassantTargetIndex)} não está vazio.`);
                }
            }
            if (piece.tipo === '♟' && rankDiff === 1) {
                if (!this.board[this.enPassantTargetIndex]) {
                    out.push(this.enPassantTargetIndex);
                    this._log(`getEnPassantTargetsForPawn(${this.indexToAlgebraic(posIdx)}): adicionando ${this.indexToAlgebraic(this.enPassantTargetIndex)}`);
                } else {
                    this._log(`getEnPassantTargetsForPawn(${this.indexToAlgebraic(posIdx)}): destino ${this.indexToAlgebraic(this.enPassantTargetIndex)} não está vazio.`);
                }
            }

            return out;
        } catch (e) {
            console.error('[EnPassant] getEnPassantTargetsForPawn erro (ignorado):', e);
            return [];
        }
    }

    // Verifica se movimento específico é en passant (não altera estado)
    isEnPassantMove(fromIdx, toIdx, piece) {
        try {
            if (!this.board || !piece || this.enPassantTargetIndex === null) return false;
            if (toIdx !== this.enPassantTargetIndex) return false;
            if (piece.tipo !== '♙' && piece.tipo !== '♟') return false;

            const fc = Math.abs((fromIdx % 8) - (toIdx % 8));
            const rowDiff = Math.floor(toIdx / 8) - Math.floor(fromIdx / 8);

            if (fc !== 1) {
                this._log(`isEnPassantMove: diferença de arquivo inválida (from ${this.indexToAlgebraic(fromIdx)} to ${this.indexToAlgebraic(toIdx)})`);
                return false;
            }
            if (piece.tipo === '♙' && rowDiff !== -1) {
                this._log(`isEnPassantMove: peão branco movimento de rank inválido (${rowDiff})`);
                return false;
            }
            if (piece.tipo === '♟' && rowDiff !== 1) {
                this._log(`isEnPassantMove: peão preto movimento de rank inválido (${rowDiff})`);
                return false;
            }

            if (this.capturablePawnIndex === null) {
                this._log('isEnPassantMove: capturablePawnIndex é null');
                return false;
            }

            // O peão capturável precisa estar adjacente por arquivo e na file esperada
            const captFile = this.capturablePawnIndex % 8;
            if (Math.abs(captFile - (fromIdx % 8)) !== 1) {
                this._log('isEnPassantMove: peão capturável não está em arquivo adjacente');
                return false;
            }

            // Assegura que o peão capturável esteja ainda no tabuleiro naquela casa
            const captPiece = this.board[this.capturablePawnIndex];
            if (!captPiece) {
                this._log(`isEnPassantMove: não há peça capturável em ${this.indexToAlgebraic(this.capturablePawnIndex)}`);
                return false;
            }

            // Assegura que a peça capturável seja um peão inimigo
            if ((captPiece.tipo !== '♙' && captPiece.tipo !== '♟') || captPiece.cor === piece.cor) {
                this._log('isEnPassantMove: peça capturável inválida (não é peão inimigo)');
                return false;
            }

            this._log(`isEnPassantMove: movimento ${this.indexToAlgebraic(fromIdx)}→${this.indexToAlgebraic(toIdx)} é EN PASSANT (capturável em ${this.indexToAlgebraic(this.capturablePawnIndex)})`);
            return true;
        } catch (e) {
            console.error('[EnPassant] isEnPassantMove erro (ignorado):', e);
            return false;
        }
    }

    // Aplica captura en passant se todas as condições estiverem ok.
    // boardObj (opcional) pode ser o objeto Board (que tem movePiece) ou null;
    // Retorna true se capturou (aplicou en passant), false caso contrário.
    applyEnPassantIfPossible(fromIdx, toIdx, piece, boardObj = null) {
        try {
            if (!this.board || !Number.isInteger(fromIdx) || !Number.isInteger(toIdx) || !piece) return false;

            if (!this.isEnPassantMove(fromIdx, toIdx, piece)) {
                // não é en passant (ou condições não satisfeitas)
                return false;
            }

            // calcula posição do peão que será removido:
            // se quem captura for branco, o peão capturado está uma rank abaixo do destino (toIdx + 8)
            // se quem captura for preto, está uma rank acima (toIdx - 8)
            let capturedPawnIdx = (piece.tipo === '♙') ? (toIdx + 8) : (toIdx - 8);

            // segurança: índices válidos
            if (!Number.isInteger(capturedPawnIdx) || capturedPawnIdx < 0 || capturedPawnIdx > 63) {
                this._log('applyEnPassantIfPossible: capturedPawnIdx inválido', capturedPawnIdx);
                return false;
            }

            const captured = this.board[capturedPawnIdx];
            if (!captured) {
                this._log(`applyEnPassantIfPossible: não há peça para capturar em ${this.indexToAlgebraic(capturedPawnIdx)}`);
                return false;
            }

            // verifica tipo e cor da peça capturada
            if ((captured.tipo !== '♙' && captured.tipo !== '♟') || captured.cor === piece.cor) {
                this._log('applyEnPassantIfPossible: peça capturada não é peão inimigo');
                return false;
            }

            // Agora aplicamos a captura de forma atômica.
            // Preferimos boardObj.movePiece se disponível para manter consistência.
            if (boardObj && typeof boardObj.movePiece === 'function') {
                try {
                    this._log(`applyEnPassantIfPossible: executando en passant ${this.indexToAlgebraic(fromIdx)}→${this.indexToAlgebraic(toIdx)} removendo ${this.indexToAlgebraic(capturedPawnIdx)}`);
                    // backup (não obrigatório, só por segurança)
                    const backupFrom = this.board[fromIdx];
                    const backupTo = this.board[toIdx];
                    const backupCaptured = this.board[capturedPawnIdx];

                    // mover peão atacante
                    boardObj.movePiece(fromIdx, toIdx);

                    // remover o peão capturado
                    this.board[capturedPawnIdx] = null;

                    // marca hasMoved se existir
                    if (this.board[toIdx]) this.board[toIdx].hasMoved = true;

                    // limpa estado en passant (válida apenas por um movimento)
                    this.enPassantTargetIndex = null;
                    this.capturablePawnIndex = null;

                    this._log('applyEnPassantIfPossible: captura aplicada com boardObj.');
                    return true;
                } catch (e) {
                    console.error('[EnPassant] applyEnPassantIfPossible erro usando boardObj (ignorado):', e);
                    return false;
                }
            } else {
                // manipulação direta do array
                try {
                    this._log(`applyEnPassantIfPossible: aplicando en passant diretamente no array ${this.indexToAlgebraic(fromIdx)}→${this.indexToAlgebraic(toIdx)} removendo ${this.indexToAlgebraic(capturedPawnIdx)}`);

                    // backups por segurança
                    const backupFrom = this.board[fromIdx];
                    const backupTo = this.board[toIdx];
                    const backupCaptured = this.board[capturedPawnIdx];

                    // mover atacante para destino
                    this.board[toIdx] = this.board[fromIdx];
                    this.board[fromIdx] = null;
                    // remover capturado
                    this.board[capturedPawnIdx] = null;

                    if (this.board[toIdx]) this.board[toIdx].hasMoved = true;

                    this.enPassantTargetIndex = null;
                    this.capturablePawnIndex = null;

                    this._log('applyEnPassantIfPossible: captura aplicada diretamente.');
                    return true;
                } catch (e) {
                    console.error('[EnPassant] applyEnPassantIfPossible erro (ignorado):', e);
                    return false;
                }
            }
        } catch (e) {
            console.error('[EnPassant] applyEnPassantIfPossible erro (ignorado):', e);
            return false;
        }
    }

    // Limpa o estado (chamar no fim do turno se desejar)
    clear() {
        this.enPassantTargetIndex = null;
        this.capturablePawnIndex = null;
        this._log('clear: estado en passant limpo.');
    }

    // Utilitário de debug: retorna estado interno legível
    debugState() {
        return {
            enPassantTarget: this.enPassantTargetIndex === null ? null : this.indexToAlgebraic(this.enPassantTargetIndex),
            capturablePawn: this.capturablePawnIndex === null ? null : this.indexToAlgebraic(this.capturablePawnIndex),
            rawEnPassantIndex: this.enPassantTargetIndex,
            rawCapturableIndex: this.capturablePawnIndex,
            lastLog: this._lastLog
        };
    }
}
