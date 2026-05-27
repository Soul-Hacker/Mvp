/**
 * @jest-environment jsdom
 */

const fs = require('fs');
const path = require('path');

describe('DOM & UI Layout Unit Tests', () => {
    let document;

    beforeEach(() => {
        // Load the HTML content
        const htmlPath = path.resolve(__dirname, '../index.html');
        const htmlContent = fs.readFileSync(htmlPath, 'utf8');
        
        // Setup jsdom environment
        document = window.document;
        document.documentElement.innerHTML = htmlContent;

        // Mock localStorage
        const localStorageMock = (() => {
            let store = {};
            return {
                getItem: jest.fn(key => store[key] || null),
                setItem: jest.fn((key, value) => {
                    store[key] = value.toString();
                }),
                clear: jest.fn(() => {
                    store = {};
                })
            };
        })();
        Object.defineProperty(window, 'localStorage', { value: localStorageMock });
    });

    test('should have a dark-theme body class', () => {
        expect(document.body.classList.contains('dark-theme')).toBe(true);
    });

    test('should have essential view panels in the workspace', () => {
        const viewHome = document.getElementById('view-home');
        const viewTree = document.getElementById('view-tree');
        const viewLesson = document.getElementById('view-lesson');

        expect(viewHome).not.toBeNull();
        expect(viewTree).not.toBeNull();
        expect(viewLesson).not.toBeNull();
    });

    test('should have refactored View 2 dual-column workspace structure', () => {
        const workspace = document.querySelector('.chapter-workspace');
        expect(workspace).not.toBeNull();

        const lessonsCol = workspace.querySelector('.chapter-lessons-col');
        const checklistCol = workspace.querySelector('.chapter-checklist-col');

        expect(lessonsCol).not.toBeNull();
        expect(checklistCol).not.toBeNull();

        const lessonsTitle = lessonsCol.querySelector('.col-section-title');
        const checklistTitle = checklistCol.querySelector('.col-section-title');

        expect(lessonsTitle.textContent).toBe('Lessons');
        expect(checklistTitle.textContent).toBe('Chapter Checklist');
    });

    test('should contain class selector segment radio buttons', () => {
        const class11Radio = document.getElementById('segment-class11');
        const class12Radio = document.getElementById('segment-class12');

        expect(class11Radio).not.toBeNull();
        expect(class12Radio).not.toBeNull();
        expect(class11Radio.getAttribute('name')).toBe('class-select');
        expect(class12Radio.getAttribute('name')).toBe('class-select');
    });
});
