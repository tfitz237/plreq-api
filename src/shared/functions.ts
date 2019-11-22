export function JSONtryParse(str: string) {
    try {
        return JSON.parse(str);
    }
    catch {
        return str;
    }
}