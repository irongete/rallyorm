const requiredVariables = [
    'RALLY_API_KEY',
    'RALLY_TEST_PROJECT_OID'
];

const missingVariables = requiredVariables.filter(variableName => {
    const value = process.env[variableName];
    return typeof value !== 'string' || value.trim().length === 0;
});

if (missingVariables.length > 0) {
    console.error(
        `Stable publish requires live Rally validation. Missing environment variables: ${missingVariables.join(', ')}`
    );
    console.error('Set the required live credentials and rerun npm publish or npm run release:check:publish.');
    process.exit(1);
}