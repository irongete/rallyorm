import { RallyDataSource } from '../src/core/rally-datasource.js';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import * as dotenv from 'dotenv';

// Load .env relative to this file
dotenv.config({ path: join(dirname(fileURLToPath(import.meta.url)), '../.env') });

async function runDemo() {
    const ds = new RallyDataSource({
        apiKey: process.env.RALLY_API_KEY || 'missing-api-key',
        workspace: process.env.RALLY_WORKSPACE,
        logLevel: 'silent', 
        telemetry: true // <----------- Magia! Opción Cero-Config
    });

    try {
        console.log('--- RallyORM Progress Telemetry Demo ---\n');
        
        console.log('2. Eager-loading complex nested relationships...');
        // Simulamos una consulta multinivel (Defect -> Tasks -> State)
        await ds.defects.findAllBy({
            where: { State: 'Open' },
            fetch: ['FormattedID', 'Name', 'Tasks'],
            include: ['Tasks.State'],
            pagesize: 5,
            maxResults: 5
        });
        
        // Wait briefly for telemetry console lines to settle
        await new Promise(resolve => setTimeout(resolve, 200));

        console.log(`\nDemo completed successfully!`);

    } catch (e: any) {
        console.error('\nDemo error:', e.message);
    }
}

runDemo();
