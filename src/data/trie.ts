export type TrieNode<T> = {
    key: string;
    value?: T;
    children: Record<string, TrieNode<T>>;
};

export default {
    create<T>(value?: T): TrieNode<T> {
        return { key: '', value: value, children: {} };
    },

    applyAndInsert<T>(
        root: TrieNode<T>,
        key: string,
        value: T,
        defaultValue?: () => T,
        op?: (value: T) => void
    ): TrieNode<T> {
        let node = root;

        for (const char of key) {
            if (!node.children[char]) {
                node.children[char] = {
                    key: char,
                    value: defaultValue && defaultValue(),
                    children: {},
                };
            } else {
                if (op && node.children[char].value) {
                    op(node.children[char].value);
                }
            }
            node = node.children[char];
        }

        node.value = value;
        return root;
    },

    search<T>(root: TrieNode<T>, key: string): T | null {
        let node = root;
        for (const char of key) {
            if (!node.children[char]) {
                return null;
            }
            node = node.children[char];
        }
        return node.value || null;
    },
};
