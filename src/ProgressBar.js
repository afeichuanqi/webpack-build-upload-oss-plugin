const slog = require('single-line-log').stdout;

class ProgressBar {
    description =  '';
    length = 0;
    constructor(description, bar_length) {
        this.description = description || 'Progress';
        this.length = bar_length || 25;
    }
    render (opts){
        const percent = (opts.completed / opts.total).toFixed(4);
        const cell_num = Math.floor(Number(percent) * this.length);

        let cell = '';
        for (let i=0;i<cell_num;i++) {
            cell += '█';
        }

        let empty = '';
        for (let i=0;i<this.length-cell_num;i++) {
            empty += '░';
        }

        const cmdText = this.description + ': ' + (100*Number(percent)).toFixed(2) + '% ' + cell + empty + ' ' + opts.completed + '/' + opts.total + '\n' + opts.info;

        slog(cmdText);
    };
}
module.exports = ProgressBar