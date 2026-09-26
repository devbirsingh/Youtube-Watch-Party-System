import React from "react";
import CreateCard from "../components/CreateCard";
import HomeHeader from "../components/HomeHeader";
import JoinCard from "../components/JoinCard";

export default function HomePage({ user, onEnterRoom }) {
  return (
    <div className="app-shell home-shell">
      <HomeHeader />

      <main className="home-main">
        <section className="hero-copy">
          <div className="hero-badge">
            <span /> Real-time watch party
          </div>

          <h2>
            One room.
            <br />
            <em>One timeline.</em>
            <br />
            Everyone together.
          </h2>

          <p>
            Shared YouTube playback with live roles, room controls, and instant
            synchronization.
          </p>
        </section>

        <section className="home-cards">
          <CreateCard user={user} onEnterRoom={onEnterRoom} />
          <JoinCard user={user} onEnterRoom={onEnterRoom} />
        </section>
      </main>
    </div>
  );
}
