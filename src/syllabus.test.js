const { parseSyllabusMarkdown } = require('./core/syllabus-parser.js');

describe('AlgoScience Syllabus Parser Unit Test Suite', () => {
    test('should return empty syllabus arrays for empty markdown text', () => {
        const result = parseSyllabusMarkdown('');
        expect(result).toEqual({
            "MATHEMATICS": [],
            "PHYSICS": [],
            "CHEMISTRY": []
        });
    });

    test('should correctly parse subjects, chapters, and nested subtopics', () => {
        const mockMd = `
# Syllabus for JEE 2025

### MATHEMATICS

#### UNIT 1: Sets, Relations and Functions
- **Sets and their representation:**
  - Union and intersection.
  - Power set.
- **Relations:**
  - Equivalence relations.

### PHYSICS

#### UNIT 1: Units and Measurements
- Units of measurements, SI Units.
- Least count and errors.

### CHEMISTRY

#### UNIT 1: Some Basic Concepts in Chemistry
- Matter and its nature.
        `;

        const result = parseSyllabusMarkdown(mockMd);

        // Assert Mathematics
        expect(result.MATHEMATICS).toHaveLength(1);
        const mathCh = result.MATHEMATICS[0];
        expect(mathCh.title).toBe('UNIT 1: Sets, Relations and Functions');
        expect(mathCh.index).toBe(1);
        expect(mathCh.id).toBe('mathematics-unit-1');
        expect(mathCh.subtopics).toEqual([
            { text: 'Sets and their representation:', level: 1 },
            { text: 'Union and intersection.', level: 2 },
            { text: 'Power set.', level: 2 },
            { text: 'Relations:', level: 1 },
            { text: 'Equivalence relations.', level: 2 }
        ]);

        // Assert Physics
        expect(result.PHYSICS).toHaveLength(1);
        const physCh = result.PHYSICS[0];
        expect(physCh.title).toBe('UNIT 1: Units and Measurements');
        expect(physCh.index).toBe(1);
        expect(physCh.subtopics).toEqual([
            { text: 'Units of measurements, SI Units.', level: 1 },
            { text: 'Least count and errors.', level: 1 }
        ]);

        // Assert Chemistry
        expect(result.CHEMISTRY).toHaveLength(1);
        const chemCh = result.CHEMISTRY[0];
        expect(chemCh.title).toBe('UNIT 1: Some Basic Concepts in Chemistry');
        expect(chemCh.index).toBe(1);
        expect(chemCh.subtopics).toEqual([
            { text: 'Matter and its nature.', level: 1 }
        ]);
    });
});
