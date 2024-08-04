import { PAGES_PER_PARTITION } from '../constants';
import { features } from './features';
import { genFeatureHtml } from './templating';
import { genPaginationElements } from './pagination';

const contentElem = document.getElementById('content');

if (contentElem === null) {
    throw new Error('Content container not found');
}

const paginationElem = document.getElementById('pagination');

if (paginationElem === null) {
    throw new Error('Pagination container not found');
}

const engineInternal = {
    pages: 0,
    allScenarios: [] as Element[],
    initialized: false,
    searchFilter: '',
    failedFeaturesOnly: false,
    failedScenariosOnly: (enabled: boolean) => {
        for (const scenario of engineInternal.allScenarios) {
            if (!(scenario instanceof HTMLElement)) {
                continue;
            }
            if (!enabled || scenario.getAttribute('data-status') === 'failed') {
                scenario.style.display = 'grid';
            } else {
                scenario.style.display = 'none';
            }
        }
    },
    togglePage: async (page: number) => {
        const fs = await features(
            page,
            engineInternal.failedFeaturesOnly,
            engineInternal.searchFilter
        );
        contentElem.innerHTML = genFeatureHtml(fs.features);
        engineInternal.allScenarios.splice(
            0,
            engineInternal.allScenarios.length
        );
        engineInternal.allScenarios.push(
            ...document.getElementsByClassName('scenario')
        );
        engineInternal.pages = fs.availablePages;
    },
    /**
     * Updates the pagination based on the current filters.
     */
    updatePagination: () => {
        // Remove existing pagination buttons
        paginationElem.innerHTML = '';
        genPaginationElements(engineInternal.pages, paginationElem, (page) =>
            engine.togglePage(page)
        );
    },
    reset: async () => {
        await engineInternal.togglePage(0);
        engineInternal.updatePagination();
    },
};

export const initEngine = (failedOnly: boolean) => {
    if (engineInternal.initialized) {
        return;
    }
    engineInternal.failedFeaturesOnly = failedOnly;
    engineInternal.reset();
    engineInternal.initialized = true;
};

const engine = {
    setSearchFilter: async (filter: string) => {
        engineInternal.searchFilter = filter;
        engineInternal.reset();
    },
    setFailedScenariosOnly: (enabled: boolean) => {
        engineInternal.failedScenariosOnly(enabled);
    },
    setFailedFeaturesOnly: async (enabled: boolean) => {
        engineInternal.failedFeaturesOnly = enabled;
        engineInternal.reset();
    },
    setFailedOnly: (enabled: boolean) => {
        engine.setFailedFeaturesOnly(enabled);
        engine.setFailedScenariosOnly(enabled);
    },
    togglePage: async (page: number) => {
        engineInternal.togglePage(page);
    },
};

export default engine;
