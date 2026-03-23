"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { createClient } from "../utils/supabase/client";
import type { User } from "@supabase/supabase-js";

type Game = {
  id: number;
  opponent: string;
  date: string;
  is_home: boolean;
};

type Listing = {
  id: number;
  game_id: number;
  opponent: string;
  price: string;
  quantity: string;
  email: string;
  user_id: string | null;
  status: "available" | "sold";
};

function formatDate(dateString: string) {
  const date = new Date(`${dateString}T00:00:00`);
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
}

function NavBar({
  user,
  onSignOut,
}: {
  user: User | null;
  onSignOut: () => void;
}) {
  return (
    <div
      style={{
        maxWidth: 700,
        margin: "0 auto 20px auto",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        gap: 12,
      }}
    >
      <Link
        href="/"
        style={{
          textDecoration: "none",
          color: "#111",
          fontWeight: 700,
          fontSize: 18,
        }}
      >
        Ticket Pool
      </Link>

      <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
        <Link
          href="/"
          style={{
            textDecoration: "none",
            color: "#111",
            background: "white",
            border: "1px solid #ddd",
            padding: "10px 14px",
            borderRadius: 10,
            fontWeight: 600,
            fontSize: 14,
          }}
        >
          Home
        </Link>

        <Link
          href="/my-listings"
          style={{
            textDecoration: "none",
            color: "#111",
            background: "white",
            border: "1px solid #ddd",
            padding: "10px 14px",
            borderRadius: 10,
            fontWeight: 600,
            fontSize: 14,
          }}
        >
          My Listings
        </Link>

        {user ? (
          <button
            onClick={onSignOut}
            style={{
              background: "#111",
              color: "white",
              border: "none",
              padding: "10px 14px",
              borderRadius: 10,
              fontWeight: 600,
              cursor: "pointer",
              fontSize: 14,
            }}
          >
            Sign Out
          </button>
        ) : (
          <Link
            href="/login"
            style={{
              textDecoration: "none",
              color: "white",
              background: "#111",
              padding: "10px 14px",
              borderRadius: 10,
              fontWeight: 600,
              fontSize: 14,
            }}
          >
            Sign In
          </Link>
        )}
      </div>
    </div>
  );
}

export default function Home() {
  const supabase = createClient();

  const [user, setUser] = useState<User | null>(null);
  const [selectedGame, setSelectedGame] = useState<Game | null>(null);
  const [games, setGames] = useState<Game[]>([]);
  const [listings, setListings] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);

  const [form, setForm] = useState({
    price: "",
    quantity: "",
  });

  const [buyingListingId, setBuyingListingId] = useState<number | null>(null);
  const [buyerForm, setBuyerForm] = useState({
    name: "",
    email: "",
  });

  useEffect(() => {
    const loadData = async () => {
      const [{ data: authData }, gamesResult, listingsResult] = await Promise.all([
        supabase.auth.getUser(),
        supabase.from("games").select("*").eq("is_home", true).order("date", { ascending: true }),
        supabase.from("listings").select("*").order("id", { ascending: false }),
      ]);

      setUser(authData.user ?? null);

      if (!gamesResult.error && gamesResult.data) {
        setGames(gamesResult.data as Game[]);
      }

      if (!listingsResult.error && listingsResult.data) {
        setListings(listingsResult.data as Listing[]);
      }

      setLoading(false);
    };

    loadData();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, [supabase]);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    window.location.href = "/";
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedGame) return;

    if (!user) {
      window.location.href = "/login";
      return;
    }

    const { data, error } = await supabase
      .from("listings")
      .insert([
        {
          game_id: selectedGame.id,
          opponent: selectedGame.opponent,
          price: form.price,
          quantity: form.quantity,
          email: user.email ?? "",
          user_id: user.id,
          status: "available",
        },
      ])
      .select();

    if (error) {
      alert("Could not add listing.");
      return;
    }

    if (data && data.length > 0) {
      setListings((prev) => [data[0] as Listing, ...prev]);
      setForm({ price: "", quantity: "" });
      alert("Ticket added to resale pool!");
    }
  };

  const handleBuy = (listingId: number) => {
    setBuyingListingId(listingId);
    setBuyerForm({ name: "", email: "" });
  };

  const handleConfirmPurchase = async (e: React.FormEvent) => {
    e.preventDefault();

    if (buyingListingId === null) return;

    const { error } = await supabase
      .from("listings")
      .update({ status: "sold" })
      .eq("id", buyingListingId);

    if (error) {
      alert("Could not complete purchase request.");
      return;
    }

    setListings((prev) =>
      prev.map((listing) =>
        listing.id === buyingListingId
          ? { ...listing, status: "sold" }
          : listing
      )
    );

    setBuyingListingId(null);
    setBuyerForm({ name: "", email: "" });
    alert("Purchase request received!");
  };

  const inputStyle: React.CSSProperties = {
    padding: 12,
    borderRadius: 10,
    border: "1px solid #b8b8b8",
    background: "#f7f7f7",
    color: "#111",
    fontSize: 14,
    outline: "none",
  };

  if (loading) {
    return (
      <main
        style={{
          minHeight: "100vh",
          background: "#f5f5f5",
          padding: "24px 20px 40px",
          fontFamily: "-apple-system, BlinkMacSystemFont, sans-serif",
        }}
      >
        <NavBar user={user} onSignOut={handleSignOut} />
        <div
          style={{
            maxWidth: 700,
            margin: "0 auto",
            background: "white",
            padding: 24,
            borderRadius: 16,
            boxShadow: "0 10px 30px rgba(0,0,0,0.08)",
          }}
        >
          Loading...
        </div>
      </main>
    );
  }

  if (!selectedGame) {
    return (
      <main
        style={{
          minHeight: "100vh",
          background: "#f5f5f5",
          padding: "24px 20px 40px",
          fontFamily: "-apple-system, BlinkMacSystemFont, sans-serif",
        }}
      >
        <NavBar user={user} onSignOut={handleSignOut} />

        <div
          style={{
            maxWidth: 700,
            margin: "0 auto",
            background: "white",
            borderRadius: 16,
            padding: 24,
            boxShadow: "0 10px 30px rgba(0,0,0,0.08)",
          }}
        >
          <h1 style={{ color: "#111", fontWeight: 700, marginBottom: 8 }}>
            FSU Baseball Ticket Resale
          </h1>

          <p style={{ color: "#444", marginTop: 0, marginBottom: 24 }}>
            Can’t make a game? Return your tickets to the resale pool in seconds.
          </p>

          <h2 style={{ color: "#222", fontWeight: 600, marginBottom: 16 }}>
            Upcoming Home Games
          </h2>

          {games.length === 0 ? (
            <p style={{ color: "#666" }}>No games available right now.</p>
          ) : (
            <div style={{ display: "grid", gap: 12 }}>
              {games.map((game) => (
                <button
                  key={game.id}
                  onClick={() => setSelectedGame(game)}
                  style={{
                    padding: 16,
                    borderRadius: 12,
                    border: "1px solid #ddd",
                    background: "white",
                    cursor: "pointer",
                    textAlign: "left",
                    fontSize: 16,
                  }}
                >
                  <strong style={{ color: "#111" }}>{game.opponent}</strong>
                  <div style={{ color: "#666", marginTop: 4 }}>
                    {formatDate(game.date)}
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      </main>
    );
  }

  const gameListings = listings.filter((l) => l.game_id === selectedGame.id);
  const availableListings = gameListings.filter((l) => l.status === "available");
  const soldListings = gameListings.filter((l) => l.status === "sold");

  return (
    <main
      style={{
        minHeight: "100vh",
        background: "#f5f5f5",
        padding: "24px 20px 40px",
        fontFamily: "-apple-system, BlinkMacSystemFont, sans-serif",
      }}
    >
      <NavBar user={user} onSignOut={handleSignOut} />

      <div
        style={{
          maxWidth: 700,
          margin: "0 auto",
          background: "white",
          borderRadius: 16,
          padding: 24,
          boxShadow: "0 10px 30px rgba(0,0,0,0.08)",
          position: "relative",
        }}
      >
        <button
          onClick={() => {
            setSelectedGame(null);
            setBuyingListingId(null);
          }}
          style={{
            marginBottom: 20,
            background: "none",
            border: "none",
            cursor: "pointer",
            color: "#333",
            fontSize: 14,
          }}
        >
          ← Back to games
        </button>

        <h1 style={{ color: "#111", fontWeight: 700, marginBottom: 8 }}>
          {selectedGame.opponent} — {formatDate(selectedGame.date)}
        </h1>

        <p style={{ color: "#444", marginTop: 0, marginBottom: 24 }}>
          Can’t make the game? Return your tickets to the FSU resale pool.
        </p>

        <section style={{ marginBottom: 32 }}>
          <h2 style={{ color: "#222", fontWeight: 600 }}>Available Tickets</h2>

          {availableListings.length === 0 ? (
            <p style={{ color: "#666" }}>
              No tickets yet — be the first to return yours.
            </p>
          ) : (
            <div style={{ display: "grid", gap: 12, marginTop: 12 }}>
              {availableListings.map((l) => (
                <div
                  key={l.id}
                  style={{
                    border: "1px solid #e5e5e5",
                    borderRadius: 12,
                    padding: 16,
                  }}
                >
                  <strong style={{ color: "#111" }}>{l.quantity} ticket(s)</strong>
                  <div style={{ marginTop: 6, color: "#111", fontWeight: 500 }}>
                    ${l.price}
                  </div>
                  <button
                    onClick={() => handleBuy(l.id)}
                    style={{
                      marginTop: 12,
                      padding: "10px 14px",
                      borderRadius: 10,
                      border: "none",
                      background: "#111",
                      color: "white",
                      fontWeight: 600,
                      cursor: "pointer",
                    }}
                  >
                    Buy Tickets
                  </button>
                </div>
              ))}
            </div>
          )}
        </section>

        {soldListings.length > 0 && (
          <section style={{ marginBottom: 32 }}>
            <h2 style={{ color: "#222", fontWeight: 600 }}>Recently Claimed</h2>
            <div style={{ display: "grid", gap: 12, marginTop: 12 }}>
              {soldListings.map((l) => (
                <div
                  key={l.id}
                  style={{
                    border: "1px solid #e5e5e5",
                    borderRadius: 12,
                    padding: 16,
                    background: "#fafafa",
                  }}
                >
                  <strong style={{ color: "#555" }}>{l.quantity} ticket(s)</strong>
                  <div style={{ marginTop: 6, color: "#555" }}>${l.price}</div>
                  <div
                    style={{
                      marginTop: 10,
                      display: "inline-block",
                      padding: "6px 10px",
                      borderRadius: 999,
                      background: "#e9e9e9",
                      color: "#444",
                      fontSize: 12,
                      fontWeight: 600,
                    }}
                  >
                    Claimed
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        <section>
          <h2 style={{ color: "#222", fontWeight: 600 }}>Return Tickets</h2>

          {!user && (
            <p style={{ color: "#555", marginBottom: 12 }}>
              Please <Link href="/login">sign in</Link> to list tickets.
            </p>
          )}

          <form
            onSubmit={handleSubmit}
            style={{ display: "grid", gap: 12, maxWidth: 400, marginTop: 12 }}
          >
            <input
              placeholder="Price ($)"
              value={form.price}
              onChange={(e) => setForm({ ...form, price: e.target.value })}
              style={inputStyle}
            />

            <input
              placeholder="Quantity (e.g. 2)"
              value={form.quantity}
              onChange={(e) => setForm({ ...form, quantity: e.target.value })}
              style={inputStyle}
            />

            <button
              type="submit"
              style={{
                padding: 14,
                borderRadius: 10,
                border: "none",
                background: "#111",
                color: "white",
                fontWeight: 600,
                cursor: "pointer",
              }}
            >
              Return to Resale Pool
            </button>
          </form>
        </section>

        {buyingListingId !== null && (
          <div
            style={{
              position: "fixed",
              inset: 0,
              background: "rgba(0,0,0,0.35)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              padding: 20,
            }}
          >
            <div
              style={{
                width: "100%",
                maxWidth: 420,
                background: "white",
                borderRadius: 16,
                padding: 24,
                boxShadow: "0 12px 32px rgba(0,0,0,0.18)",
              }}
            >
              <h2 style={{ color: "#111", fontWeight: 700, marginTop: 0 }}>
                Claim Tickets
              </h2>
              <p style={{ color: "#555", marginBottom: 16 }}>
                Enter your info to request these tickets.
              </p>

              <form
                onSubmit={handleConfirmPurchase}
                style={{ display: "grid", gap: 12 }}
              >
                <input
                  placeholder="Your Name"
                  value={buyerForm.name}
                  onChange={(e) =>
                    setBuyerForm({ ...buyerForm, name: e.target.value })
                  }
                  style={inputStyle}
                />

                <input
                  placeholder="Your Email"
                  value={buyerForm.email}
                  onChange={(e) =>
                    setBuyerForm({ ...buyerForm, email: e.target.value })
                  }
                  style={inputStyle}
                />

                <div style={{ display: "flex", gap: 10, marginTop: 4 }}>
                  <button
                    type="submit"
                    style={{
                      flex: 1,
                      padding: 14,
                      borderRadius: 10,
                      border: "none",
                      background: "#111",
                      color: "white",
                      fontWeight: 600,
                      cursor: "pointer",
                    }}
                  >
                    Confirm Claim
                  </button>

                  <button
                    type="button"
                    onClick={() => setBuyingListingId(null)}
                    style={{
                      flex: 1,
                      padding: 14,
                      borderRadius: 10,
                      border: "1px solid #ccc",
                      background: "white",
                      color: "#111",
                      fontWeight: 600,
                      cursor: "pointer",
                    }}
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}