import { PAGE_SIZE, PAGES_PER_PARTITION } from '../constants';
import trie, { TrieNode } from '../src/data/trie';
import { PrefixIndex } from '../src/processing/prefix-tree';
import { ProcessedFeature } from '../src/processing/types';

type ActiveFeatures = {
    features: ProcessedFeature[];
    availablePages: number;
};

let cache: {
    features: ProcessedFeature[][];
    availablePages: number;
} | null = null;

let prefixTree: TrieNode<PrefixIndex> | null = null;
let prefixTreeFailed: TrieNode<PrefixIndex> | null = null;

const lastCall = {
    partitionIndex: -1,
    failedOnly: false,
    searchFilter: '',
};

fetch('prefix-tree-data.json')
    .then((res) => res.json())
    .then((data) => {
        prefixTree = data;
    });

fetch('prefix-tree-failed.json')
    .then((res) => res.json())
    .then((data) => {
        prefixTreeFailed = data;
    });

export const features = async (
    page: number,
    failedOnly: boolean,
    searchFilter?: string
): Promise<ActiveFeatures> => {
    const partition = Math.floor(page / PAGES_PER_PARTITION);
    const offset = page % PAGES_PER_PARTITION;

    if (
        cache !== null &&
        lastCall.partitionIndex === partition &&
        lastCall.failedOnly === failedOnly &&
        !searchFilter
    ) {
        return Promise.resolve({
            features: cache.features[offset],
            availablePages: cache.availablePages,
        });
    }

    const providers = failedOnly
        ? window.failed.providers
        : window.data.providers;

    const availablePages = failedOnly ? window.failed.pages : window.data.pages;

    if (searchFilter) {
        const pTree = failedOnly ? prefixTreeFailed : prefixTree;
        if (pTree === null) {
            return Promise.resolve({ features: [], availablePages: 0 });
        }
        return featuresByPrefix(searchFilter, pTree, providers, page);
    }

    return providers[partition]().then((pages) => {
        cache = { features: pages, availablePages };
        return { features: pages[offset], availablePages };
    });
};

export const featuresByPrefix = async (
    prefix: string,
    pTree: TrieNode<PrefixIndex>,
    providers: (() => Promise<ProcessedFeature[][]>)[],
    page: number
): Promise<ActiveFeatures> => {
    const node = trie.search(pTree, prefix);
    if (node === null) {
        return Promise.resolve({ features: [], availablePages: 0 });
    }

    const { partition, page: pageOffset, start, size } = node;
    // Actual page offset value = page offset defined for trie node + requested page
    const actualPageOffset = Math.floor(
        (pageOffset + page) % PAGES_PER_PARTITION
    );
    // Actual partition offset value = partition offset defined for trie node + requested page / pages per partition
    const actualPartition =
        partition + Math.floor((pageOffset + page) / PAGES_PER_PARTITION);
    // Number of pages to be shown in the pagination buttons
    const availablePages = Math.ceil(size / PAGE_SIZE);

    let requiredProviders;
    if (actualPageOffset + 1 < PAGES_PER_PARTITION) {
        requiredProviders = [providers[actualPartition]];
    } else {
        requiredProviders = [
            providers[actualPartition],
            providers[actualPartition + 1],
        ];
    }
    return Promise.all(requiredProviders.map((p) => p())).then((partitions) => {
        const pages = partitions.flat();
        cache = {
            features: pages,
            availablePages,
        };
        let features;
        const featuresRemaining = size - page * PAGE_SIZE;

        // If there's less than a page of features left, only show those
        if (featuresRemaining < PAGE_SIZE) {
            features = pages[actualPageOffset].slice(
                start,
                start + featuresRemaining
            );
        } else {
            features = pages[actualPageOffset]
                .slice(start, PAGE_SIZE)
                .concat(
                    pages[actualPageOffset + 1].slice(
                        0,
                        Math.min(start, size - PAGE_SIZE)
                    )
                );
        }
        return {
            features,
            availablePages,
        };
    });
};
