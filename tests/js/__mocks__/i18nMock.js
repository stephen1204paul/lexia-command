// Mock for @wordpress/i18n
export const __ = (text, domain) => text;
export const _x = (text, context, domain) => text;
export const _n = (single, plural, number, domain) => number === 1 ? single : plural;
export const _nx = (single, plural, number, context, domain) => number === 1 ? single : plural;
export const isRTL = () => false;
export const sprintf = (format, ...args) => {
    let i = 0;
    return format.replace(/%[sdj%]/g, (x) => {
        if (x === '%%') return x;
        if (i >= args.length) return x;
        switch (x) {
            case '%s': return String(args[i++]);
            case '%d': return Number(args[i++]);
            case '%j':
                try {
                    return JSON.stringify(args[i++]);
                } catch (_) {
                    return '[Circular]';
                }
            default:
                return x;
        }
    });
};