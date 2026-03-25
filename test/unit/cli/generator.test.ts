import fs from 'fs';
import path from 'path';
import { expect } from 'chai';
import { generateModels } from '../../../src/cli/generator.js';
import { RallyClient } from '../../../src/core/rally-client.js';

describe('generateModels', () => {
    const originalQueryAll = RallyClient.prototype.queryAll;
    const originalQueryCollectionAll = RallyClient.prototype.queryCollectionAll;
    const originalCwd = process.cwd();
    const createdDirs = new Set<string>();

    afterEach(() => {
        RallyClient.prototype.queryAll = originalQueryAll;
        RallyClient.prototype.queryCollectionAll = originalQueryCollectionAll;
        process.chdir(originalCwd);

        for (const dirPath of createdDirs) {
            fs.rmSync(dirPath, { recursive: true, force: true });
        }

        createdDirs.clear();
    });

    function mockGeneratorResponses(): void {
        RallyClient.prototype.queryAll = (async () => [
            {
                ElementName: 'CustomThing',
                Name: 'Custom Thing',
                TypePath: 'customthing',
                Abstract: false,
                Attributes: { _ref: '/typedef/customthing/attributes' }
            }
        ]) as typeof RallyClient.prototype.queryAll;

        RallyClient.prototype.queryCollectionAll = (async (ref: string) => {
            if (ref === '/typedef/customthing/attributes') {
                return [
                    {
                        ElementName: 'Name',
                        AttributeType: 'STRING',
                        Required: true,
                        Hidden: false,
                        Custom: false,
                        MaxLength: 256,
                        ReadOnly: false,
                        Constrained: false,
                        Filterable: true,
                        Sortable: true
                    },
                    {
                        ElementName: 'Owner',
                        AttributeType: 'OBJECT',
                        ReadOnly: false,
                        AllowedValueType: { _refObjectName: 'User' }
                    }
                ];
            }

            return [];
        }) as typeof RallyClient.prototype.queryCollectionAll;
    }

    function mockTestCaseGeneratorResponses(): void {
        RallyClient.prototype.queryAll = (async () => [
            {
                ElementName: 'TestCase',
                Name: 'Test Case',
                TypePath: 'testcase',
                Abstract: false,
                Attributes: { _ref: '/typedef/testcase/attributes' }
            }
        ]) as typeof RallyClient.prototype.queryAll;

        RallyClient.prototype.queryCollectionAll = (async (ref: string) => {
            if (ref === '/typedef/testcase/attributes') {
                return [
                    {
                        ElementName: 'Name',
                        AttributeType: 'STRING',
                        Required: true,
                        Hidden: false,
                        Custom: false,
                        MaxLength: 256,
                        ReadOnly: false,
                        Constrained: false,
                        Filterable: true,
                        Sortable: true
                    },
                    {
                        ElementName: 'c_CustomField',
                        AttributeType: 'STRING',
                        Required: false,
                        Hidden: false,
                        Custom: true,
                        MaxLength: 256,
                        ReadOnly: false,
                        Constrained: false,
                        Filterable: true,
                        Sortable: true
                    }
                ];
            }

            return [];
        }) as typeof RallyClient.prototype.queryCollectionAll;
    }

    it('should generate TypeScript source wired to local base entity when output is inside src', async () => {
        mockGeneratorResponses();

        const outputDir = path.join(process.cwd(), 'src', 'rally-models-generator-test');
        createdDirs.add(outputDir);

        await generateModels({
            apiKey: 'test-key',
            workspaceId: '12345',
            outputDir
        });

        const modelFile = path.join(outputDir, 'custom-thing.ts');
        const indexFile = path.join(outputDir, 'index.ts');

        expect(fs.existsSync(modelFile)).to.equal(true);
        expect(fs.existsSync(indexFile)).to.equal(true);

        const modelContent = fs.readFileSync(modelFile, 'utf-8');
        const indexContent = fs.readFileSync(indexFile, 'utf-8');

        expect(modelContent).to.contain("import { RallyEntity } from '../models/base-entity.js';");
        expect(indexContent).to.contain("import { RallyEntity } from '../models/base-entity.js';");
        expect(indexContent).to.contain('export const GENERATED_MODELS: (typeof RallyEntity)[] = [');
        expect(indexContent).to.contain("import { CustomThing } from './custom-thing.js';");
    });

    it('should honor an explicit base import override', async () => {
        mockGeneratorResponses();

        const outputDir = path.join(process.cwd(), 'tmp', 'generator-external-test');
        createdDirs.add(outputDir);

        await generateModels({
            apiKey: 'test-key',
            workspaceId: '12345',
            outputDir,
            baseImport: 'rallyorm'
        });

        const modelContent = fs.readFileSync(path.join(outputDir, 'custom-thing.ts'), 'utf-8');
        const indexContent = fs.readFileSync(path.join(outputDir, 'index.ts'), 'utf-8');

        expect(modelContent).to.contain("import { RallyEntity } from 'rallyorm';");
        expect(indexContent).to.contain("import { RallyEntity } from 'rallyorm';");
    });

    it('should always emit .js relative imports by default', async () => {
        mockGeneratorResponses();

        const workspaceDir = path.join(process.cwd(), 'tmp', 'generator-esm-default-test');
        const outputDir = path.join(workspaceDir, 'generated');
        createdDirs.add(workspaceDir);
        fs.mkdirSync(workspaceDir, { recursive: true });
        fs.writeFileSync(path.join(workspaceDir, 'package.json'), JSON.stringify({ name: 'consumer-app' }, null, 2));
        process.chdir(workspaceDir);

        await generateModels({
            apiKey: 'test-key',
            workspaceId: '12345',
            outputDir
        });

        const indexContent = fs.readFileSync(path.join(outputDir, 'index.ts'), 'utf-8');

        expect(indexContent).to.contain("import { CustomThing } from './custom-thing.js';");
    });

    it('should emit generated model declarations and a typed generated datasource', async () => {
        mockTestCaseGeneratorResponses();

        const outputDir = path.join(process.cwd(), 'tmp', 'generator-typed-datasource-test');
        createdDirs.add(outputDir);

        await generateModels({
            apiKey: 'test-key',
            workspaceId: '12345',
            outputDir,
            baseImport: 'rallyorm'
        });

        const modelContent = fs.readFileSync(path.join(outputDir, 'test-case.ts'), 'utf-8');
        const indexContent = fs.readFileSync(path.join(outputDir, 'index.ts'), 'utf-8');
        const dataSourceContent = fs.readFileSync(path.join(outputDir, 'generated-data-source.ts'), 'utf-8');

        expect(modelContent).to.contain('declare Name?: string;');
        expect(modelContent).to.contain('declare c_CustomField?: string;');
        expect(indexContent).to.contain("import { GeneratedRallyDataSource } from './generated-data-source.js';");
        expect(indexContent).to.contain('GeneratedRallyDataSource');
        expect(dataSourceContent).to.contain('export class GeneratedRallyDataSource extends RallyDataSource');
        expect(dataSourceContent).to.contain('get testCases(): RallyRepository<TestCase>');
        expect(dataSourceContent).to.contain('getTestCaseRepository(): RallyRepository<TestCase>');
    });
});