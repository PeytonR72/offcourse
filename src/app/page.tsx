import Link from "next/link";
import Image from "next/image";
import { Practice } from "./practice";
import { StarChart } from "./star-chart";
import { FlightIcon } from "./flight-icon";
import { flightInstructions, site } from "../data/site";

export default function Home() {
  return (
    <main id="main-content" tabIndex={-1} className="home-page">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "VideoGame",
            name: site.name,
            url: site.url,
            description: site.description,
            image: `${site.url}/opengraph-image`,
            inLanguage: "en",
            isAccessibleForFree: true,
            gamePlatform: "Web browser",
            playMode: "SinglePlayer",
          }),
        }}
      />
      <section className="launchpad" aria-labelledby="home-title">
        <Image
          src="/art/observatory.webp"
          alt=""
          fill
          sizes="100vw"
          loading="eager"
          fetchPriority="high"
          className="observatory-art"
        />
        <div className="launchpad-scrim" aria-hidden="true" />
        <div className="hero-copy">
          <p className="hero-kicker">
            <span /> A COSMIC GAME OF HUMAN INTUITION <span />
          </p>
          <h1 id="home-title">Offcourse</h1>
          <p className="hero-description">{site.introduction}</p>
        </div>
        <StarChart />
        <div className="mission-select-heading">
          <span />
          Choose your expedition
          <span />
        </div>
        <div className="mission-select">
          <Link href="/daily" className="mission-card mission-daily">
            <div className="mission-top">
              <span className="mission-emblem">
                <FlightIcon kind="sun" />
              </span>
              <span>THE DAILY FIVE</span>
              <span className="mission-tag">New every day</span>
            </div>
            <h2>Daily Expedition</h2>
            <p>
              Five questions. One shared journey. A new corner of the cosmos,
              every day.
            </p>
            <div className="mission-launch">
              <span>Launch Daily Expedition</span>
              <FlightIcon kind="arrow" />
            </div>
            <div className="mission-facts">
              <span className="destination-dots" aria-label="5 destinations">
                <i />
                <i />
                <i />
                <i />
                <i />
              </span>
              <span>Up to 500 light-years</span>
            </div>
          </Link>
          <Link href="/endless" className="mission-card mission-endless">
            <div className="mission-top">
              <span className="mission-emblem">
                <FlightIcon kind="infinity" />
              </span>
              <span>GO THE DISTANCE</span>
            </div>
            <h2>Endless Voyage</h2>
            <p>
              Stay within 10 points to keep flying. One little ship. See how far
              you can go.
            </p>
            <div className="mission-launch">
              <span>Launch Endless Voyage</span>
              <FlightIcon kind="arrow" />
            </div>
            <div className="mission-facts">
              <span>One life</span>
              <span>Chase your best streak</span>
            </div>
          </Link>
        </div>
        <div className="launchpad-note">
          <span className="status-dot" />
          <strong>Illustrative results</strong>
          <span>Percentages are simulated, not real crowd votes.</span>
        </div>
        <a href="#how-to-play" className="how-link">
          First time here? <span>How to play</span>
          <span aria-hidden="true">↓</span>
        </a>
      </section>
      <section
        id="how-to-play"
        className="flight-guide"
        aria-labelledby="guide-title"
      >
        <div className="guide-heading">
          <FlightIcon />
          <h2 id="guide-title">
            Your intuition <br />
            is the fuel.
          </h2>
          <p>
            No trivia to memorize. <br />
            Just a feel for other humans.
          </p>
        </div>
        <ol>
          {flightInstructions.map((step, i) => (
            <li key={step.title}>
              <span className="step-number">0{i + 1}</span>
              <h3>{step.title}</h3>
              <p>{step.text}</p>
            </li>
          ))}
        </ol>
      </section>
      <section
        id="practice"
        className="practice-section"
        aria-labelledby="practice-title"
      >
        <div className="practice-intro">
          <span className="section-label">THE TRAINING GROUND</span>
          <h2 id="practice-title">
            Take a <br />
            test flight.
          </h2>
          <p>
            A little room to find your bearings. Try the controls, trust your
            instinct, and watch your rocket find its way.
          </p>
          <div className="practice-rule">
            <FlightIcon kind="orbit" />
            <p>
              <strong>Closer guesses. Longer journeys.</strong>
              <br />A perfect prediction earns 100 light-years. Every point of
              error takes off 5.
            </p>
          </div>
          <p className="practice-note">
            Practice percentages are simulated, not real crowd votes. No ranked
            score is recorded.
          </p>
          <Link href="/daily" className="text-link">
            Ready for the daily? <FlightIcon kind="arrow" />
          </Link>
        </div>
        <div className="practice-console">
          <Practice />
        </div>
      </section>
      <div className="demo-status">
        <span className="status-dot" />
        <span>Prototype in progress</span>
        <span>Made for curious humans. No account needed.</span>
      </div>
    </main>
  );
}
