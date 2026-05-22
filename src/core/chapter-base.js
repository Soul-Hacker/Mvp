/**
 * Visual Physics - Base Chapter Class & Registry
 * Establishes window.PhysicsLab namespace, the global registry, and chapter schemas.
 */

window.PhysicsLab = window.PhysicsLab || {};

window.PhysicsLab.chapters = new Map();

window.PhysicsLab.registerChapter = function(id, chapterInstance) {
    window.PhysicsLab.chapters.set(id, chapterInstance);
};

window.PhysicsLab.BaseChapter = class BaseChapter {
    constructor(id, title, subtitle, badge) {
        this.id = id;
        this.title = title;
        this.subtitle = subtitle;
        this.badge = badge;
        
        // UI Action configurations
        this.launchBtnText = 'Launch';
        this.hasPauseControl = false;
        
        // Dynamic controls and dashboard templates
        this.controls = []; 
        this.telemetry = [];
        
        // Solver config
        this.hasSolver = false;
        this.solverTitle = 'Theoretical Solver';
        this.solverSubtitle = 'Evaluate exact formulas';
        this.solverUnit = 's';
        this.solverLabel = 'Target Value:';
        this.solverRange = { min: 0, max: 1, step: 0.01, value: 0 };
        this.solverTelemetry = []; 
    }

    createEngine(canvasId) {
        return new window.PhysicsLab.PhysicsEngine(canvasId);
    }

    init(engine) {
        // Enforce defaults in engine
        engine.showGrid = true;
        engine.showGround = true;
        engine.activeTopic = this;
    }

    onControlChange(controlId, value, engine) {
        // Implemented by chapters
    }

    onSolverChange(value, engine) {
        // Implemented by chapters
    }

    launch(engine) {
        // Implemented by chapters
    }

    destroy(engine) {
        engine.activeTopic = null;
        engine.clear();
    }

    drawOverlay(ctx, engine) {
        // Implemented by chapters
    }
};
