/**
 * @jest-environment jsdom
 */

const { JEE_CURRICULUM, loadUserProgress, saveUserProgress, PROGRESS_STORE_KEY } = require('./curriculum.js');

describe('JEE Curriculum & User Progress Storage Suite', () => {
    beforeEach(() => {
        localStorage.clear();
        jest.clearAllMocks();
    });

    test('should contain valid Class 11 and Class 12 curriculum keys', () => {
        expect(JEE_CURRICULUM).toHaveProperty('class11');
        expect(JEE_CURRICULUM).toHaveProperty('class12');
    });

    test('should have Physics, Chemistry, and Mathematics subjects', () => {
        ['physics', 'chemistry', 'mathematics'].forEach(subj => {
            expect(JEE_CURRICULUM.class11).toHaveProperty(subj);
            expect(JEE_CURRICULUM.class12).toHaveProperty(subj);
        });
    });

    test('should return default empty completedLessons when no progress exists in localStorage', () => {
        const progress = loadUserProgress();
        expect(progress).toEqual({ completedLessons: {} });
    });

    test('should load and save completed progress items correctly from/to localStorage', () => {
        const mockProgress = {
            completedLessons: {
                'c11-p-m1-ch1-l1': true,
                'c11-p-m1-ch1-l2': false,
                'c11-p-m1-ch1-l3': true
            }
        };

        saveUserProgress(mockProgress);
        
        // Directly check localStorage stringified content
        const storedStr = localStorage.getItem(PROGRESS_STORE_KEY);
        expect(storedStr).toBe(JSON.stringify(mockProgress));

        // Load via helper and assert
        const loaded = loadUserProgress();
        expect(loaded.completedLessons['c11-p-m1-ch1-l1']).toBe(true);
        expect(loaded.completedLessons['c11-p-m1-ch1-l2']).toBe(false);
        expect(loaded.completedLessons['c11-p-m1-ch1-l3']).toBe(true);
    });

    test('should handle invalid storage content gracefully and return empty default', () => {
        localStorage.setItem(PROGRESS_STORE_KEY, 'invalid-json-string');
        const progress = loadUserProgress();
        expect(progress).toEqual({ completedLessons: {} });
    });

    test('every chapter in the curriculum must have a valid non-empty learningOutcomes array', () => {
        ['class11', 'class12'].forEach(cls => {
            ['physics', 'chemistry', 'mathematics'].forEach(subj => {
                const topics = JEE_CURRICULUM[cls][subj] || [];
                topics.forEach(topic => {
                    topic.chapters.forEach(chapter => {
                        expect(chapter).toHaveProperty('learningOutcomes');
                        expect(Array.isArray(chapter.learningOutcomes)).toBe(true);
                        expect(chapter.learningOutcomes.length).toBeGreaterThan(0);
                        chapter.learningOutcomes.forEach(outcome => {
                            expect(typeof outcome).toBe('string');
                            expect(outcome.trim().length).toBeGreaterThan(0);
                        });
                    });
                });
            });
        });
    });
});
