class UnknownTargetError extends Error {
    /**
     * @param {string} target 
     * @param {string} source
     */
    constructor(target, source) {
        super(`Uknown target ${target} from ${source}`);
        this.name = "UnkownTargetError";
    }
}

module.exports = {
    UnknownTargetError: UnknownTargetError
}