export default function RecordingsEducationSection() {
  return (
    <section className="content-grid" id="recordings">
      <article>
        <h2>Latest recordings</h2>
        <ul className="feature-list">
          <li>
            <h3>"Northern Lights"</h3>
            <p>
              Atmospheric piano works inspired by Nordic folklore, featuring collaborations with
              string quartet Pulse.
            </p>
          </li>
          <li>
            <h3>"Stories in Transit"</h3>
            <p>
              A live album captured during the 2024 Rail Lines residency, blending improvisation with
              commuter soundscapes.
            </p>
          </li>
          <li>
            <h3>"Field Notes"</h3>
            <p>
              Commissioned pieces for wind ensemble documenting national park sound walks with
              student composers.
            </p>
          </li>
        </ul>
      </article>
      <article id="education">
        <h2>Studio resources</h2>
        <p>
          Access curriculum guides, repertoire suggestions, and rehearsal exercises crafted from
          decades of teaching in conservatories and community programs.
        </p>
        <ul className="feature-list">
          <li>Weekly warm-up sequences for mixed-ability ensembles</li>
          <li>Improvisation prompts for student composers</li>
          <li>Lesson plans that connect repertoire to local history</li>
        </ul>
      </article>
    </section>
  )
}
