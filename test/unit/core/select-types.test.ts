import { expect } from 'chai';
import { RallyRepository } from '../../../src/core/rally-repository.js';
import type { SelectResult } from '../../../src/core/rally-repository.js';
import { RallyEntity } from '../../../src/models/base-entity.js';
import { createMockClient } from '../../setup/test-helpers.js';

/**
 * Compile-time checks for the `select` typed overloads.
 *
 * These assertions are evaluated by `tsc` when the test project is type-checked;
 * the runtime expectations only make sure the overload resolution still calls
 * the same implementation.
 */

// Mirrors the shape emitted by `npx rallyorm generate`: optional typed declarations.
class TypedStory extends RallyEntity {
    declare Name?: string;
    declare Description?: string;
    declare PlanEstimate?: number;
    declare Owner?: any;

    static entityType = 'hierarchicalrequirement';
}

type Equals<A, B> = (<X>() => X extends A ? 1 : 2) extends (<X>() => X extends B ? 1 : 2) ? true : false;
type Assert<T extends true> = T;

type Narrowed = SelectResult<TypedStory, readonly ['Name', 'Owner.DisplayName', 'Tasks[Task].Name']>;

// Selected top-level fields lose their optional modifier…
type _nameIsRequired = Assert<Equals<Narrowed['Name'], string>>;
// …including the base of a dot path and of a type-filtered path.
type _ownerIsRequired = Assert<Equals<Narrowed['Owner'], any>>;
// Everything else keeps its declared optional type.
type _descriptionIsOptional = Assert<Equals<Narrowed['Description'], string | undefined>>;
type _estimateIsOptional = Assert<Equals<Narrowed['PlanEstimate'], number | undefined>>;
// Methods and undeclared (custom) fields are untouched.
type _validateIsAMethod = Assert<Equals<Narrowed['validate'], () => boolean>>;
type _customFieldIsAny = Assert<Equals<Narrowed['c_Anything'], any>>;
// A widened `string[]` (no `as const`) selects nothing and degrades to the plain model.
type _widenedIsPlainModel = Assert<SelectResult<TypedStory, string[]> extends TypedStory ? (TypedStory extends SelectResult<TypedStory, string[]> ? true : false) : false>;

describe('select typed overloads', () => {
    it('should narrow the result type when the select list is passed as const', async () => {
        const client = createMockClient({
            query: async () => [{ _ref: '/hierarchicalrequirement/1', Name: 'Story', Description: 'Text' }]
        });
        const repo = new RallyRepository<TypedStory>('hierarchicalrequirement', client, TypedStory);

        const [story] = await repo.find({ select: ['Name'] as const });

        // Type-level: `Name` is `string`, `Description` is `string | undefined`.
        const name: string = story.Name;
        const description: string | undefined = story.Description;

        expect(name).to.equal('Story');
        expect(description).to.equal('Text');
    });

    it('should keep the plain model type when select is not a readonly tuple', async () => {
        const client = createMockClient({
            query: async () => [{ _ref: '/hierarchicalrequirement/1', Name: 'Story' }]
        });
        const repo = new RallyRepository<TypedStory>('hierarchicalrequirement', client, TypedStory);

        const stories = await repo.find({ select: ['Name'] });
        const story: TypedStory = stories[0];

        expect(story).to.be.instanceOf(TypedStory);
        expect(story.Name).to.equal('Story');
    });
});
