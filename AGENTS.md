<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

---

## Frontend Engineering Standards (Skrap UI)

These standards are mandatory for all UI work in this repository.

### Primary skills (always apply when relevant)

1. **`nextjs-app-router-patterns`**
   - Path: `/Users/furkan/.agents/skills/nextjs-app-router-patterns/SKILL.md`
   - Default to Server Components; use Client Components only for interactivity.
   - Follow App Router conventions (`layout.tsx`, `loading.tsx`, `error.tsx`, route handlers, metadata).
   - Use Suspense/streaming boundaries for slow data paths.
   - Keep server actions and route handlers explicit, typed, and secure.

2. **`vercel-react-best-practices`**
   - Path: `/Users/furkan/.agents/skills/vercel-react-best-practices/SKILL.md`
   - Prioritize waterfall elimination and bundle size reduction first.
   - Use stable state patterns (`functional setState`, clean dependencies, memo where needed).
   - Keep rendering cheap and predictable; avoid accidental re-renders.
   - Prefer clear async orchestration (`Promise.all`, start early / await late).

3. **`framer-motion-animator`**
   - Path: `/Users/furkan/.agents/skills/framer-motion-animator/SKILL.md`
   - Motion should communicate state changes (loading, success, error, transitions), not decoration.
   - Prefer transform/opacity animations; avoid layout-thrashing properties.
   - Include reduced-motion support for meaningful animations.
   - Use polished microinteractions for action buttons and state transitions.

4. **`impeccable`**
   - Path: `/Users/furkan/.agents/skills/impeccable/SKILL.md`
   - Maintain a simple, sleek, production-grade UI quality bar.
   - Avoid generic AI-looking patterns; be intentional with spacing, hierarchy, and typography.
   - Keep visual language cohesive with existing app design and brand tone.
   - Preserve usability and accessibility while adding refinement.

### Supporting skills (use as needed)

- **`next-best-practices`**: for Next.js conventions and boundary hygiene.
- **`uncodixfy`**: to avoid generic output and enforce intentional UI patterns.
- **`adapt`**: for responsive behavior across mobile and desktop.
- **`harden`**: for edge cases, overflow safety, and robust UI states.
- **`polish`**: for final UX/UI refinement before completion.

### Implementation guardrails

- Do not rewrite unrelated code when implementing a feature.
- Prefer modular components, extracted business logic, and typed utilities over monolithic files.
- Reusable patterns (alerts, modals, action controls, animations) should live in shared UI/feature modules.
- Keep interactions deterministic: loading, success, and error states must be explicit.
- Favor clean code over clever code; optimize for readability and maintainability.
