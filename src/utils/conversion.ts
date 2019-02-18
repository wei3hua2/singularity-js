/**
 * @module Utils
 */

function agiToCogs(agi: any): number {
    return agi * 100000000;
}
function cogsToAgi(cogs: any): number {
    return cogs / 100000000;
}

export {agiToCogs, cogsToAgi}