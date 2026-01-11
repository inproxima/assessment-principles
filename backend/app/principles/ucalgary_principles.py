from __future__ import annotations

from dataclasses import dataclass


@dataclass(frozen=True)
class Principle:
    id: str  # a..k
    title: str
    description: str
    examples: list[str]
    resources: list[str]


PRINCIPLES: list[Principle] = [
    Principle(
        id="a",
        title="Assessment meaningfully supports student learning and growth, is grounded in disciplinary context and highlights applicability and relevance.",
        description=(
            "Effective assessment focuses on helping students learn and grow by using real-world tasks, encouraging reflection on learning, "
            "offering different ways to show knowledge, providing practice with feedback, and connecting assignments to future goals and careers."
        ),
        resources=[
            "Learning Module: Designing Student Assessments",
            "Alternative Online Assessments",
        ],
        examples=[
            "Using case studies for projects or exams",
            "Including reflective or metacognitive elements that ask students to articulate their learning",
            "Partnering with community organizations for service-learning assessments",
        ],
    ),
    Principle(
        id="b",
        title="Assessment practices demonstrate alignment within the curriculum of the course and program, progressively building upon and reflecting student learning, skills, and competencies throughout their academic journey.",
        description=(
            "Assessments support course learning outcomes aligned to program goals, forming a planned learning experience. As students advance, "
            "assessments become progressively more challenging, building on prior knowledge and providing a cumulative picture of growth."
        ),
        resources=[
            "Connecting Academic Integrity and Quality Assurance",
            "Critical reflection assessment",
        ],
        examples=[
            "Clearly linking assessments to course- and program-level learning outcomes",
            "Designing capstone projects that integrate learning from multiple courses",
            "Focusing on competence-based assignments, tasks and quizzes",
        ],
    ),
    Principle(
        id="c",
        title="Assessment cultivates a shared and ethical space that respects written and oral traditions and honours diverse Indigenous cultural protocols, perspectives and knowledges.",
        description=(
            "Assessment aligns with UCalgary’s ii' taa'poh'to'p Indigenous Strategy by creating shared ethical space and respecting parallel oral and written traditions. "
            "Courses affirm Indigenous cultural protocols, perspectives and knowledges, and support iterative opportunities to build cumulative learning over time."
        ),
        resources=[
            "Indigenous Academic Integrity",
            "Indigenous Ways of Knowing Course Design",
        ],
        examples=[
            "Using the Faculty of Graduate Studies Indigenous Cultural Protocol Plan for candidacy and oral exams",
            "Following the principles of Indigenous academic integrity",
            "Ensuring appropriate cultural protocols are followed when working with Indigenous Knowledge Keepers and Elders",
        ],
    ),
    Principle(
        id="d",
        title="Assessments are designed to be fair, equitable and inclusive for diverse educators and learners, and provide multiple ways for students to engage with learning.",
        description=(
            "Assessments are fair, equitable, and inclusive, guided by Universal Design for Learning (UDL). They offer flexible ways to demonstrate learning "
            "through varied formats (e.g., projects, infographics, podcasts, oral presentations) to support all students."
        ),
        resources=[
            "Learning Module: Universal Design for Learning",
            "Incorporating Universal Design for Learning in Disciplinary Contexts in Higher Education.",
        ],
        examples=[
            "Including a variety of assessment forms: written quizzes, oral presentations, demonstrations",
            "Including peer engagement: group projects, peer feedback",
            "Discussing assessments in class as well as providing written description",
        ],
    ),
    Principle(
        id="e",
        title="Assessments actively engage students by offering multiple opportunities for practice; timely, clear, and meaningful feedback; and structured reflection on their learning to continuously improve and enhance future learning.",
        description=(
            "Assessments invite students to treat learning as process and outcome, viewing errors as milestones. They include multiple opportunities for practice, "
            "timely and meaningful feedback, and structured reflection to apply learning to subsequent tasks."
        ),
        resources=[
            "Consistent and Effective Grading",
            "Metacognition in Teaching and Learning Activities: Student assessment and metacognitive activities",
        ],
        examples=[
            "Providing practice quizzes on D2L",
            "Breaking large projects into smaller tasks with feedback and revision opportunities",
            "Including student self-assessment activities using task criteria",
        ],
    ),
    Principle(
        id="f",
        title="Communications about assessments are transparent and designed to ensure clarity on the policies, purpose, tasks, grading standards, and criteria by which students will be assessed.",
        description=(
            "Transparent communication ensures students understand the purpose, tasks, policies, and criteria. Expectations and guidance are established early, "
            "including late/incomplete work policies, and tools like outlines, rubrics, checklists, and exemplars clarify what success looks like."
        ),
        resources=[
            "Transparent Assignment Instructions Template",
            "Five Principles for Meaningful Online Assessment",
            "Design Decisions for Exams",
        ],
        examples=[
            "Making office hours available specifically for questions about assessments",
            "Ensuring grading consistency among teaching assistants and instructors",
            "Providing criteria via a checklist, description, or rubric",
        ],
    ),
    Principle(
        id="g",
        title="Assessments consider the mental health and wellbeing of students and educators by recognizing the human and systemic contexts.",
        description=(
            "Assessments are designed with commitment to student and educator wellbeing, considering workload, class size, and resources. Wellness-focused practices "
            "include avoiding clustered deadlines, staged submissions, grace periods, and late banks to make learning manageable."
        ),
        resources=[
            "Using Mental Health and Wellness as a Framework for Teaching and Learning",
            "Reflecting on Well-Being and Assessment Practices Using an Ethics-of-Care Lens",
        ],
        examples=[
            "Using late banks for course-level assessments",
            "Spacing out assessments to allow grading and feedback time",
            "Surveying students and teaching assistants about workload and adjusting plans",
        ],
    ),
    Principle(
        id="h",
        title="Assessments uphold the values, principles, and practices of academic integrity.",
        description=(
            "Assessments center academic integrity as ethical learning grounded in care, honesty, and trust. Guidance focuses on creating supportive learning culture "
            "and proactively teaching ethical conduct rather than policing misconduct."
        ),
        resources=[
            "What to Know about Academic Integrity when Designing Assessments Online",
            "Academic Integrity in Large Classes",
        ],
        examples=[
            "Regular conversations with students about integrity principles and values",
            "Making expectations about AI use explicit and specific for each assessment",
            "Including process-based assessments: research logs, multiple drafts",
        ],
    ),
    Principle(
        id="i",
        title="Educators and students use educational technologies ethically in assessment and feedback practices, and take proactive measures to mitigate barriers, adverse impacts, and biases.",
        description=(
            "Educational technologies (including generative AI) should be used ethically and responsibly. Instructors and students co-define appropriate use to promote "
            "fair opportunities, reduce barriers, and mitigate adverse impacts and biases."
        ),
        resources=[
            "Teaching and Learning with Artificial Intelligence Apps",
            "Exploring Artificial Intelligence and Assessments",
        ],
        examples=[
            "Providing explicit instructions around AI use (e.g., AI Assessment Scale)",
            "Encouraging technology to reduce barriers (speech-to-text, text-to-speech)",
            "Designing D2L quizzes that provide feedback on incorrect answers",
        ],
    ),
    Principle(
        id="j",
        title="Assessments inform administrative and curricular processes, including quality assurance and alignment with professional accreditation standards, to continuously enhance educational quality and student success.",
        description=(
            "Assessments reflect learning at course level and inform curriculum review and accreditation at program level. Consistency and student voice make assessment "
            "a collaborative tool for continuous improvement of educational quality and student success."
        ),
        resources=[
            "Guide to Curriculum Review",
        ],
        examples=[
            "Including a course-level curriculum map in the course outline",
            "Collaborating on consistent assessments in multi-section courses",
            "Including a focus on assessments in program-level reviews",
        ],
    ),
    Principle(
        id="k",
        title="Organizational policies, processes, supports, professional learning, and digital and physical infrastructure sustainably support the assessment ecosystem.",
        description=(
            "A sustainable assessment culture relies on policies, resources, and supports. Learning environments should be accessible and welcoming, with adequate "
            "human/professional resources, workload considerations, and TA support to enable meaningful assessment at scale."
        ),
        resources=[
            "Resource Guide for Teaching Academic Courses at UCalgary",
        ],
        examples=[
            "Organizing lunch and learns on assessment strategies for those who teach and grade",
            "Providing meaningful support for teaching assistants participating in assessment",
            "Encouraging students to access institutional supports (writing, time management, academic support)",
        ],
    ),
]


def get_principle(principle_id: str) -> Principle:
    for p in PRINCIPLES:
        if p.id == principle_id:
            return p
    raise KeyError(f"Unknown principle_id: {principle_id}")

