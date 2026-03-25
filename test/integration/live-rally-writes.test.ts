import { expect } from 'chai';

import { Defect } from '../../src/models/core/defect.js';
import { Tag } from '../../src/models/core/tag.js';
import { createWritableIntegrationDataSource, getWriteIntegrationSkipReason, loadIntegrationConfig } from '../setup/integration-helpers.js';

const config = loadIntegrationConfig();
const skipReason = getWriteIntegrationSkipReason(config);
const describeLiveWrites = skipReason ? describe.skip : describe;

describeLiveWrites('Live Rally Write Integration', function () {
    this.timeout(60000);

    const dataSource = createWritableIntegrationDataSource(config);
    const defects = dataSource.getRepository(Defect);
    const tags = dataSource.getRepository(Tag);

    it('should create, update and delete a sandbox defect', async () => {
        const suffix = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
        const created = await defects.create({
            Name: `RallyORM live release validation ${suffix}`,
            Description: 'Created by the live release gate. Safe to delete.',
            Project: { _ref: `/project/${config.testProjectOid}` },
            Priority: 'Normal'
        });

        expect(created.ObjectID).to.not.equal(undefined);
        expect(created.Name).to.contain(suffix);

        const updated = await defects.update(created.ObjectID, {
            Description: `Updated by RallyORM live release validation ${suffix}`,
            Severity: 'Major Problem'
        });

        expect(updated.ObjectID).to.equal(created.ObjectID);

        const reloaded = await defects.findOne(created.ObjectID, {
            fetch: ['ObjectID', 'Name', 'Description', 'Project.ObjectID']
        });

        expect(reloaded).to.not.equal(null);
        expect(reloaded?.Description).to.contain(suffix);
        expect(String(reloaded?.Project?.ObjectID ?? '')).to.equal(String(config.testProjectOid));

        const deleted = await defects.delete(created.ObjectID);
        expect(deleted).to.equal(true);
    });

    it('should auto-create a new tag when saving a defect with a string tag', async () => {
        const suffix = Math.random().toString(36).slice(2, 8);
        const tagName = `rallyorm-autotag-${suffix}`;

        let createdDefectId: string | number | undefined;
        let createdTagId: string | number | undefined;

        try {
            // If tag auto-creation fails, create() throws RallyOperationError — so reaching
            // this point with a valid ObjectID is sufficient proof the tag was auto-created.
            const defect = await defects.create({
                Name: `RallyORM tag creation ${suffix}`,
                Description: 'Auto-tag creation test. Safe to delete.',
                Project: { _ref: `/project/${config.testProjectOid}` },
                Tags: [tagName]
            });

            createdDefectId = defect.ObjectID;
            expect(createdDefectId).to.not.equal(undefined);

            // Best-effort: find the tag for cleanup. Rally's Tag query endpoint is
            // eventually consistent so this may return null and is not asserted on.
            const matchingTag = await tags.findOne({ Name: tagName });
            if (matchingTag) {
                createdTagId = matchingTag.ObjectID;
            }
        } finally {
            if (createdDefectId) {
                await defects.delete(createdDefectId).catch(() => {});
            }
            if (createdTagId) {
                await tags.delete(createdTagId).catch(() => {});
            }
        }
    });



    it('should accept a mix of ref-based and string tags when saving a defect', async () => {
        const suffix = Math.random().toString(36).slice(2, 8);
        const stringTagName = `rallyorm-mix-${suffix}`;

        let preCreatedTag: any;
        let createdDefectId: string | number | undefined;
        let stringTagId: string | number | undefined;

        try {
            preCreatedTag = await tags.create({ Name: `rallyorm-ref-${suffix}` }); // max 19 chars, within 32-char limit
            expect(preCreatedTag.ObjectID).to.not.equal(undefined);

            const defect = await defects.create({
                Name: `RallyORM mixed-tag test ${suffix}`,
                Project: { _ref: `/project/${config.testProjectOid}` },
                Tags: [{ _ref: `/tag/${preCreatedTag.ObjectID}` }, stringTagName]
            });

            createdDefectId = defect.ObjectID;
            expect(createdDefectId).to.not.equal(undefined);

            const reloaded = await defects.findOne(createdDefectId!, { fetch: ['Tags.Name'] });
            const tagNames = ((reloaded?.Tags as any[]) ?? []).map((t: any) => t?.Name ?? t);
            expect(tagNames).to.include(preCreatedTag.Name);
            expect(tagNames).to.include(stringTagName);

            const resolvedStringTag = await tags.findOne({ Name: stringTagName });
            if (resolvedStringTag) {
                stringTagId = resolvedStringTag.ObjectID;
            }
        } finally {
            if (createdDefectId) {
                await defects.delete(createdDefectId).catch(() => {});
            }
            if (preCreatedTag?.ObjectID) {
                await tags.delete(preCreatedTag.ObjectID).catch(() => {});
            }
            if (stringTagId) {
                await tags.delete(stringTagId).catch(() => {});
            }
        }
    });
});