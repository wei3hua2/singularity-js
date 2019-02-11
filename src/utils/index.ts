function agiToCogs(agi): number {
    return agi * 100000000;
}
function cogsToAgi(cogs): number {
    return cogs / 100000000;
}

export {agiToCogs, cogsToAgi}