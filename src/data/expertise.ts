/**
 * Expertise areas and the tools inside each.
 *
 * Rendered by `components/Expertise.astro` as a vertical tab list driving a
 * shared tool panel. Adding a tool is one line here; nothing in the component
 * needs to change.
 *
 * ## Icons
 *
 * `icon` is a slug from the Iconify `simple-icons` set, resolved at build time
 * by astro-icon and inlined as SVG. No icon font, no runtime request, no client
 * JavaScript. Browse available slugs at https://simpleicons.org.
 *
 * Leave `icon` off where no brand mark exists (LoRA, NLTK, a concept rather
 * than a product) and the component falls back to a two-letter monogram tile,
 * which keeps the grid aligned rather than leaving a hole.
 */

export interface Tool {
  name: string
  /** Iconify `simple-icons` slug. Omit for a monogram fallback. */
  icon?: string
  /** One short line. Sits under the name, so keep it well under 60 characters. */
  note: string
}

export interface ExpertiseArea {
  /** Used for element ids and the aria-controls relationship. Keep it URL safe. */
  id: string
  label: string
  /** Shown inside the pill when it is open. One or two sentences. */
  blurb: string
  tools: Tool[]
}

export const expertise: ExpertiseArea[] = [
  {
    id: 'machine-learning',
    label: 'Machine learning',
    blurb:
      'The area I want to be working in. Deep learning and NLP day to day, from training models to fine tuning pretrained ones, plus the data work that has to happen before any of it is worth running.',
    tools: [
      { name: 'PyTorch', icon: 'pytorch', note: 'Deep learning, day to day' },
      { name: 'TensorFlow', icon: 'tensorflow', note: 'Model building and training' },
      { name: 'Keras', icon: 'keras', note: 'Fast prototyping of architectures' },
      { name: 'scikit-learn', icon: 'scikitlearn', note: 'Classical models and baselines' },
      { name: 'Transformers', icon: 'huggingface', note: 'Pretrained models and fine tuning' },
      { name: 'LoRA and PEFT', note: 'Fine tuning large models on my own hardware' },
      { name: 'spaCy', icon: 'spacy', note: 'Production NLP pipelines' },
      { name: 'NLTK', note: 'Tokenising, tagging and corpus work' },
      { name: 'pandas', icon: 'pandas', note: 'Wrangling before anything else works' },
      { name: 'NumPy', icon: 'numpy', note: 'The array maths under all of it' },
      { name: 'Matplotlib', note: 'Plots for figuring things out, not for slides' },
      { name: 'Jupyter', icon: 'jupyter', note: 'Where the experiments actually live' },
    ],
  },
  {
    id: 'languages',
    label: 'Languages',
    blurb:
      'Python first and by a distance. Java for systems work, TypeScript across the web stack, and SQL for anything that should be queried rather than guessed at.',
    tools: [
      { name: 'Python', icon: 'python', note: 'First language, day to day' },
      { name: 'TypeScript', icon: 'typescript', note: 'Type safety on top of JavaScript' },
      { name: 'JavaScript', icon: 'javascript', note: 'Backend through to frontend' },
      { name: 'Java', icon: 'openjdk', note: 'Classical OOP with garbage collection' },
      { name: 'SQL', note: 'Querying rather than guessing' },
      { name: 'Swift', icon: 'swift', note: 'iOS and macOS development' },
    ],
  },
  {
    id: 'interfaces',
    label: 'Interfaces',
    blurb:
      'React and Vue, with hand written CSS when a design needs precision that utility classes make awkward. Canvas for generative and data driven visuals.',
    tools: [
      { name: 'React', icon: 'react', note: 'Library for building UIs' },
      { name: 'React Native', icon: 'react', note: 'Native mobile from one codebase' },
      { name: 'Expo', icon: 'expo', note: 'Streamlines iOS and Android builds' },
      { name: 'Vue', icon: 'vuedotjs', note: 'Reactive components' },
      { name: 'Astro', icon: 'astro', note: 'Static sites that ship no JavaScript' },
      { name: 'Spring Boot', icon: 'springboot', note: 'Java framework for rapid development' },
      { name: 'Express', icon: 'express', note: 'Small Node services and APIs' },
      { name: 'Canvas', note: 'Generative and data driven visuals' },
    ],
  },
  {
    id: 'infrastructure',
    label: 'Infrastructure',
    blurb:
      'Reproducible environments and pipelines that run without me. Docker so a project starts the same way on any machine, GitHub Actions so testing and deployment are not a manual step.',
    tools: [
      { name: 'Docker', icon: 'docker', note: 'Reproducible environments' },
      { name: 'GitHub Actions', icon: 'githubactions', note: 'CI and deployment pipelines' },
      { name: 'Git', icon: 'git', note: 'Version control and review' },
      { name: 'Linux', icon: 'linux', note: 'Enough to keep a server honest' },
      { name: 'PostgreSQL', icon: 'postgresql', note: 'Relational data that has to hold up' },
      { name: 'Jest', icon: 'jest', note: 'Testing the logic that matters' },
    ],
  },
]
