#!/usr/bin/env node
import * as readline from 'readline';
import { generateModels } from './generator.js';

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

const question = (query: string): Promise<string> => new Promise((resolve) => rl.question(query, resolve));

async function main() {
    const args = process.argv.slice(2);
    const command = args[0];

    if (command !== 'generate' && command !== 'init') {
        console.log('Usage: npx rallyorm generate [options]');
        console.log('Options:');
        console.log('  --api-key=<key>        Rally API Key (prompted when omitted)');
        console.log('  --workspace=<id>       Target Workspace ID (prompted when omitted)');
        console.log('  --output=<dir>         Output directory (default: ./src/models/generated)');
        console.log('  --base-url=<url>       WSAPI base URL (default: https://rally1.rallydev.com/slm/webservice/v2.0)');
        console.log('  --include=<A,B,...>    Only generate these type names (e.g. Defect,HierarchicalRequirement)');
        console.log('  --base-import=<spec>   Import specifier for the RallyORM base classes (default: rallyorm)');
        process.exit(1);
    }

    console.log('RallyORM Dynamic Model Generator\n');

    let apiKey = args.find(arg => arg.startsWith('--api-key='))?.split('=')[1];
    let workspaceId = args.find(arg => arg.startsWith('--workspace='))?.split('=')[1];
    const outputDir = args.find(arg => arg.startsWith('--output='))?.split('=')[1] || './src/models/generated';
    const baseUrl = args.find(arg => arg.startsWith('--base-url='))?.split('=').slice(1).join('=');
    const baseImport = args.find(arg => arg.startsWith('--base-import='))?.split('=').slice(1).join('=');
    const includeArg = args.find(arg => arg.startsWith('--include='))?.split('=').slice(1).join('=');
    const include = includeArg ? includeArg.split(',').map(s => s.trim()).filter(Boolean) : undefined;

    if (!apiKey) {
        apiKey = await question('What is your Rally API Key (e.g. _abcd1234...)? ');
    }
    
    if (!workspaceId) {
        workspaceId = await question('What is the target Workspace ID (e.g. 123456789)? ');
    }

    rl.close();

    if (!apiKey || !workspaceId) {
        console.error('Error: Both API Key and Workspace ID are required.');
        process.exit(1);
    }

    try {
        await generateModels({ apiKey, workspaceId, outputDir, baseUrl, baseImport, include });
        console.log(`\nSuccessfully generated RallyORM models in ${outputDir}`);
    } catch (err) {
        console.error('\nError generating models:');
        console.error(err);
        process.exit(1);
    }
}

main();
