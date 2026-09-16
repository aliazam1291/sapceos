// Every value here is transcribed from PROFILE.md. Nothing is inferred.

export const profile = {
  name: "Ali Azam Kazmi",
  title: "Product Engineer & UX Strategist",
  currentRole: "Associate Software Developer, Product & Platform",
  currentOrg: "MapMyIndia [Gtropy]",
  location: "New Delhi, India",
  email: "aliazamkazmi1291@gmail.com",
  calendly: "https://calendly.com/aliazamkazmi",
  languages: ["English", "Hindi"],
  oneLine: "Give me a problem. I'll figure out what to do next.",
};

/**
 * How Ali works — the mindset, as four principles. Editorial framing of the
 * core story in PROFILE.md; every `evidence` line is a fact from that file.
 */
export const principles = [
  {
    title: "Decide what matters first.",
    body: "Most delays are not build problems. They are a decision nobody has made yet.",
    evidence: "Defined vehicle status logic, alarm, geofence and ticketing workflows before they were built.",
  },
  {
    title: "Write it down before building it.",
    body: "A PRD is not paperwork. It is the argument, made early enough to be wrong cheaply.",
    evidence: "Authored full PRDs — problem statements, user stories, acceptance criteria, edge cases.",
  },
  {
    title: "Learn whatever the problem needs.",
    body: "Frontend one week, a pitch deck the next. The tool is chosen by the problem, not the résumé.",
    evidence: "Angular, React, Ionic, D3, geospatial pipelines — and a design studio on the side.",
  },
  {
    title: "Ship, then look at what happened.",
    body: "A shipped thing teaches more than a perfect plan. The loop ends in learn, then starts again.",
    evidence: "5+ live production projects; ~40% dashboard speed-up found after shipping, not before.",
  },
];

/**
 * The operating loop, one beat per step. `line` is editorial; `evidence` is a
 * fact from PROFILE.md that shows the step actually happening.
 */
export const operatingLoop = [
  {
    step: "Problem",
    line: "Find the decision nobody has made yet.",
    evidence: "Mappls Shop Admin: billing was manual, and the real work was finding every place a human was quietly deciding.",
  },
  {
    step: "Understand",
    line: "Who feels it, what the system must insist on.",
    evidence: "Technician App: installation, replacement and rectification are three different jobs wearing the same uniform.",
  },
  {
    step: "Strategy",
    line: "Decide what matters first.",
    evidence: "Vehicle status logic — moving, stopped, idle, delayed, offline — defined before anything was built.",
  },
  {
    step: "UX",
    line: "Design for the hand, the signal and the daylight.",
    evidence: "Map UX: rotation, fit-to-route, route playback. Alarm, geofence and ticketing workflows.",
  },
  {
    step: "Technology",
    line: "The tool the problem needs, not the one on the résumé.",
    evidence: "React, Angular, Ionic, RxJS, D3, Mappls SDK — and a 30,000-route geospatial pipeline into S3.",
  },
  {
    step: "Build",
    line: "Own the frontend end to end.",
    evidence: "Frontend owned on nine of ten missions; UI/UX on six; the PRD on the active ones.",
  },
  {
    step: "Ship",
    line: "Live, in production, with real users on it.",
    evidence: "5+ live projects. Vahan Shakti, Intouch and Indane Yatra Mitra on the Play Store.",
  },
  {
    step: "Learn",
    line: "Look at what happened. Then start again.",
    evidence: "~40% dashboard speed-up — found after shipping, from caching, RxJS and API work.",
  },
];

/** Smaak.ux clients, with the logos carried over from the previous site. */
export const studioClients = [
  { name: "Atmos", work: "Brand identity", logo: "/logos/atmos.png" },
  { name: "Mintair", work: "Investor pitch deck", logo: "/logos/mintair.svg" },
  { name: "Ravenouxs", work: "Responsive website", logo: "/logos/ravenouxs.webp" },
  { name: "Lean Multiverse", work: "Brand identity + web UI · 600K+ followers", logo: "/logos/leanmultiverse.svg" },
  { name: "Ekal", work: "Brand identity, pitch decks", logo: "/logos/ekal.png" },
  { name: "Urban Livin", work: "Product catalogues", logo: "/logos/urbanlivin.png" },
  { name: "Sorted Blinds", work: "Website · Australia", logo: "/logos/sortedblinds.png" },
  { name: "Posh Dikur", work: "Marketing creatives", logo: "/logos/poshdikur.png" },
];

/** What is on the desk right now — from the ACTIVE list in PROFILE.md. */
export const currently = "Building the Technician App end to end; replacing manual billing at Mappls Shop Admin.";

export const links = [
  { label: "GitHub", href: "https://github.com/aliazam1291" },
  { label: "LinkedIn", href: "https://linkedin.com/in/ali-azam-kazmi" },
  { label: "Behance", href: "https://www.behance.net/aliak8" },
  { label: "Figma", href: "https://www.figma.com/@aliak" },
  { label: "Medium", href: "https://medium.com/@aliazamkazmi1291" },
  { label: "HackerRank", href: "https://www.hackerrank.com/profile/aliazamkazmi1291" },
  { label: "Credly", href: "https://www.credly.com/users/ali-azam-kazmi/badges" },
  { label: "Holopin", href: "https://www.holopin.io/@aliazam1291" },
];

export const experience = [
  {
    org: "MapMyIndia [Gtropy]",
    role: "Associate Software Developer — Product & Platform",
    period: "Sep 2024 — present",
    place: "New Delhi",
    points: [
      "Built and scaled enterprise fleet and telematics platforms: Vahan Shakti (government, 200,000+ users), OEM platforms (20,000+ users), fleet operators (10,000+ vehicles).",
      "5+ live production projects; owned operational and analytics dashboards covering vehicle health, trips, delays, alerts and compliance.",
      "~40% performance improvement on data-heavy dashboards through caching, RxJS state management and API optimisation.",
      "Defined vehicle status logic — moving, stopped, idle, delayed, offline — plus map UX for rotation, fit-to-route and route playback, and the alarm, geofence and ticketing workflows.",
      "Authored full PRDs: problem statements, user stories, acceptance criteria, edge cases.",
    ],
  },
  {
    org: "Smaak.ux",
    role: "Founder & Product Designer",
    period: "2023 — present",
    place: "Remote",
    points: [
      "Product and design studio. 10+ clients across SaaS, creator brands, e-commerce, home décor and services.",
      "Clients: Atmos (brand identity), Mintair (investor pitch deck), Ravenouxs (responsive website), Lean Multiverse (brand identity and web UI for a creator-led brand with 600K+ followers), Ekal (brand identity, pitch decks), Urban Livin (product catalogues), Sorted Blinds (website, Australia), Posh Dikur (marketing creatives).",
    ],
  },
  {
    org: "Wise Work",
    role: "Full Stack Intern",
    period: "Feb — Dec 2023",
    place: "Remote",
    points: ["React.js, scalable UI components, REST API integration."],
  },
  {
    org: "Datamatics",
    role: "R&D Project Intern",
    period: "Jun — Aug 2023",
    place: "Mumbai",
    points: [
      "AI-driven OCR — +30% data extraction accuracy.",
      "UX research and usability testing — +15% task completion.",
    ],
  },
  {
    org: "Green Monk Energy",
    role: "Student Brand Ambassador, Chennai Lead",
    period: "Sep 2022 — Apr 2023",
    place: "Chennai",
    points: [],
  },
  {
    org: "Tech Analogy",
    role: "Graphic Designer Intern",
    period: "Jan — Feb 2023",
    place: "Remote",
    points: [],
  },
];

export const education = {
  degree: "B.Tech, Computer Science Engineering",
  school: "SRM Institute of Science and Technology, Chennai",
  detail: "CGPA 8.76 / 10.0",
  period: "Aug 2020 — Jun 2024",
};

export const leadership = [
  {
    role: "Technical Convener, Directorate of Student Affairs",
    org: "SRMIST",
    period: "Sep 2022 — May 2024",
    detail:
      "Directed Milan, a national cultural festival with 20,000+ attendees. Managed a 50+ member cross-functional team.",
  },
  {
    role: "Vice President",
    org: "Alexa Developers SRM",
    period: "Nov 2020 — May 2024",
    detail:
      "10+ technical events and hackathons. The flagship UI/UX workshop drew 300+ participants.",
  },
];

export const achievements = [
  "Won the GitHub SRM Ideathon for an innovative product concept.",
  "Led a UI/UX workshop for 300+ participants.",
  "Recognised for leading a 50-person core team on a national event with 20,000+ registrations.",
];

export const certifications = [
  { name: "AWS Academy Machine Learning Foundations", issuer: "AWS", date: "Jun 2023", image: "/certificates/aws-ml.png" },
  { name: "AWS Academy Cloud Foundations", issuer: "AWS", date: "May 2023", image: "/certificates/aws-cloud.png" },
  { name: "Conduct UX Research and Test Early Concepts", issuer: "Google", date: "Mar 2023", image: "/certificates/ux-research.png" },
  { name: "Build Wireframes and Low-Fidelity Prototypes", issuer: "Google", date: "Feb 2023", image: "/certificates/low-fidelity-prototypes.png" },
  { name: "Start the UX Design Process", issuer: "Google", date: "Feb 2023", image: "/certificates/ux-process.png" },
  { name: "Foundations of User Experience (UX) Design", issuer: "Google", date: "Jan 2023", image: "/certificates/ux-foundations.png" },
  { name: "Blockchain Basics", issuer: "University at Buffalo", date: "Nov 2022", image: "/certificates/blockchain-basics.png" },
  { name: "Technical Product Management", issuer: "Aha!", date: "—" },
];

export const skills = [
  {
    group: "Technical",
    items: [
      "JavaScript", "TypeScript", "React", "Next.js", "Angular", "Ionic", "Node.js",
      "Nest.js", "Spring Boot", "Java", "Python", "C++", "RxJS", "D3.js", "Three.js",
      "Mappls SDK", "OpenCV", "TensorFlow", "MongoDB", "MySQL", "REST APIs", "AWS S3",
    ],
  },
  {
    group: "Design",
    items: [
      "Figma", "Spline", "Adobe Suite", "Wireframing", "Prototyping", "UX research",
      "User flow design", "Interaction design", "Usability testing",
    ],
  },
  {
    group: "Product",
    items: [
      "PRD writing", "User story mapping", "Roadmapping", "A/B testing", "Prioritisation",
      "Competitive analysis", "Agile / Scrum", "Stakeholder management", "SEO & growth",
    ],
  },
];
