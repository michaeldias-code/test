// MoveValidator.js (corrigido e pronto para colar)
// Mantém API: rawMoves(pos), getPossibleMoves(pos), finalizeMove(from,to), validateMoveObject(move)

export class MoveValidator {
    constructor(boardArray) {
        this.board = boardArray;
        this.enPassantTarget = null; // índice (0..63) ou null
        this.lastMove = null;
        console.log("MoveValidator carregado!");
    }

    // --------------------
    isValidPosition(pos) { return Number.isInteger(pos) && pos >= 0 && pos < 64; }
    row(pos) { return Math.floor(pos / 8); }
    col(pos) { return pos % 8; }
    sameRow(a, b) { return this.row(a) === this.row(b); }
    sameCol(a, b) { return this.col(a) === this.col(b); }

    algebraicToIndex(sq) {
        if (!sq || sq.length !== 2) return null;
        const file = sq.charCodeAt(0) - 'a'.charCodeAt(0);
        const rank = parseInt(sq[1], 10) - 1;
        if (file < 0 || file > 7 || rank < 0 || rank > 7) return null;
        return (7 - rank) * 8 + file;
    }

    indexToAlgebraic(idx) {
        if (!this.isValidPosition(idx)) return null;
        const r = this.row(idx);
        const c = this.col(idx);
        const rank = 8 - r;
        const file = String.fromCharCode('a'.charCodeAt(0) + c);
        return `${file}${rank}`;
    }

    slidingStepOk(start, next, offset) {
        const sr = this.row(start);
        const sc = this.col(start);
        const nr = this.row(next);
        const nc = this.col(next);
        switch (offset) {
            case -1: return nr === sr && nc === sc - 1;
            case 1:  return nr === sr && nc === sc + 1;
            case -8: return nc === sc && nr === sr - 1;
            case 8:  return nc === sc && nr === sr + 1;
            case -9: return (nr === sr - 1) && (nc === sc - 1);
            case -7: return (nr === sr - 1) && (nc === sc + 1);
            case 7:  return (nr === sr + 1) && (nc === sc - 1);
            case 9:  return (nr === sr + 1) && (nc === sc + 1);
            default: return false;
        }
    }

    getSlidingMoves(pos, directions) {
        const moves = [];
        const piece = this.board[pos];
        if (!piece) return moves;
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

    // En passant
    updateEnPassant(from, to, piece) {
        this.enPassantTarget = null;
        if (!piece || piece.tipo !== 'peao') return;
        const delta = to - from;
        if (piece.cor === 'brancas' && delta === -16) {
            this.enPassantTarget = to + 8;
        } else if (piece.cor === 'pretas' && delta === 16) {
            this.enPassantTarget = to - 8;
        }
    }

    isEnPassantCapture(from, to, piece) {
        if (!piece || piece.tipo !== 'peao') return false;
        if (this.enPassantTarget === null) return false;
        const fr = this.row(from);
        const fc = this.col(from);
        const tr = this.row(to);
        const tc = this.col(to);
        const rankDiff = tr - fr;
        const fileDiff = Math.abs(tc - fc);
        if (fileDiff !== 1) return false;
        if (piece.cor === 'brancas' && rankDiff === -1 && to === this.enPassantTarget) return true;
        if (piece.cor === 'pretas' && rankDiff === 1 && to === this.enPassantTarget) return true;
        return false;
    }

    executeMoveOnBoard(from, to) {
        const piece = this.board[from];
        const captured = this.board[to];
        if (piece && piece.tipo === 'peao' && !captured && this.isEnPassantCapture(from, to, piece)) {
            const capturedIndex = piece.cor === 'brancas' ? to + 8 : to - 8;
            this.board[capturedIndex] = null;
        }
        this.board[to] = this.board[from];
        this.board[from] = null;
    }

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
            case 'peao': {
                if (piece.cor === 'brancas') {
                    const one = pos - 8;
                    if (this.isValidPosition(one) && !this.board[one]) moves.push(one);
                    const two = pos - 16;
                    if (r === 6 && this.isValidPosition(two) && !this.board[one] && !this.board[two]) moves.push(two);
                    const capL = pos - 9;
                    const capR = pos - 7;
                    if (c > 0 && this.isValidPosition(capL) && this.board[capL] && this.board[capL].cor === 'pretas') moves.push(capL);
                    if (c < 7 && this.isValidPosition(capR) && this.board[capR] && this.board[capR].cor === 'pretas') moves.push(capR);
                    if (c > 0 && this.isValidPosition(capL) && this.enPassantTarget === capL) moves.push(capL);
                    if (c < 7 && this.isValidPosition(capR) && this.enPassantTarget === capR) moves.push(capR);
                } else {
                    const one = pos + 8;
                    if (this.isValidPosition(one) && !this.board[one]) moves.push(one);
                    const two = pos + 16;
                    if (r === 1 && this.isValidPosition(two) && !this.board[one] && !this.board[two]) moves.push(two);
                    const capL = pos + 7;
                    const capR = pos + 9;
                    if (c > 0 && this.isValidPosition(capL) && this.board[capL] && this.board[capL].cor === 'brancas') moves.push(capL);
                    if (c < 7 && this.isValidPosition(capR) && this.board[capR] && this.board[capR].cor === 'brancas') moves.push(capR);
                    if (c > 0 && this.isValidPosition(capL) && this.enPassantTarget === capL) moves.push(capL);
                    if (c < 7 && this.isValidPosition(capR) && this.enPassantTarget === capR) moves.push(capR);
                }
                break;
            }
            case 'torre':
                moves.push(...this.getSlidingMoves(pos, [-1,1,-8,8]));
                break;
            case 'bispo':
                moves.push(...this.getSlidingMoves(pos, [-9,-7,7,9]));
                break;
            case 'rainha':
                moves.push(...this.getSlidingMoves(pos, [-1,1,-8,8,-9,-7,7,9]));
                break;
            case 'cavalo': {
                const offs = [-17,-15,-10,-6,6,10,15,17];
                for (let off of offs) {
                    const to = pos + off;
                    if (!this.isValidPosition(to)) continue;
                    if (Math.abs(this.row(to) - r) + Math.abs(this.col(to) - c) === 3) {
                        const tgt = this.board[to];
                        if (!tgt || tgt.cor !== piece.cor) moves.push(to);
                    }
                }
                break;
            }
            case 'rei': {
                const offs = [-9,-8,-7,-1,1,7,8,9];
                for (let off of offs) {
                    const to = pos + off;
                    if (!this.isValidPosition(to)) continue;
                    if (Math.abs(this.row(to) - r) <= 1 && Math.abs(this.col(to) - c) <= 1) {
                        const tgt = this.board[to];
                        if (!tgt || tgt.cor !== piece.cor) moves.push(to);
                    }
                }
                break;
            }
            default:
                break;
        }
        return moves;
    }

    isKingInCheck(color) {
        const kingPos = this.board.findIndex(p => p && p.tipo === 'rei' && p.cor === color);
        if (kingPos === -1) return false;
        const enemyColor = color === 'brancas' ? 'pretas' : 'brancas';
        for (let i = 0; i < 64; i++) {
            const p = this.board[i];
            if (!p || p.cor !== enemyColor) continue;
            if (p.tipo === 'peao') {
                if (p.cor === 'brancas') {
                    const capL = i - 9; const capR = i - 7;
                    if (capL === kingPos || capR === kingPos) return true;
                } else {
                    const capL = i + 7; const capR = i + 9;
                    if (capL === kingPos || capR === kingPos) return true;
                }
            } else {
                const moves = this.rawMoves(i);
                if (moves.includes(kingPos)) return true;
            }
        }
        return false;
    }

    wouldNotLeaveKingInCheck(from, to) {
        const piece = this.board[from];
        if (!piece) return false;
        const backupFrom = piece;
        const backupTo = this.board[to];
        const backupEnPassant = this.enPassantTarget;
        let capturedBackup;
        if (piece.tipo === 'peao' && this.isEnPassantCapture(from, to, piece) && !backupTo) {
            const capturedIndex = piece.cor === 'brancas' ? to + 8 : to - 8;
            capturedBackup = this.board[capturedIndex];
            this.board[capturedIndex] = null;
        }
        this.board[to] = this.board[from];
        this.board[from] = null;
        const safe = !this.isKingInCheck(piece.cor);
        this.board[from] = backupFrom;
        this.board[to] = backupTo;
        if (typeof capturedBackup !== 'undefined') {
            const capturedIndex = piece.cor === 'brancas' ? to + 8 : to - 8;
            this.board[capturedIndex] = capturedBackup;
        }
        this.enPassantTarget = backupEnPassant;
        return safe;
    }

    getPossibleMoves(pos) {
        const piece = this.board[pos];
        if (!piece) return [];
        let moves = this.rawMoves(pos);
        const res = [];
        if (piece.tipo === 'rei') {
            const color = piece.cor;
            const rowIndex = color === 'brancas' ? 7 : 0;
            const kingIndex = rowIndex * 8 + 4;
            if (pos === kingIndex && !piece.hasMoved && !this.isKingInCheck(color)) {
                const rookShort = this.board[rowIndex * 8 + 7];
                if (rookShort && rookShort.tipo === 'torre' && !rookShort.hasMoved) {
                    const via1 = rowIndex * 8 + 5;
                    const via2 = rowIndex * 8 + 6;
                    if (!this.board[via1] && !this.board[via2] && !this.isCellAttacked(via1, color) && !this.isCellAttacked(via2, color)) {
                        moves.push(via2);
                    }
                }
                const rookLong = this.board[rowIndex * 8 + 0];
                if (rookLong && rookLong.tipo === 'torre' && !rookLong.hasMoved) {
                    const via1 = rowIndex * 8 + 3;
                    const via2 = rowIndex * 8 + 2;
                    const via3 = rowIndex * 8 + 1;
                    if (!this.board[via1] && !this.board[via2] && !this.board[via3] && !this.isCellAttacked(via1, color) && !this.isCellAttacked(via2, color)) {
                        moves.push(via2);
                    }
                }
            }
        }
        for (let to of moves) {
            if (this.wouldNotLeaveKingInCheck(pos, to)) res.push(to);
        }
        return res;
    }

    finalizeMove(from, to) {
        const piece = this.board[from];
        if (!piece) return;
        this.lastMove = { from, to, piece: { ...piece } };
        this.executeMoveOnBoard(from, to);
        this.board[to].hasMoved = true;
        this.updateEnPassant(from, to, this.board[to]);
    }

    isCellAttacked(pos, color) {
        const enemyColor = color === 'brancas' ? 'pretas' : 'brancas';
        for (let i = 0; i < 64; i++) {
            const p = this.board[i];
            if (!p || p.cor !== enemyColor) continue;
            if (p.tipo === 'peao') {
                if (p.cor === 'brancas') {
                    const capL = i - 9; const capR = i - 7;
                    if (capL === pos || capR === pos) return true;
                } else {
                    const capL = i + 7; const capR = i + 9;
                    if (capL === pos || capR === pos) return true;
                }
            } else {
                const moves = this.rawMoves(i);
                if (moves.includes(pos)) return true;
            }
        }
        return false;
    }

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

    performCastling(color, side) {
        const row = color === 'brancas' ? 7 : 0;
        const kingIndex = row * 8 + 4;
        const rookIndex = side === 'short' ? row * 8 + 7 : row * 8 + 0;
        const king = this.board[kingIndex];
        const rook = this.board[rookIndex];
        if (!king || !rook) return false;
        if (king.tipo !== 'rei' || rook.tipo !== 'torre') return false;
        if (king.hasMoved || rook.hasMoved) return false;
        if (side === 'short') {
            this.board[row*8 + 6] = king;
            this.board[row*8 + 5] = rook;
            this.board[kingIndex] = null;
            this.board[rookIndex] = null;
            this.board[row*8 + 6].hasMoved = true;
            this.board[row*8 + 5].hasMoved = true;
            return true;
        } else {
            this.board[row*8 + 2] = king;
            this.board[row*8 + 3] = rook;
            this.board[kingIndex] = null;
            this.board[rookIndex] = null;
            this.board[row*8 + 2].hasMoved = true;
            this.board[row*8 + 3].hasMoved = true;
            return true;
        }
    }

    boardToString() {
        const lines = [];
        for (let r = 0; r < 8; r++) {
            const cols = [];
            for (let c = 0; c < 8; c++) {
                const idx = r*8 + c;
                const p = this.board[idx];
                if (!p) cols.push('.');
                else {
                    const ch = p.tipo === 'peao' ? 'p' : p.tipo[0];
                    cols.push((p.cor === 'brancas' ? ch.toUpperCase() : ch.toLowerCase()));
                }
            }
            lines.push(cols.join(' '));
        }
        return lines.join('\n');
    }

    validateMoveObject(move) {
        const { from, to } = move;
        if (!this.isValidPosition(from) || !this.isValidPosition(to)) return { valid: false, reason: 'pos invalid' };
        const piece = this.board[from];
        if (!piece) return { valid: false, reason: 'no piece at from' };
        const possible = this.getPossibleMoves(from);
        if (!possible.includes(to)) return { valid: false, reason: 'move not allowed' };
        return { valid: true };
    }
}
