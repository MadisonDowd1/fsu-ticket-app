"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { supabase } from "../../lib/supabase";

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
  status: "available" | "sold";
};

function formatDate(dateString: string) {
  const date = new Date(`${dateString}T00:00:00`);

  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
}

function NavBar() {
  return (
    <div
      style={{
        maxWidth: 900,
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

      <div style={{ display: "flex", gap: 10 }}>
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
      </div>
    </div>
  );
}

export default function MyListingsPage() {
  const [games, setGames] = useState<Game[]>([]);
  const [listings, setListings] = useState<Listing[]>([]);
  const [sellerEmail, setSellerEmail] = useState("");
  const [emailInput, setEmailInput] = useState("");
  const [loading, setLoading] = useState(true);

  const inputStyle: React.CSSProperties = {
    padding: 12,
    borderRadius: 10,
    border: "1px solid #b8b8b8",
    background: "#f7f7f7",
    color: "#111",
    fontSize: 14,
    outline: "none",
  };

  useEffect(() => {
    const savedEmail = window.localStorage.getItem("sellerEmail");
    if (savedEmail) {
      setSellerEmail(savedEmail);
      setEmailInput(savedEmail);
    }

    const loadData = async () => {
      const [gamesResult, listingsResult] = await Promise.all([
        supabase.from("games").select("*").order("date", { ascending: true }),
        supabase.from("listings").select("*").order("id", { ascending: false }),
      ]);

      if (!gamesResult.error && gamesResult.data) {
        setGames(gamesResult.data as Game[]);
      }

      if (!listingsResult.error && listingsResult.data) {
        setListings(listingsResult.data as Listing[]);
      }

      setLoading(false);
    };

    loadData();
  }, []);

  const gameMap = useMemo(() => {
    const map = new Map<number, Game>();
    games.forEach((game) => map.set(game.id, game));
    return map;
  }, [games]);

  const myListings = listings.filter(
    (listing) =>
      sellerEmail.trim() !== "" &&
      listing.email.toLowerCase() === sellerEmail.trim().toLowerCase()
  );

  const handleSaveEmail = () => {
    setSellerEmail(emailInput.trim());
    window.localStorage.setItem("sellerEmail", emailInput.trim());
  };

  const handleDeleteListing = async (listingId: number) => {
    const confirmDelete = window.confirm(
      "Remove this listing from the resale pool?"
    );

    if (!confirmDelete) return;

    const { error } = await supabase.from("listings").delete().eq("id", listingId);

    if (error) {
      alert("Could not remove listing.");
      return;
    }

    setListings((prev) => prev.filter((listing) => listing.id !== listingId));
  };

  const availableCount = myListings.filter((l) => l.status === "available").length;
  const claimedCount = myListings.filter((l) => l.status === "sold").length;

  return (
    <main
      style={{
        minHeight: "100vh",
        background: "#f5f5f5",
        padding: "24px 20px 40px",
        fontFamily: "-apple-system, BlinkMacSystemFont, sans-serif",
      }}
    >
      <NavBar />

      <div
        style={{
          maxWidth: 900,
          margin: "0 auto",
          display: "grid",
          gap: 20,
        }}
      >
        <div
          style={{
            background: "white",
            borderRadius: 16,
            padding: 24,
            boxShadow: "0 10px 30px rgba(0,0,0,0.08)",
          }}
        >
          <h1 style={{ color: "#111", fontWeight: 700, marginBottom: 8 }}>
            My Listings
          </h1>
          <p style={{ color: "#444", marginTop: 0, marginBottom: 20 }}>
            View and manage the tickets you’ve returned to the resale pool.
          </p>

          <div
            style={{
              display: "flex",
              gap: 12,
              flexWrap: "wrap",
              alignItems: "center",
            }}
          >
            <input
              placeholder="Enter your seller email"
              value={emailInput}
              onChange={(e) => setEmailInput(e.target.value)}
              style={{ ...inputStyle, minWidth: 280, flex: 1 }}
            />

            <button
              onClick={handleSaveEmail}
              style={{
                padding: "12px 16px",
                borderRadius: 10,
                border: "none",
                background: "#111",
                color: "white",
                fontWeight: 600,
                cursor: "pointer",
              }}
            >
              View Listings
            </button>
          </div>
        </div>

        {sellerEmail && (
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
              gap: 16,
            }}
          >
            <div
              style={{
                background: "white",
                borderRadius: 16,
                padding: 18,
                boxShadow: "0 10px 30px rgba(0,0,0,0.06)",
              }}
            >
              <div style={{ color: "#666", fontSize: 13, marginBottom: 6 }}>
                Seller Email
              </div>
              <div style={{ color: "#111", fontWeight: 600 }}>{sellerEmail}</div>
            </div>

            <div
              style={{
                background: "white",
                borderRadius: 16,
                padding: 18,
                boxShadow: "0 10px 30px rgba(0,0,0,0.06)",
              }}
            >
              <div style={{ color: "#666", fontSize: 13, marginBottom: 6 }}>
                Active Listings
              </div>
              <div style={{ color: "#111", fontWeight: 700, fontSize: 24 }}>
                {availableCount}
              </div>
            </div>

            <div
              style={{
                background: "white",
                borderRadius: 16,
                padding: 18,
                boxShadow: "0 10px 30px rgba(0,0,0,0.06)",
              }}
            >
              <div style={{ color: "#666", fontSize: 13, marginBottom: 6 }}>
                Claimed Listings
              </div>
              <div style={{ color: "#111", fontWeight: 700, fontSize: 24 }}>
                {claimedCount}
              </div>
            </div>
          </div>
        )}

        <div
          style={{
            background: "white",
            borderRadius: 16,
            padding: 24,
            boxShadow: "0 10px 30px rgba(0,0,0,0.08)",
          }}
        >
          <h2 style={{ color: "#222", fontWeight: 600, marginTop: 0 }}>
            Your Ticket Activity
          </h2>

          {loading ? (
            <p style={{ color: "#666" }}>Loading your listings...</p>
          ) : !sellerEmail ? (
            <p style={{ color: "#666" }}>
              Enter your seller email above to see your listings.
            </p>
          ) : myListings.length === 0 ? (
            <p style={{ color: "#666" }}>
              No listings found for that email yet.
            </p>
          ) : (
            <div style={{ display: "grid", gap: 12, marginTop: 12 }}>
              {myListings.map((listing) => {
                const game = gameMap.get(listing.game_id);

                return (
                  <div
                    key={listing.id}
                    style={{
                      border: "1px solid #e5e5e5",
                      borderRadius: 14,
                      padding: 18,
                      display: "grid",
                      gap: 10,
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        gap: 12,
                        flexWrap: "wrap",
                        alignItems: "center",
                      }}
                    >
                      <div>
                        <div
                          style={{
                            color: "#111",
                            fontWeight: 700,
                            marginBottom: 4,
                          }}
                        >
                          {listing.opponent}
                          {game ? ` — ${formatDate(game.date)}` : ""}
                        </div>
                        <div style={{ color: "#555", fontSize: 14 }}>
                          {listing.quantity} ticket(s) · ${listing.price}
                        </div>
                      </div>

                      <div
                        style={{
                          display: "inline-block",
                          padding: "6px 10px",
                          borderRadius: 999,
                          background:
                            listing.status === "available" ? "#eef6ff" : "#ececec",
                          color:
                            listing.status === "available" ? "#245ea8" : "#555",
                          fontSize: 12,
                          fontWeight: 700,
                          textTransform: "capitalize",
                        }}
                      >
                        {listing.status === "available" ? "Live" : "Claimed"}
                      </div>
                    </div>

                    <div style={{ color: "#666", fontSize: 14 }}>
                      Listed with: {listing.email}
                    </div>

                    <div style={{ display: "flex", gap: 10 }}>
                      {listing.status === "available" && (
                        <button
                          onClick={() => handleDeleteListing(listing.id)}
                          style={{
                            padding: "10px 14px",
                            borderRadius: 10,
                            border: "1px solid #ddd",
                            background: "white",
                            color: "#111",
                            fontWeight: 600,
                            cursor: "pointer",
                          }}
                        >
                          Remove Listing
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </main>
  );
}