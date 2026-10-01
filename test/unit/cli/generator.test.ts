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
        expect(modelContent).to.contain('declare c_CustomField?: string | null;');
        expect(indexContent).to.contain("import { GeneratedRallyDataSource } from './generated-data-source.js';");
        expect(indexContent).to.contain('GeneratedRallyDataSource');
        expect(dataSourceContent).to.contain('export class GeneratedRallyDataSource extends RallyDataSource');
        expect(dataSourceContent).to.contain('get testCases(): RallyRepository<TestCase>');
        expect(dataSourceContent).to.contain('getTestCaseRepository(): RallyRepository<TestCase>');
    });

    describe('property types', () => {
        const attribute = (ElementName: string, AttributeType: string, extra: Record<string, unknown> = {}) => ({
            ElementName, AttributeType, Required: false, Hidden: false, Custom: false, MaxLength: 0,
            ReadOnly: false, Constrained: false, Filterable: true, Sortable: true, ...extra
        });

        function mockTypedAttributes(): void {
            RallyClient.prototype.queryAll = (async () => [{
                ElementName: 'Story', Name: 'Story', TypePath: 'story', Abstract: false,
                Attributes: { _ref: '/typedef/story/attributes' }
            }]) as typeof RallyClient.prototype.queryAll;

            RallyClient.prototype.queryCollectionAll = (async (ref: string) => {
                if (ref === '/typedef/story/attributes') {
                    return [
                        attribute('Name', 'STRING', { Required: true, MaxLength: 256 }),
                        attribute('FormattedID', 'STRING', { Required: true, ReadOnly: true }),
                        attribute('CreationDate', 'DATE', { Required: true }),
                        attribute('BlockedReason', 'STRING'),
                        attribute('Description', 'TEXT'),
                        attribute('Blocked', 'BOOLEAN'),
                        attribute('Risk', 'RATING'),
                        attribute('PlanEstimate', 'QUANTITY'),
                        attribute('AcceptedDate', 'DATE'),
                        attribute('ScheduleState', 'STATE', {
                            Required: true, Constrained: true, AllowedValues: { _ref: '/allowed/schedule', Count: 2 }
                        }),
                        attribute('Severity', 'STRING', {
                            Constrained: true, AllowedValues: { _ref: '/allowed/severity', Count: 3 }
                        }),
                        attribute('Priority', 'RATING', {
                            Constrained: true, AllowedValues: { _ref: '/allowed/priority', Count: 3 }
                        }),
                        attribute('Department', 'RATING', {
                            Constrained: true, AllowedValues: { _ref: '/allowed/department', Count: 1 }
                        }),
                        attribute('c_Team', 'STRING', { Custom: true }),
                        { ElementName: 'c_Reviewer', AttributeType: 'OBJECT', Custom: true, AllowedValueType: { _refObjectName: 'User' } }
                    ];
                }
                if (ref === '/allowed/schedule') {
                    return [{ StringValue: 'Defined' }, { StringValue: 'Accepted' }];
                }
                if (ref === '/allowed/severity') {
                    return [{ StringValue: '' }, { StringValue: 'Minor' }, { StringValue: 'Crash' }];
                }
                if (ref === '/allowed/priority') {
                    return [{ StringValue: '' }, { StringValue: 'Low' }, { StringValue: 'High' }];
                }
                if (ref === '/allowed/department') {
                    return [{ StringValue: '' }];
                }
                return [];
            }) as typeof RallyClient.prototype.queryCollectionAll;
        }

        async function generateStory(openEnums?: boolean, excludeCustomFields?: boolean): Promise<string> {
            mockTypedAttributes();
            const outputDir = path.join(process.cwd(), 'tmp', `generator-types-${openEnums ? 'open' : 'closed'}-${excludeCustomFields ? 'core' : 'all'}`);
            createdDirs.add(outputDir);
            await generateModels({ apiKey: 'test-key', workspaceId: '1', outputDir, baseImport: 'rallyorm', openEnums, excludeCustomFields });
            return fs.readFileSync(path.join(outputDir, 'story.ts'), 'utf-8');
        }

        it('should add null only to optional attributes Rally can return as null', async () => {
            const content = await generateStory();

            // Required attributes are always set.
            expect(content).to.contain('declare Name?: string;');
            expect(content).to.contain('declare FormattedID?: string;');
            expect(content).to.contain('declare CreationDate?: string | Date;');
            // Optional strings, numbers and dates come back null when unset.
            expect(content).to.contain('declare BlockedReason?: string | null;');
            expect(content).to.contain('declare PlanEstimate?: number | null;');
            expect(content).to.contain('declare AcceptedDate?: string | Date | null;');
            // Booleans come back false and TEXT as "".
            expect(content).to.contain('declare Blocked?: boolean;');
            expect(content).to.contain('declare Description?: string;');
            // Ratings usually report "None" but can be null too (seen live on FinancialWorkType).
            expect(content).to.contain('declare Risk?: string | null;');
        });

        it('should keep constrained fields closed to their allowed values by default', async () => {
            const content = await generateStory();

            expect(content).to.contain('declare ScheduleState?: "Defined" | "Accepted";');
            expect(content).to.contain('declare Severity?: "" | "Minor" | "Crash" | null;');
        });

        it('should keep the empty allowed value and accept "None" on ratings, as Rally reports them', async () => {
            const content = await generateStory();

            // Rally lists "" as the clear-the-field choice and reads an empty rating back as "None";
            // dropping them made validate() reject entities exactly as Rally returned them.
            expect(content).to.contain("Severity: { type: 'string', enum: ['', 'Minor', 'Crash'] }");
            expect(content).to.contain("Priority: { type: 'string', enum: ['', 'None', 'Low', 'High'] }");
            expect(content).to.contain('declare Priority?: "" | "None" | "Low" | "High" | null;');
        });

        it('should leave constrained fields open to other values with openEnums', async () => {
            const content = await generateStory(true);

            expect(content).to.contain('declare ScheduleState?: "Defined" | "Accepted" | (string & {});');
            expect(content).to.contain('declare Severity?: "" | "Minor" | "Crash" | (string & {}) | null;');
            // Runtime metadata is the same either way.
            expect(content).to.contain("enum: ['Defined', 'Accepted']");
        });

        it('should not constrain a dropdown whose only allowed value is the empty one', async () => {
            const content = await generateStory();

            // Unconfigured here; another workspace may fill it with its own values.
            expect(content).to.contain("Department: { type: 'string' },");
            expect(content).to.contain('declare Department?: string | null;');
        });

        it('should keep custom attributes by default and drop them with excludeCustomFields', async () => {
            const withCustom = await generateStory();
            expect(withCustom).to.contain('c_Team');
            expect(withCustom).to.contain('c_Reviewer');

            const shared = await generateStory(true, true);
            expect(shared).to.not.contain('c_Team');
            expect(shared).to.not.contain('c_Reviewer');
            expect(shared).to.contain('declare Name?: string;');
        });
    });
});