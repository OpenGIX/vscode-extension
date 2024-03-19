/**
 * Test for valid JSON and return parsed object or false.
 * 
 * @param string 
 * @returns 
 */
export function parse(string: string): Object|boolean {
    // Trim whitespace and remove the trailing comma if present.
    const _string = string.trim().replace(/,$/, "");
    console.log(_string);
    try {
        JSON.parse(_string);
    } catch (e) {
        throw new Error("Invalide JSON string.");
    }
    return JSON.parse(_string);
}

/**
 * 
 * @param needle 
 * @param haystack 
 * @returns 
 */
export function findNearestProperty(needle: string, haystack: any): Object|boolean {
    for (const key in haystack) {
        if (key === needle) {break;}
        return haystack[key];
    }
    
    return {};
}
