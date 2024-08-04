import { readFile, writeFile } from 'fs';

export function filePromise(filePath: string): Promise<Buffer> {
    return new Promise((resolve, reject) =>
        readFile(filePath, (err, data) => {
            if (err) {
                console.error('Error reading report template', err);
                return reject(err);
            }
            resolve(data);
        })
    );
}

export function writeFilePromise(
    filePath: string,
    data: string
): Promise<void> {
    return new Promise((resolve, reject) =>
        writeFile(filePath, data, (err: unknown) => {
            if (err) {
                console.error('Error reading report template', err);
                return reject(err);
            }
            resolve();
        })
    );
}
