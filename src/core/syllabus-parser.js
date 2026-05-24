/**
 * AlgoScience Syllabus Markdown Parser Utility
 * Converts structured JEE Markdown Syllabus into a normalized JSON schema:
 * Subject -> Chapter/Unit -> Subtopic (Level 1 and Level 2)
 */

function parseSyllabusMarkdown(mdText) {
    const lines = mdText.split('\n');
    const syllabus = {
        "MATHEMATICS": [],
        "PHYSICS": [],
        "CHEMISTRY": []
    };

    let currentSubject = null;
    let currentChapter = null;
    let chIndex = 1;

    for (let line of lines) {
        const trimmed = line.trim();
        if (!trimmed) continue;

        // 1. Detect Subjects: e.g. "### MATHEMATICS", "### PHYSICS", "### CHEMISTRY"
        if (trimmed.startsWith('### ')) {
            const subjName = trimmed.replace('### ', '').trim().toUpperCase();
            if (subjName.includes('MATHEMATICS')) {
                currentSubject = "MATHEMATICS";
                currentChapter = null;
                chIndex = 1;
            } else if (subjName.includes('PHYSICS')) {
                currentSubject = "PHYSICS";
                currentChapter = null;
                chIndex = 1;
            } else if (subjName.includes('CHEMISTRY')) {
                currentSubject = "CHEMISTRY";
                currentChapter = null;
                chIndex = 1;
            }
            continue;
        }

        // 2. Detect Chapters/Units: e.g. "#### UNIT 1: Sets..."
        if (trimmed.startsWith('#### ')) {
            if (currentSubject) {
                const chapterTitle = trimmed.replace('#### ', '').trim();
                currentChapter = {
                    id: `${currentSubject.toLowerCase()}-unit-${chIndex}`,
                    index: chIndex,
                    title: chapterTitle,
                    subtopics: []
                };
                syllabus[currentSubject].push(currentChapter);
                chIndex++;
            }
            continue;
        }

        // 3. Detect Level 1 Subtopics
        if (line.startsWith('- ') || line.startsWith('* ')) {
            if (currentChapter) {
                const cleanText = trimmed.replace(/^[-*]\s+/, '').replace(/\*\*/g, '').trim();
                currentChapter.subtopics.push({
                    text: cleanText,
                    level: 1
                });
            }
            continue;
        }

        // 4. Detect Level 2 Nested Subtopics (indented)
        if (line.startsWith('  - ') || line.startsWith('  * ') || line.startsWith('\t- ') || line.startsWith('\t* ')) {
            if (currentChapter && currentChapter.subtopics.length > 0) {
                const cleanText = trimmed.replace(/^[-*]\s+/, '').replace(/\*\*/g, '').trim();
                currentChapter.subtopics.push({
                    text: cleanText,
                    level: 2
                });
            }
            continue;
        }
    }
    return syllabus;
}

if (typeof module !== 'undefined' && module.exports) {
    module.exports = { parseSyllabusMarkdown };
}
