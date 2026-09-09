import { useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import { gsap } from "../../animations/gsap";
import "../../styles/landing.css";

function Landing() {
  const heroRef = useRef(null);
  const eyebrowRef = useRef(null);
  const titleRef = useRef(null);
  const descriptionRef = useRef(null);
  const buttonRef = useRef(null);
  const footerRef = useRef(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      const timeline = gsap.timeline({
        defaults: {
          ease: "power4.out",
        },
      });

      timeline
        .fromTo(
          eyebrowRef.current,
          {
            opacity: 0,
            y: 20,
          },
          {
            opacity: 1,
            y: 0,
            duration: 0.8,
          }
        )
        .fromTo(
          titleRef.current,
          {
            opacity: 0,
            y: 80,
          },
          {
            opacity: 1,
            y: 0,
            duration: 1.2,
          },
          "-=0.4"
        )
        .fromTo(
          descriptionRef.current,
          {
            opacity: 0,
            y: 30,
          },
          {
            opacity: 1,
            y: 0,
            duration: 0.8,
          },
          "-=0.6"
        )
        .fromTo(
          buttonRef.current,
          {
            opacity: 0,
            y: 20,
          },
          {
            opacity: 1,
            y: 0,
            duration: 0.7,
          },
          "-=0.4"
        )
        .fromTo(
          footerRef.current,
          {
            opacity: 0,
          },
          {
            opacity: 1,
            duration: 0.8,
          },
          "-=0.3"
        );
    }, heroRef);

    return () => ctx.revert();
  }, []);

  return (
    <main ref={heroRef} className="landing">
      <div className="landing-grid" />

      <header className="landing-nav">
        <div className="landing-logo">
          <span className="logo-dot" />
          CRIMEGRAPH AI
        </div>

        <div className="landing-nav-right">
          <span className="mono nav-status">
            SYSTEM / ONLINE
          </span>

          <Link to="/dashboard" className="nav-enter">
            ENTER SYSTEM
            <span>↗</span>
          </Link>
        </div>
      </header>

      <section className="landing-hero">
        <div ref={eyebrowRef} className="landing-eyebrow mono">
          <span>01</span>
          AI-POWERED CRIMINAL INTELLIGENCE
        </div>

        <h1 ref={titleRef} className="landing-title">
          <span>CRIMINAL</span>
          <span>NETWORK</span>
          <span className="title-outline">ANALYSIS</span>
        </h1>

        <div className="landing-bottom">
          <p ref={descriptionRef} className="landing-description">
            Discover hidden relationships, entities and patterns
            inside complex criminal investigations through
            artificial intelligence and graph analysis.
          </p>

          <Link
            ref={buttonRef}
            to="/dashboard"
            className="landing-button"
          >
            <span>ENTER INTELLIGENCE SYSTEM</span>
            <span className="button-arrow">→</span>
          </Link>
        </div>
      </section>

      <footer ref={footerRef} className="landing-footer">
        <span>GRAPH ANALYSIS</span>
        <span>AI FORENSICS</span>
        <span>ENTITY RESOLUTION</span>
        <span>2026</span>
      </footer>
    </main>
  );
}

export default Landing;