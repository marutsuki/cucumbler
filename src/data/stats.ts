import { Feature } from '../processing/types';

export type TestSuiteStats = {
    featuresPassed: number;
    featuresFailed: number;
    scenariosPassed: number;
    scenariosFailed: number;
    features: Readonly<Record<string, FeatureStats>>;
};

export function getTestSuiteStats(featureList: Feature[]): TestSuiteStats {
    let featuresPassed = 0;
    let featuresFailed = 0;
    let scenariosPassed = 0;
    let scenariosFailed = 0;
    const features = Object.fromEntries(
        featureList.map((feature) => {
            const featureStats = getFeatureStats(feature);
            if (featureStats.failed > 0) {
                featuresPassed++;
            } else {
                featuresFailed++;
            }
            scenariosPassed += featureStats.passed;
            scenariosFailed += featureStats.failed;
            return [feature.id, featureStats];
        })
    );
    return {
        featuresPassed,
        featuresFailed,
        scenariosPassed,
        scenariosFailed,
        features,
    };
}

export type FeatureStats = {
    passed: number;
    failed: number;
    skipped: number;
};

export function featureFailed(feature: Feature) {
    return feature.elements.some((f) =>
        f.steps.some((s) => s.result?.status === 'failed')
    );
}
function getFeatureStats(feature: Feature): FeatureStats {
    let passed = 0;
    let failed = 0;
    let skipped = 0;
    feature.elements.forEach((scenario) => {
        scenario.steps.forEach((step) => {
            if (step.result === undefined) {
                return;
            }
            switch (step.result.status) {
                case 'passed':
                    passed++;
                    break;
                case 'failed':
                    failed++;
                    break;
                case 'skipped':
                    skipped++;
                    break;
            }
        });
    });
    return {
        passed,
        failed,
        skipped,
    };
}
