export default function NewsletterSignupSection() {
  return (
    <section className="newsletter" id="newsletter">
      <div>
        <h2>Join the studio letter</h2>
        <p>
          Get quarterly notes on upcoming programs, new recordings, and behind-the-scenes stories
          from Gary’s collaborations with composers, dancers, and filmmakers.
        </p>
      </div>
      <form
        className="newsletter-form"
        aria-label="Newsletter sign up"
        onSubmit={(event) => event.preventDefault()}
      >
        <label htmlFor="newsletter-email" className="visually-hidden">
          Email address
        </label>
        <input
          id="newsletter-email"
          type="email"
          name="email"
          placeholder="you@example.com"
          autoComplete="email"
        />
        <button type="submit">Notify me</button>
      </form>
    </section>
  )
}
