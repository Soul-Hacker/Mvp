// JEE Curriculum Data Store (Physics, Chemistry, Mathematics)
const JEE_CURRICULUM = {
    class11: {
        physics: [
            {
                id: "class11-phy-mechanics1",
                title: "Mechanics I: Kinematics & Laws",
                badge: "Mechanics",
                chapterCount: 3,
                lessonCount: 13,
                description: "Fundamental vector composition, 1D motion, 2D projectile motion trajectories, and Newton's Laws of Motion.",
                chapters: [
                    {
                        id: "c11-p-m1-ch1",
                        title: "Rectilinear Motion (1D Kinematics)",
                        lessons: [
                            {
                                id: "c11-p-m1-ch1-l1",
                                title: "Distance, Displacement & Velocity Vectors",
                                type: "theory",
                                content: `
                                    <h1>Distance, Displacement & Velocity Vectors</h1>
                                    <p>In kinematics, understanding the difference between scalar metrics and vector values is the bedrock of resolving JEE problems. While <strong>distance</strong> represents the total path length traveled, <strong>displacement</strong> is the shortest path vector between initial and final coordinates.</p>
                                    
                                    <div class="tip-box">
                                        <div class="tip-title">💡 JEE Core Secret</div>
                                        <p>In JEE problems, displacement is frequently determined by integrating velocity over time: $\\vec{s} = \\int \\vec{v} \\, dt$. Be careful when dealing with average speed versus average velocity, as average speed requires finding the absolute value of instantaneous velocities first: $\\text{Speed}_{\\text{avg}} = \\frac{1}{\\Delta t} \\int |v(t)| \\, dt$.</p>
                                    </div>

                                    <h3>1. Rectilinear Equations under Constant Acceleration</h3>
                                    <p>When acceleration $a$ is constant, we derive the classical kinematic equations from calculus principles:</p>
                                    
                                    <div class="equation-block">
                                        $$v = u + at$$
                                        $$s = ut + \\frac{1}{2}at^2$$
                                        $$v^2 = u^2 + 2as$$
                                    </div>

                                    <p>Where:</p>
                                    <ul>
                                        <li>$u$ is initial velocity ($m/s$)</li>
                                        <li>$v$ is instantaneous velocity at time $t$ ($m/s$)</li>
                                        <li>$s$ is displacement ($m$)</li>
                                        <li>$a$ is constant acceleration ($m/s^2$)</li>
                                    </ul>

                                    <div class="error-box">
                                        <div class="error-title">⚠️ Common Student Trap</div>
                                        <p>Never apply these equations if acceleration is a function of time, position, or velocity (e.g., $a = -kv$ or $a = kt$). For variable acceleration, you MUST use the calculus relations: $a = \\frac{dv}{dt} = v\\frac{dv}{dx}$.</p>
                                    </div>
                                `
                            },
                            {
                                id: "c11-p-m1-ch1-l2",
                                title: "Equation of Motion Under Constant Gravity",
                                type: "derivation",
                                content: `
                                    <h1>Equation of Motion Under Constant Gravity</h1>
                                    <p>When an object is thrown vertically upwards in the absence of air resistance, it experiences a constant downward acceleration due to earth's gravity ($g \\approx 9.8 \\, m/s^2$, often approximated as $10 \\, m/s^2$ in JEE questions).</p>
                                    
                                    <h3>Derivation of Time to Peak Height</h3>
                                    <p>Let the upwards direction be positive ($+y$). Thus, initial velocity is $+u$ and acceleration is $-g$. At the maximum peak height $H$, the instantaneous velocity $v_y$ drops to zero.</p>
                                    
                                    <div class="equation-block">
                                        $$v = u + at \\implies 0 = u - gt_{\\text{up}}$$
                                        $$t_{\\text{up}} = \\frac{u}{g}$$
                                    </div>

                                    <p>Substituting $t_{\\text{up}}$ back into the displacement equation gives us the maximum height formula:</p>
                                    
                                    <div class="equation-block">
                                        $$H = u\\left(\\frac{u}{g}\\right) - \\frac{1}{2}g\\left(\\frac{u}{g}\\right)^2$$
                                        $$H = \\frac{u^2}{2g}$$
                                    </div>

                                    <div class="tip-box">
                                        <div class="tip-title">⚡ JEE Tip: Time Symmetry</div>
                                        <p>In a symmetric vertical path (where launch and landing heights are identical), the time of ascent equals the time of descent: $t_{\\text{total}} = \\frac{2u}{g}$. The collision velocity with the ground is exactly equal in magnitude but opposite in sign to the launch velocity: $v_{\\text{final}} = -u$.</p>
                                    </div>
                                `
                            },
                            {
                                id: "c11-p-m1-ch1-l3",
                                title: "Interactive Lab: 1D Rectilinear Sandbox",
                                type: "lab",
                                labType: "rectilinear",
                                content: `
                                    <h1>Interactive Lab: 1D Rectilinear Sandbox</h1>
                                    <p>Simulate one-dimensional motion in real time. Modify the initial position, initial velocity, and constant acceleration using the controls to see how position, velocity, and deceleration compose graphical telemetry values.</p>
                                    
                                    <div class="tip-box">
                                        <div class="tip-title">🛠️ Lab Instructions</div>
                                        <p>Set a positive initial velocity ($v_0 > 0$) paired with a negative acceleration ($a < 0$, which acts as deceleration). Observe the particle slow down, temporarily come to rest at its peak displacement point ($v = 0$), and then reverse direction with increasing speed.</p>
                                    </div>
                                `
                            }
                        ]
                    },
                    {
                        id: "c11-p-m1-ch2",
                        title: "2D Projectile Motion & Vector Splitting",
                        lessons: [
                            {
                                id: "c11-p-m1-ch2-l1",
                                title: "Resolving 2D Vectors into Orthogonal Components",
                                type: "theory",
                                content: `
                                    <h1>Resolving Vectors into Orthogonal Components</h1>
                                    <p>Two-dimensional motion can be completely simplified by analyzing it as two independent, simultaneous one-dimensional motions along mutually perpendicular axes (typically horizontal $x$ and vertical $y$).</p>
                                    
                                    <h3>Velocity Vector Decompositions</h3>
                                    <p>If a projectile is launched with an initial velocity $u$ at an angle $\\theta$ relative to the horizontal ground:</p>
                                    
                                    <div class="equation-block">
                                        $$u_x = u \\cos\\theta$$
                                        $$u_y = u \\sin\\theta$$
                                    </div>

                                    <div class="tip-box">
                                        <div class="tip-title">💡 Independence of Axes</div>
                                        <p><strong>Galileo's Theorem:</strong> The horizontal motion has zero acceleration ($a_x = 0$) in the absence of air drag. The vertical motion has a constant downward gravitational acceleration ($a_y = -g$). These two coordinate dimensions share ONLY one variable: <strong>time ($t$)</strong>.</p>
                                    </div>

                                    <h3>Position and Velocity at any Instant $t$:</h3>
                                    <ul>
                                        <li>Horizontal components: $v_x(t) = u \\cos\\theta$, $x(t) = (u \\cos\\theta)t$</li>
                                        <li>Vertical components: $v_y(t) = u \\sin\\theta - gt$, $y(t) = (u \\sin\\theta)t - \\frac{1}{2}gt^2$</li>
                                    </ul>
                                `
                            },
                            {
                                id: "c11-p-m1-ch2-l2",
                                title: "Deriving Time of Flight, Range, and Max Height",
                                type: "derivation",
                                content: `
                                    <h1>Deriving Projectile Formulae</h1>
                                    <p>Let's systematically derive the three fundamental formulas for standard ground-to-ground projectile trajectories.</p>
                                    
                                    <h3>1. Total Time of Flight ($T$)</h3>
                                    <p>The projectile lands when vertical displacement $y = 0$:</p>
                                    <div class="equation-block">
                                        $$(u \\sin\\theta)T - \\frac{1}{2}gT^2 = 0 \\implies T = \\frac{2u \\sin\\theta}{g}$$
                                    </div>

                                    <h3>2. Maximum Height Achieved ($H$)</h3>
                                    <p>At the peak, vertical velocity $v_y = 0$:</p>
                                    <div class="equation-block">
                                        $$v_y^2 = u_y^2 - 2gH \\implies 0 = (u \\sin\\theta)^2 - 2gH \\implies H = \\frac{u^2 \\sin^2\\theta}{2g}$$
                                    </div>

                                    <h3>3. Horizontal Range ($R$)</h3>
                                    <p>The total horizontal distance covered during the time of flight $T$:</p>
                                    <div class="equation-block">
                                        $$R = u_x \\cdot T = (u \\cos\\theta) \\cdot \\left(\\frac{2u \\sin\\theta}{g}\right)$$
                                        $$R = \\frac{u^2 (2 \\sin\\theta \\cos\\theta)}{g} = \\frac{u^2 \\sin(2\\theta)}{g}$$
                                    </div>

                                    <div class="error-box">
                                        <div class="error-title">⚠️ JEE Trap Alert</div>
                                        <p>The standard range formula $R = \\frac{u^2 \\sin(2\\theta)}{g}$ is valid <strong>ONLY</strong> when the landing height is identical to the launch height. For high cliffs or elevated platforms, you must solve the full quadratic equation for time ($y(t) = -h$).</p>
                                    </div>
                                `
                            },
                            {
                                id: "c11-p-m1-ch2-l3",
                                title: "Interactive Lab: 2D Projectile Sandbox",
                                type: "lab",
                                labType: "projectile",
                                content: `
                                    <h1>Interactive Lab: 2D Projectile Sandbox</h1>
                                    <p>Observe how velocity components compose standard parabolic projectile curves. Adjust initial speed, launch angle, and environmental gravity to observe real-time simulated telemetry readings and flight vectors.</p>
                                    
                                    <div class="tip-box">
                                        <div class="tip-title">🛠️ Physics Laboratory Tasks</div>
                                        <ul>
                                            <li>Observe how launching at exactly $\\theta = 45^\\circ$ yields the maximum horizontal range $R$.</li>
                                            <li>Verify the complementary angle theorem: Complementary launch angles (e.g., $30^\\circ$ and $60^\\circ$) will hit the exact same ground position $R$, though their trajectories and peak heights differ dramatically.</li>
                                        </ul>
                                    </div>
                                `
                            }
                        ]
                    },
                    {
                        id: "c11-p-m1-ch3",
                        title: "Newton's Laws of Motion & Friction",
                        lessons: [
                            {
                                id: "c11-p-m1-ch3-l1",
                                title: "Translational Equilibrium & Free Body Diagrams (FBD)",
                                type: "theory",
                                content: `
                                    <h1>Translational Equilibrium & Free Body Diagrams</h1>
                                    <p>Translational equilibrium represents a physical state where the vector sum of all external forces acting on a point mass is precisely zero:</p>
                                    <div class="equation-block">
                                        $$\\sum \\vec{F} = 0 \\implies \\sum F_x = 0, \\quad \\sum F_y = 0$$
                                    </div>
                                    <p>To evaluate complex mechanical setups (pulleys, inclined planes, wedge constraints), we draw a <strong>Free Body Diagram (FBD)</strong>, isolating the mass and drawing all contact and long-range forces acting directly on it.</p>
                                `
                            },
                            {
                                id: "c11-p-m1-ch3-l2",
                                title: "Static vs Kinetic Friction on Inclined Slopes",
                                type: "theory",
                                content: `
                                    <h1>Static vs Kinetic Friction</h1>
                                    <p>Friction is a self-adjusting contact force that resists relative sliding motion between solid boundaries. It has two main domains:</p>
                                    <ul>
                                        <li><strong>Static Friction ($f_s$):</strong> Exists before motion starts. Adjusts to balance driving forces up to a threshold: $f_s \\le \\mu_s N$.</li>
                                        <li><strong>Kinetic Friction ($f_k$):</strong> Exists during sliding. Constant in magnitude: $f_k = \\mu_k N$.</li>
                                    </ul>
                                    <p>Where $N$ is the normal force, and coefficients satisfy $\\mu_s > \\mu_k$.</p>
                                `
                            }
                        ]
                    }
                ]
            },
            {
                id: "class11-phy-mechanics2",
                title: "Mechanics II: Work, Energy & Rotation",
                badge: "Rotational Mechanics",
                chapterCount: 2,
                lessonCount: 8,
                description: "Conservative systems, work-energy theorems, center of mass collisions, and rigid body angular dynamics.",
                chapters: [
                    {
                        id: "c11-p-m2-ch1",
                        title: "Work-Energy Theorem & Conservation",
                        lessons: [
                            {
                                id: "c11-p-m2-ch1-l1",
                                title: "Conservative Forces & Potential Well Derivations",
                                type: "derivation",
                                content: `
                                    <h1>Conservative Forces & Potential Wells</h1>
                                    <p>A force is conservative if the work done by it in moving a particle between two points is completely independent of the path taken. Gravity and spring forces are conservative, while friction is non-conservative.</p>
                                    <p>We define potential energy $U(x)$ for a conservative force $F(x)$ as:</p>
                                    <div class="equation-block">
                                        $$F(x) = -\\frac{dU}{dx}$$
                                    </div>
                                    <p>Stable equilibrium points occur at local minima of the potential well, where $\\frac{dU}{dx} = 0$ and $\\frac{d^2U}{dx^2} > 0$.</p>
                                `
                            }
                        ]
                    }
                ]
            }
        ],
        chemistry: [
            {
                id: "class11-chem-physical1",
                title: "Physical Chemistry I: Atomic Structure & Bonding",
                badge: "Physical Chemistry",
                chapterCount: 2,
                lessonCount: 8,
                description: "Basic stoichiometry, Bohr model calculations, Schrödinger quantum numbers, and molecular geometries (VSEPR).",
                chapters: [
                    {
                        id: "c11-c-p1-ch1",
                        title: "The Bohr Model & Quantum Mechanics",
                        lessons: [
                            {
                                id: "c11-c-p1-ch1-l1",
                                title: "Deriving Electron Energy Levels in Hydrogen-like Species",
                                type: "derivation",
                                content: `
                                    <h1>Electron Energy Levels in hydrogen-like Atoms</h1>
                                    <p>Bohr modeled the hydrogen atom by balancing centrifugal forces with electrostatic Coulombic attraction, asserting that angular momentum is quantized: $mvr = \\frac{nh}{2\\pi}$.</p>
                                    <p>Solving these constraints yields the radius and energy levels of the $n$-th orbit for an atom with atomic number $Z$:</p>
                                    <div class="equation-block">
                                        $$r_n = 0.529 \\cdot \\frac{n^2}{Z} \\, \\text{Å}$$
                                        $$E_n = -13.6 \\cdot \\frac{Z^2}{n^2} \\, \\text{eV}$$
                                    </div>
                                `
                            }
                        ]
                    }
                ]
            }
        ],
        mathematics: [
            {
                id: "class11-math-calculus1",
                title: "Calculus I: Limits & Continuity",
                badge: "Calculus",
                chapterCount: 2,
                lessonCount: 9,
                description: "Standard limit evaluations, L'Hôpital's Rule, sandwich theorems, and continuity-differentiability parameters.",
                chapters: [
                    {
                        id: "c11-m-c1-ch1",
                        title: "Limits & Indeterminate Forms",
                        lessons: [
                            {
                                id: "c11-m-c1-ch1-l1",
                                title: "Evaluating Indeterminate Limits via Algebra & Expansion",
                                type: "theory",
                                content: `
                                    <h1>Evaluating Indeterminate Limits</h1>
                                    <p>A limit $\\lim_{x \\to a} f(x)$ yields an indeterminate form like $\\frac{0}{0}$ or $\\frac{\\infty}{\\infty}$ when direct substitution is undefined. Standard algebraic techniques to resolve these limits include factoring, rationalizing, and using Taylor series expansions.</p>
                                    
                                    <h3>Common Taylor Series expansions:</h3>
                                    <div class="equation-block">
                                        $$e^x = 1 + x + \\frac{x^2}{2!} + \\frac{x^3}{3!} + \\dots$$
                                        $$\\ln(1+x) = x - \\frac{x^2}{2} + \\frac{x^3}{3} - \\dots$$
                                        $$\\sin x = x - \\frac{x^3}{3!} + \\frac{x^5}{5!} - \\dots$$
                                    </div>
                                `
                            }
                        ]
                    }
                ]
            }
        ]
    },
    class12: {
        physics: [
            {
                id: "class12-phy-electrostatics",
                title: "Electrostatics & Gauss's Law",
                badge: "Electrostatics",
                chapterCount: 2,
                lessonCount: 9,
                description: "Coulomb's Law, electric potential fields, flux evaluations via Gauss's Law, and capacitance capacitors.",
                chapters: [
                    {
                        id: "c12-p-e-ch1",
                        title: "Electric Charges & Coulomb's Law",
                        lessons: [
                            {
                                id: "c12-p-e-ch1-l1",
                                title: "Vector Coulomb Force & Superposition",
                                type: "theory",
                                content: `
                                    <h1>Vector Coulomb Force & Superposition</h1>
                                    <p>Coulomb's Law quantifies the electrostatic force between two stationary point charges $q_1$ and $q_2$ separated by vector $\\vec{r}$:</p>
                                    <div class="equation-block">
                                        $$\\vec{F}_{12} = \\frac{1}{4\\pi\\varepsilon_0} \\frac{q_1 q_2}{r^2} \\hat{r}_{12}$$
                                    </div>
                                    <p>Where $\\varepsilon_0 \\approx 8.854 \\times 10^{-12} \\, \\text{C}^2\\text{N}^{-1}\\text{m}^{-2}$ is the permittivity of free space.</p>
                                `
                            }
                        ]
                    }
                ]
            }
        ],
        chemistry: [
            {
                id: "class12-chem-organic1",
                title: "Organic Chemistry: Carbonyls & Synthesis",
                badge: "Organic Chemistry",
                chapterCount: 2,
                lessonCount: 8,
                description: "Nucleophilic additions, Aldol condensation, Cannizzaro reactions, and comprehensive multi-step synthesis pathways.",
                chapters: [
                    {
                        id: "c12-c-o1-ch1",
                        title: "Aldehydes, Ketones & Condensations",
                        lessons: [
                            {
                                id: "c12-c-o1-ch1-l1",
                                title: "The Aldol Condensation Reaction Mechanism",
                                type: "derivation",
                                content: `
                                    <h1>The Aldol Condensation Mechanism</h1>
                                    <p>Aldol condensation is a crucial carbon-carbon bond forming reaction in organic chemistry. It occurs in aldehydes or ketones containing at least one $\\alpha$-hydrogen under basic conditions.</p>
                                    
                                    <h3>Step 1: Enolate Formation</h3>
                                    <p>A strong base deprotonates the acidic $\\alpha$-carbon, forming a resonance-stabilized enolate anion.</p>
                                    
                                    <h3>Step 2: Nucleophilic Attack</h3>
                                    <p>The nucleophilic enolate attacks the electrophilic carbonyl carbon of another aldehyde/ketone molecule to form a $\\beta$-hydroxycarbonyl compound.</p>
                                    
                                    <h3>Step 3: Dehydration</h3>
                                    <p>Heating in basic or acidic medium results in elimination of water, yielding a conjugated $\\alpha,\\beta$-unsaturated carbonyl product.</p>
                                `
                            }
                        ]
                    }
                ]
            }
        ],
        mathematics: [
            {
                id: "class12-math-calculus2",
                title: "Calculus II: Integrals & Area",
                badge: "Calculus",
                chapterCount: 2,
                lessonCount: 9,
                description: "Definite integrals, Newton-Leibniz integration theorems, area calculations under curves, and differential equations.",
                chapters: [
                    {
                        id: "c12-m-c2-ch1",
                        title: "Definite Integrals & Properties",
                        lessons: [
                            {
                                id: "c12-m-c2-ch1-l1",
                                title: "Evaluating Definite Integrals via Symmetry & Kings Rule",
                                type: "theory",
                                content: `
                                    <h1>King's Rule in Definite Integrals</h1>
                                    <p>In JEE, solving integration queries without algebraic expansion is a major time-saver. <strong>King's Property</strong> is one of the most powerful symmetry rules:</p>
                                    
                                    <div class="equation-block">
                                        $$\\int_{a}^{b} f(x) \\, dx = \\int_{a}^{b} f(a + b - x) \\, dx$$
                                    </div>

                                    <p>By adding the original and symmetrical integral variables together, complex algebraic terms (like trigonometric indices or transcendental denominators) frequently cancel out to yield simple constants.</p>
                                `
                            }
                        ]
                    }
                ]
            }
        ]
    }
};

// Global state tracker for curriculum progress
const PROGRESS_STORE_KEY = "jee_prep_roadmap_progress";

function loadUserProgress() {
    try {
        const stored = localStorage.getItem(PROGRESS_STORE_KEY);
        if (stored) {
            return JSON.parse(stored);
        }
    } catch (e) {
        console.error("Could not load progress", e);
    }
    return {
        completedLessons: {} // maps lessonId -> boolean
    };
}

function saveUserProgress(progress) {
    try {
        localStorage.setItem(PROGRESS_STORE_KEY, JSON.stringify(progress));
    } catch (e) {
        console.error("Could not save progress", e);
    }
}

if (typeof module !== 'undefined' && module.exports) {
    module.exports = { JEE_CURRICULUM, loadUserProgress, saveUserProgress, PROGRESS_STORE_KEY };
}
