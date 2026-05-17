export const MusicCache = {};

export const SM = {
    save(s) {
        const a = this.all();
        a.push(s);
        localStorage.setItem('bg_songs', JSON.stringify(a));
    },
    all() {
        try { return JSON.parse(localStorage.getItem('bg_songs') || '[]'); }
        catch (e) { return []; }
    },
    del(id) {
        const a = this.all().filter(s => s.id !== id);
        localStorage.setItem('bg_songs', JSON.stringify(a));
    },
    updateBest(id, finalScore) {
        const a = this.all();
        const s = a.find(x => x.id === id);
        if (s) {
            s.bestScore = Math.max(s.bestScore || 0, finalScore);
            localStorage.setItem('bg_songs', JSON.stringify(a));
        }
    }
};
