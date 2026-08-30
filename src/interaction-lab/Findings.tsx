/**
 * FINDINGS — the reflection pass. Written after building and comparing every
 * experiment. Deliberately opinionated: the point is a recommendation, not a
 * catalogue.
 */
export function Findings() {
  return (
    <div className="lab-find">
      <section>
        <h3>1 · Most aligned with the existing identity</h3>
        <p>
          The site already has one signature move — the left-to-right clip wipe (
          <code>animate-title-lr</code>) — and a restrained tinted-glass language. The experiments
          that extend those, rather than introduce a new vocabulary, sit most naturally:{" "}
          <code>TYPE-01</code> (Wordmark Kinetic),
          <code>TYPE-04</code> (Mask Rise), <code>GLASS-01</code> (Smoked Capsule),{" "}
          <code>GLASS-03</code> (Tint on Approach), <code>IMAGE-02</code> (Directional Mask) and{" "}
          <code>NAV-02</code> (Rolling Labels). <code>INTRO-01</code> is the entrance that reads as
          the same designer.
        </p>
      </section>

      <section>
        <h3>2 · Ideas that improve the site, not just decorate it</h3>
        <ul>
          <li>
            <code>CAROUSEL-01</code> / <code>CAROUSEL-02</code> — the current project-image
            behaviour is weak on phones; a full-width snap carousel with a progress bar and a real
            caption is a usability fix, not a flourish.
          </li>
          <li>
            <code>GLASS-03</code> — project-accent tint on approach makes the accent system (already
            in the data) do visible work on hover, reinforcing which project you are about to open.
          </li>
          <li>
            <code>TRANSITION-01</code> (Image Expand) — turns the project-card → project-page jump
            into an orientation cue instead of a cut.
          </li>
          <li>
            <code>WILD-03</code> (Plan ↔ Perspective) — genuinely useful on architecture projects;
            it shows the representation range in one control.
          </li>
        </ul>
      </section>

      <section>
        <h3>3 · Effects to avoid — they compete with the work</h3>
        <ul>
          <li>
            <code>GLASS-04</code> (Lens Distortion) and <code>GLASS-05</code> (Merge &amp; Split) —
            SVG filters are expensive, fragile across browsers, and draw attention to the control
            rather than the image behind it.
          </li>
          <li>
            <code>IMAGE-05</code> (Cursor Preview Trail) — fun once, noisy on a portfolio; it fights
            the drawings for attention and adds DOM churn.
          </li>
          <li>
            <code>TYPE-06</code> (Proximity Weight) and <code>INTRO-05</code> (Spatial Filmstrip) —
            impressive in isolation but too theatrical for a professional design portfolio, and
            <code>INTRO-05</code> is desktop-only.
          </li>
          <li>Any entrance longer than ~3.5s, or one that repeats every navigation.</li>
        </ul>
      </section>

      <section>
        <h3>4 · Strongest entrance, and why</h3>
        <p>
          <code>INTRO-01</code> (Rapid Reel). It is the cheapest to run (opacity/transform on five
          preloaded images), it uses the real work as the hook, it lands on a frame that already{" "}
          <em>is</em> the homepage image so the handoff is seamless, and it is the only entrance
          whose reduced-motion fallback still feels intentional. <code>INTRO-03</code> (Aperture
          Sequence) is the strong second choice if a more architectural, less editorial read is
          wanted — it also keeps well on mobile.
        </p>
      </section>

      <section>
        <h3>5 · Best on mobile</h3>
        <p>
          <code>CAROUSEL-01</code> (Snap + Progress) and <code>CAROUSEL-02</code> (Full-Bleed
          Sequence) for image browsing; <code>NAV-04</code> (Full-Bleed Menu) for navigation;{" "}
          <code>TYPE-04</code> and <code>IMAGE-02</code> for reveals (clip-path is GPU-cheap and
          touch-safe).
          <code>CAROUSEL-04</code> (Stacked Cards) is a nice-to-have but drag physics need care on
          older devices.
        </p>
      </section>

      <section>
        <h3>6 · Reusable across the site</h3>
        <ul>
          <li>
            A single <code>&lt;MaskReveal&gt;</code> primitive covering <code>TYPE-04</code> and{" "}
            <code>IMAGE-02</code> — one clip-path wipe, direction as a prop.
          </li>
          <li>
            The <code>GLASS-01</code> capsule as a variant of the existing <code>GlassButton</code>{" "}
            (add a <code>capsule</code> and <code>pressure</code> option).
          </li>
          <li>
            One mobile <code>&lt;Carousel&gt;</code> component (<code>CAROUSEL-01</code> engine) to
            replace the current <code>SwipeGallery</code> everywhere.
          </li>
          <li>
            The accent-proximity hook from <code>GLASS-03</code> — reusable on project tiles and
            nav.
          </li>
        </ul>
      </section>

      <section>
        <h3>7–8 · Five highest-impact updates (with identifiers)</h3>
        <table>
          <thead>
            <tr>
              <th>#</th>
              <th>Update</th>
              <th>Identifiers</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>1</td>
              <td>
                Replace the mobile project-image gallery with a snap carousel + progress + caption
              </td>
              <td>
                <code>CAROUSEL-01</code>, <code>CAROUSEL-02</code>, <code>CAROUSEL-05</code>
              </td>
            </tr>
            <tr>
              <td>2</td>
              <td>Add a first-visit entrance (once per session), reduced-motion aware</td>
              <td>
                <code>INTRO-01</code> (fallback <code>INTRO-03</code>)
              </td>
            </tr>
            <tr>
              <td>3</td>
              <td>Project-accent tint on tile / nav hover</td>
              <td>
                <code>GLASS-03</code>
              </td>
            </tr>
            <tr>
              <td>4</td>
              <td>Card → page shared-image transition on project open</td>
              <td>
                <code>TRANSITION-01</code>
              </td>
            </tr>
            <tr>
              <td>5</td>
              <td>Unify title / image reveals on one mask-wipe primitive</td>
              <td>
                <code>TYPE-04</code>, <code>IMAGE-02</code>, <code>TYPE-01</code>
              </td>
            </tr>
          </tbody>
        </table>
      </section>

      <section>
        <h3>9 · Expected cost of each</h3>
        <table>
          <thead>
            <tr>
              <th>Update</th>
              <th>Perf</th>
              <th>Maintenance</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>Mobile carousel</td>
              <td>Negligible — native scroll-snap, no JS animation loop</td>
              <td>Low — one component replaces one component</td>
            </tr>
            <tr>
              <td>Entrance</td>
              <td>Low — 5 preloaded images, ~2.8s, opacity/transform only</td>
              <td>
                Medium — needs a session flag, a skip control, and a reduced-motion path; test on
                slow connections
              </td>
            </tr>
            <tr>
              <td>Accent tint</td>
              <td>
                Negligible — CSS <code>color-mix</code> from a pointer var
              </td>
              <td>Low — accent data already exists</td>
            </tr>
            <tr>
              <td>Card→page transition</td>
              <td>Low — one FLIP transform; watch layout thrash on the measure step</td>
              <td>Medium — couples the grid and the page/panel; needs a fallback if JS is slow</td>
            </tr>
            <tr>
              <td>Mask-wipe primitive</td>
              <td>Negligible — clip-path, GPU-composited</td>
              <td>Low — reduces code by consolidating three ad-hoc reveals</td>
            </tr>
          </tbody>
        </table>
      </section>

      <section>
        <h3>10 · Proposed implementation order</h3>
        <ol>
          <li>
            <b>Mobile carousel</b> — highest user value, lowest risk, no coupling. Ship first.
          </li>
          <li>
            <b>Mask-wipe primitive</b> — small, self-contained, and the other items lean on it.
          </li>
          <li>
            <b>Accent tint on hover</b> — cheap, uses existing data, visible polish.
          </li>
          <li>
            <b>Card → page transition</b> — more integration work; do it once the primitive and
            hover work are settled.
          </li>
          <li>
            <b>Entrance</b> — last, because it needs the most product decisions (frequency, skip,
            connection fallback) and touches the very first impression.
          </li>
        </ol>
        <p
          style={{
            marginTop: 18,
            color: "rgba(255,255,255,0.5)",
            fontStyle: "italic",
            fontFamily: "var(--font-serif, serif)",
          }}
        >
          None of this is applied to the live site. Star what you want in the Shortlist, copy the
          list, and it can be scoped into the real pages from there.
        </p>
      </section>
    </div>
  );
}
