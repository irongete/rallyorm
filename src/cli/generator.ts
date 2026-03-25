import fs from 'fs';
import path from 'path';
import { RallyClient } from '../core/rally-client.js';

export interface IGeneratorOptions {
    apiKey: string;
    workspaceId: string;
    outputDir: string;
    baseUrl?: string;
    baseImport?: string;
    /** If provided, only generate models whose ElementName is in this list. */
    include?: string[];
}

/** AttributeTypes that map to a scalar/string TS value (not relations). */
const STRING_LIKE_TYPES = new Set(['STRING', 'TEXT', 'STATE', 'RATING', 'RAW']);

/** AttributeTypes for which AllowedValues contain meaningful string enum literals. */
const ENUM_ELIGIBLE_TYPES = new Set(['STRING', 'STATE', 'RATING']);

const KNOWN_DATASOURCE_GETTERS = new Map<string, string>([
    ['hierarchicalrequirement', 'userStories'],
    ['defect', 'defects'],
    ['task', 'tasks'],
    ['portfolioitem/feature', 'features'],
    ['iteration', 'iterations'],
    ['release', 'releases'],
    ['milestone', 'milestones'],
    ['project', 'projects'],
    ['user', 'users'],
    ['tag', 'tags'],
    ['attachment', 'attachments'],
    ['testcase', 'testCases'],
    ['testset', 'testSets'],
    ['testcaseresult', 'testCaseResults'],
    ['testcasestep', 'testCaseSteps'],
    ['testfolder', 'testFolders'],
    ['portfolioitem/initiative', 'initiatives'],
    ['portfolioitem/strategictheme', 'themes'],
    ['workspace', 'workspaces']
]);

interface IGeneratedModelEntry {
    className: string;
    entityType: string;
    fileStem: string;
}

interface IFrameworkImports {
    entityImport: string;
    dataSourceImport: string;
    repositoryImport: string;
}

function mapAttributeType(attrType: string): string {
    if (attrType === 'INTEGER') return "'integer'";
    if (attrType === 'QUANTITY' || attrType === 'DECIMAL') return "'number'";
    if (attrType === 'BOOLEAN') return "'boolean'";
    if (attrType === 'DATE') return "'date'";
    return "'string'"; // STRING, TEXT, STATE, RATING, RAW
}

function toFileStem(name: string): string {
    return name.replace(/([a-z])([A-Z])/g, '$1-$2').toLowerCase();
}

function toCamelCase(name: string): string {
    return name.length === 0 ? name : `${name[0].toLowerCase()}${name.slice(1)}`;
}

function formatPropertyName(name: string): string {
    return /^[$A-Z_][0-9A-Z_$]*$/i.test(name) ? name : JSON.stringify(name);
}

function resolveFrameworkImports(outputDir: string, baseImport?: string): IFrameworkImports {
    const entityImport = resolveBaseImport(outputDir, baseImport);
    const resolvedOutputDir = path.resolve(outputDir);
    const workspaceSrcPath = path.resolve(process.cwd(), 'src');
    const dataSourcePath = path.resolve(process.cwd(), 'src', 'core', 'rally-datasource.ts');
    const repositoryPath = path.resolve(process.cwd(), 'src', 'core', 'rally-repository.ts');
    const relativeToSrc = path.relative(workspaceSrcPath, resolvedOutputDir);
    const isInsideWorkspaceSrc =
        relativeToSrc === '' ||
        (!relativeToSrc.startsWith('..') && !path.isAbsolute(relativeToSrc));

    if (isInsideWorkspaceSrc && fs.existsSync(dataSourcePath) && fs.existsSync(repositoryPath)) {
        return {
            entityImport,
            dataSourceImport: path.relative(resolvedOutputDir, replaceTsExtension(dataSourcePath)).replace(/\\/g, '/').replace(/^(?!\.)/, './'),
            repositoryImport: path.relative(resolvedOutputDir, replaceTsExtension(repositoryPath)).replace(/\\/g, '/').replace(/^(?!\.)/, './')
        };
    }

    return {
        entityImport,
        dataSourceImport: 'rallyorm',
        repositoryImport: 'rallyorm'
    };
}

function quoteTypeLiteral(value: string): string {
    return JSON.stringify(value.replace(/\\/g, '\\\\'));
}

function mapAttributeTypeToTsType(attrType: string, enumValues?: string[]): string {
    if (enumValues && enumValues.length > 0) {
        return enumValues.map(value => quoteTypeLiteral(value)).join(' | ');
    }

    if (attrType === 'INTEGER' || attrType === 'QUANTITY' || attrType === 'DECIMAL') {
        return 'number';
    }

    if (attrType === 'BOOLEAN') {
        return 'boolean';
    }

    if (attrType === 'DATE') {
        return 'string | Date';
    }

    return 'string';
}

function replaceTsExtension(filePath: string): string {
    return filePath.replace(/\.ts$/, '.js');
}

function resolveBaseImport(outputDir: string, baseImport?: string): string {
    if (baseImport) {
        return baseImport;
    }

    const workspaceBaseEntityPath = path.resolve(process.cwd(), 'src', 'models', 'base-entity.ts');
    const resolvedOutputDir = path.resolve(outputDir);
    const workspaceSrcPath = path.resolve(process.cwd(), 'src');

    if (!fs.existsSync(workspaceBaseEntityPath)) {
        return 'rallyorm';
    }

    const relativeToSrc = path.relative(workspaceSrcPath, resolvedOutputDir);
    const isInsideWorkspaceSrc =
        relativeToSrc === '' ||
        (!relativeToSrc.startsWith('..') && !path.isAbsolute(relativeToSrc));

    if (!isInsideWorkspaceSrc) {
        return 'rallyorm';
    }

    const relativeImport = path
        .relative(resolvedOutputDir, replaceTsExtension(workspaceBaseEntityPath))
        .replace(/\\/g, '/');

    return relativeImport.startsWith('.') ? relativeImport : `./${relativeImport}`;
}

export async function generateModels(options: IGeneratorOptions): Promise<void> {
    const { apiKey, workspaceId, outputDir } = options;
    const frameworkImports = resolveFrameworkImports(outputDir, options.baseImport);
    const baseImport = frameworkImports.entityImport;

    const client = new RallyClient({
        apiKey,
        workspace: workspaceId.startsWith('/workspace/') ? workspaceId : `/workspace/${workspaceId}`,
        ...(options.baseUrl ? { baseUrl: options.baseUrl } : {}),
        logger: {
            debug: () => {},
            info: (msg) => console.log(`   ${msg}`),
            warn: (msg) => console.warn(`   WARN: ${msg}`),
            error: (msg) => console.error(`   ERROR: ${msg}`)
        }
    });

    console.log('Fetching TypeDefinitions from Rally...');

    const types = await client.queryAll('TypeDefinition', {
        fetch: 'ObjectID,Name,ElementName,TypePath,Attributes,Abstract,Parent',
        pagesize: 200
    });

    let validTypes = types.filter((t: any) => t.ElementName && t.Abstract === false);

    // Deduplicate by ElementName (case-insensitive) to avoid generating same class multiple times.
    // Rally can return multiple definitions for the same name (global vs workspace-specific overrides).
    const uniqueTypes = new Map<string, any>();
    for (const t of validTypes) {
        const key = ((t as any).ElementName as string).toLowerCase();
        if (!uniqueTypes.has(key)) {
            uniqueTypes.set(key, t);
        }
    }
    validTypes = Array.from(uniqueTypes.values());

    if (options.include && options.include.length > 0) {
        const includeSet = new Set(options.include.map(n => n.toLowerCase()));
        validTypes = validTypes.filter((t: any) =>
            includeSet.has((t.ElementName as string).toLowerCase())
        );
    }

    console.log(`Found ${validTypes.length} unique valid TypeDefinitions. Gathering attributes...`);

    if (!fs.existsSync(outputDir)) {
        fs.mkdirSync(outputDir, { recursive: true });
    }

    const modelEntries: IGeneratedModelEntry[] = [];
    const seenClassNames = new Set<string>();

    for (let i = 0; i < validTypes.length; i++) {
        const typeDef = validTypes[i] as any;
        const className = sanitizeClassName(typeDef.ElementName || typeDef.Name);
        console.log(`[${i + 1}/${validTypes.length}] Generating ${className}...`);

        let attributesResponse: any[] = [];
        if (typeDef.Attributes && typeDef.Attributes._ref) {
            try {
                attributesResponse = await client.queryCollectionAll(typeDef.Attributes._ref, {
                    fetch: 'ElementName,Name,AttributeType,Required,Hidden,Custom,AllowedValueType,MaxLength,ReadOnly,Constrained,MaxFractionalDigits,Filterable,Sortable,AllowedValues',
                    pagesize: 200
                });
            } catch (err: any) {
                console.warn(`   Could not load attributes for ${className}: ${err.message}`);
            }
        }

        // Fetch AllowedValues in parallel for constrained string/state/rating fields
        const enumMap = await fetchEnumValues(client, attributesResponse);

        const fileStem = toFileStem(className);
        const fileName = `${fileStem}.ts`;
        const filePath = path.join(outputDir, fileName);

        const classContent = generateClassContent(className, typeDef, attributesResponse, enumMap, baseImport);
        fs.writeFileSync(filePath, classContent, 'utf-8');

        if (!seenClassNames.has(className)) {
            seenClassNames.add(className);
            modelEntries.push({
                className,
                entityType: (typeDef.TypePath ?? typeDef.ElementName).toLowerCase(),
                fileStem
            });
        }
    }

    const modelImports = modelEntries
        .map(entry => {
            const importPath = `./${entry.fileStem}.js`;
            return `import { ${entry.className} } from '${importPath}';`;
        })
        .join('\n');

    const generatedDataSourceContent = generateDataSourceContent(modelEntries, frameworkImports);

    const indexContent = modelEntries.length === 0
        ? `// Automatically generated by RallyORM CLI\n` +
          `import { RallyEntity } from '${baseImport}';\n\n` +
          `export const GENERATED_MODELS: (typeof RallyEntity)[] = [];\n`
        : `// Automatically generated by RallyORM CLI\n` +
          `import { RallyEntity } from '${baseImport}';\n` +
          `${modelImports}\n` +
          `import { GeneratedRallyDataSource } from './generated-data-source.js';\n\n` +
          `export {\n    ${modelEntries.map(entry => entry.className).join(',\n    ')},\n    GeneratedRallyDataSource\n};\n\n` +
          `export const GENERATED_MODELS: (typeof RallyEntity)[] = [\n${modelEntries.map(entry => `    ${entry.className}`).join(',\n')}\n];\n`;

    fs.writeFileSync(path.join(outputDir, 'index.ts'), indexContent, 'utf-8');
    fs.writeFileSync(path.join(outputDir, 'generated-data-source.ts'), generatedDataSourceContent, 'utf-8');
}

/**
 * For each attribute that is a constrained STRING/STATE/RATING with AllowedValues,
 * fetch the actual enum string values in parallel.
 */
async function fetchEnumValues(client: RallyClient, attributes: any[]): Promise<Map<string, string[]>> {
    const eligible = attributes.filter(
        attr =>
            attr.Constrained &&
            ENUM_ELIGIBLE_TYPES.has(attr.AttributeType) &&
            attr.AllowedValues?._ref &&
            attr.AllowedValues?.Count > 0
    );

    if (eligible.length === 0) return new Map();

    const results = await Promise.all(
        eligible.map(async attr => {
            try {
                const avItems = await client.queryCollectionAll(attr.AllowedValues._ref, {
                    fetch: 'StringValue',
                    pagesize: 200
                });
                const values = avItems
                    .map((v: any) => v.StringValue)
                    .filter((v: any) => v !== null && v !== undefined && v !== '');
                return { elementName: attr.ElementName, values };
            } catch {
                return { elementName: attr.ElementName, values: [] };
            }
        })
    );

    return new Map(results.filter(r => r.values.length > 0).map(r => [r.elementName, r.values]));
}

function sanitizeClassName(name: string): string {
    return name.replace(/[^a-zA-Z0-9_]/g, '');
}

function generateClassContent(
    className: string,
    typeDef: any,
    attributes: any[],
    enumMap: Map<string, string[]>,
    baseImport = 'rallyorm'
): string {
    const entityType = (typeDef.TypePath ?? typeDef.ElementName).toLowerCase();

    let fieldsStr = '';
    let relationsStr = '';
    let fieldDeclarationsStr = '';
    let relationDeclarationsStr = '';

    for (const attr of attributes) {
        const attrName = attr.ElementName;
        const attrType = attr.AttributeType;

        if (attrType === 'OBJECT' || attrType === 'COLLECTION') {
            const relType = attrType === 'OBJECT' ? 'belongsTo' : 'hasMany';
            const relatedEntity = attr.AllowedValueType?._refObjectName
                ? attr.AllowedValueType._refObjectName.replace(/[^a-zA-Z0-9_]/g, '')
                : 'unknown';
            const relationTsType = attrType === 'COLLECTION' ? 'any[]' : 'any';

            let relMeta = `\n        ${attrName}: {\n            type: '${relType}',\n            entity: '${relatedEntity}',\n            isCollection: ${attrType === 'COLLECTION'}`;
            if (attrType === 'OBJECT') {
                relMeta += `,\n            foreignKey: '${attrName}'`;
            }
            if (attr.ReadOnly) {
                relMeta += `,\n            readOnly: true`;
            }
            relMeta += `\n        },`;
            relationsStr += relMeta;
            relationDeclarationsStr += `\n    declare ${formatPropertyName(attrName)}?: ${relationTsType};`;
            continue;
        }

        const mappedType = mapAttributeType(attrType);
        const parts: string[] = [`type: ${mappedType}`];
        const enumValues = enumMap.get(attrName);

        if (attr.Required) parts.push('required: true');
        if (attr.ReadOnly) parts.push('readOnly: true');
        if (attr.Hidden) parts.push('hidden: true');
        if (attr.Custom) parts.push('isCustom: true');

        // maxLength: meaningful for string-like types when MaxLength > 0
        if (STRING_LIKE_TYPES.has(attrType) && attr.MaxLength > 0) {
            parts.push(`maxLength: ${attr.MaxLength}`);
        }

        // enum values for constrained string/state/rating fields
        if (enumValues && enumValues.length > 0) {
            const quoted = enumValues.map(v => `'${v.replace(/'/g, "\\'")}'`).join(', ');
            parts.push(`enum: [${quoted}]`);
        }

        // maxFractionalDigits for QUANTITY fields (omit when -1 = unlimited)
        if (attrType === 'QUANTITY' && attr.MaxFractionalDigits !== undefined && attr.MaxFractionalDigits >= 0) {
            parts.push(`maxFractionalDigits: ${attr.MaxFractionalDigits}`);
        }

        // filterable / sortable: only emit when explicitly false (true is the normal default)
        if (attr.Filterable === false) parts.push('filterable: false');
        if (attr.Sortable === false) parts.push('sortable: false');

        fieldsStr += `\n        ${attrName}: { ${parts.join(', ')} },`;
        fieldDeclarationsStr += `\n    declare ${formatPropertyName(attrName)}?: ${mapAttributeTypeToTsType(attrType, enumValues)};`;
    }

    return `import { RallyEntity } from '${baseImport}';

/**
 * Generated model for ${typeDef.Name}
 */
export class ${className} extends RallyEntity {
${fieldDeclarationsStr}${relationDeclarationsStr}

    static override readonly entityType = '${entityType}';

    static override readonly fields = {${fieldsStr}
    };

    static override readonly relations = {${relationsStr}
    };
}
`;
}

function generateDataSourceContent(modelEntries: IGeneratedModelEntry[], frameworkImports: IFrameworkImports): string {
    const generatedModelImports = modelEntries
        .map(entry => `import { ${entry.className} } from './${entry.fileStem}.js';`)
        .join('\n');

    const getterOverrides = modelEntries
        .filter(entry => KNOWN_DATASOURCE_GETTERS.has(entry.entityType))
        .map(entry => {
            const getterName = KNOWN_DATASOURCE_GETTERS.get(entry.entityType)!;
            return `\n    get ${getterName}(): RallyRepository<${entry.className}> {\n        return this.getRepository(${entry.className});\n    }`;
        })
        .join('');

    const repositoryMethods = modelEntries
        .map(entry => `\n    get${entry.className}Repository(): RallyRepository<${entry.className}> {\n        return this.getRepository(${entry.className});\n    }`)
        .join('');

    const generatedModelsArray = modelEntries.map(entry => `            ${entry.className}`).join(',\n');

    return `// Automatically generated by RallyORM CLI\n` +
        `import { RallyDataSource, type IRallyDataSourceOptions } from '${frameworkImports.dataSourceImport}';\n` +
        `import type { RallyRepository } from '${frameworkImports.repositoryImport}';\n` +
        `${generatedModelImports}\n\n` +
        `const GENERATED_MODEL_CLASSES = [\n${generatedModelsArray}\n        ];\n\n` +
        `export class GeneratedRallyDataSource extends RallyDataSource {\n` +
        `    constructor(options: IRallyDataSourceOptions) {\n` +
        `        const { models, ...clientOptions } = options;\n` +
        `        super({\n` +
        `            ...clientOptions,\n` +
        `            models: Array.isArray(models) ? [...GENERATED_MODEL_CLASSES, ...models] : GENERATED_MODEL_CLASSES\n` +
        `        });\n` +
        `    }${getterOverrides}${repositoryMethods}\n` +
        `}\n`;
}
