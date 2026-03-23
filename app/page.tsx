"use client";
import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";

type Game = {
  id: number;
  opponent: string;
  date: string;
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

const games: Game[] = [
  { id: 1, opponent: "Miami", date: "April 5" },
  { id: 2, opponent: "Florida", date: "April 12" },
  { id: 3, opponent: "Clemson", date: "April 20" },
];

export default function Home() {
  const [selectedGame, setSelectedGame] = useState<Game | null>(null);
  const [listings, setListings] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);

  const [form, setForm] = useState({
    price: "",
    quantity: "",
    email: "",
  });

  const [buyingListingId, setBuyingListingId] = useState<number | null>(null);
  const [buyerForm, setBuyerForm] = useState({
    name: "",
    email: "",
  });

  useEffect(() => {
    const fetchListings = async () => {
      const { data, error } = await supabase
        .from("listings")
        .select("*")
        .order("id", { ascending: false });

      if (!error && data) {
        setListings(data as Listing[]);
      } else if (error) {
        console.error("Error loading listings:", error.message);
      }

      setLoading(false);
    };

    fetchListings();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedGame) return;

    const { data, error } = await supabase
      .from("listings")
      .insert([
        {
          game_id: selectedGame.id,
          opponent: selectedGame.opponent,
          price: form.price,
          quantity: form.quantity,
          email: form.email,
          status: "available",
        },
      ])
      .select();

    if (error) {
      console.error("Error adding listing:", error.message);
      alert("Could not add listing.");
      return;
    }

    if (data && data.length > 0) {
      setListings((prev) => [data[0] as Listing, ...prev]);
      setForm({ price: "", quantity: "", email: "" });
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
      console.error("Error updating listing:", error.message);
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
    alert("Purchase request received! The seller will be contacted to transfer the tickets.");
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
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontFamily: "-apple-system, BlinkMacSystemFont, sans-serif",
        }}
      >
        <div
          style={{
            background: "white",
            padding: 24,
            borderRadius: 16,
            boxShadow: "0 10px 30px rgba(0,0,0,0.08)",
            color: "#222",
            fontWeight: 600,
          }}
        >
          Loading tickets...
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
          padding: "40px 20px",
          fontFamily: "-apple-system, BlinkMacSystemFont, sans-serif",
        }}
      >
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
            Upcoming Games
          </h2>

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
                <div style={{ color: "#666", marginTop: 4 }}>{game.date}</div>
              </button>
            ))}
          </div>
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
        padding: "40px 20px",
        fontFamily: "-apple-system, BlinkMacSystemFont, sans-serif",
      }}
    >
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
          {selectedGame.opponent} — {selectedGame.date}
        </h1>

        <p style={{ color: "#444", marginTop: 0, marginBottom: 24 }}>
          Can’t make the game? Return your tickets to the FSU resale pool.
        </p>

        <section style={{ marginBottom: 32 }}>
          <h2 style={{ color: "#222", fontWeight: 600 }}>
            Available Tickets
          </h2>

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
                  <strong style={{ color: "#111" }}>
                    {l.quantity} ticket(s)
                  </strong>
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
            <h2 style={{ color: "#222", fontWeight: 600 }}>
              Recently Claimed
            </h2>
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
                  <strong style={{ color: "#555" }}>
                    {l.quantity} ticket(s)
                  </strong>
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
          <h2 style={{ color: "#222", fontWeight: 600 }}>
            Return Tickets
          </h2>

          <form
            onSubmit={handleSubmit}
            style={{ display: "grid", gap: 12, maxWidth: 400, marginTop: 12 }}
          >
            <input
              placeholder="Price ($)"
              value={form.price}
              onChange={(e) => setForm({ ...form, price: e.target.value })}
              style={inputStyle}
              onFocus={(e) => (e.currentTarget.style.border = "1px solid #111")}
              onBlur={(e) => (e.currentTarget.style.border = "1px solid #b8b8b8")}
            />

            <input
              placeholder="Quantity (e.g. 2)"
              value={form.quantity}
              onChange={(e) => setForm({ ...form, quantity: e.target.value })}
              style={inputStyle}
              onFocus={(e) => (e.currentTarget.style.border = "1px solid #111")}
              onBlur={(e) => (e.currentTarget.style.border = "1px solid #b8b8b8")}
            />

            <input
              placeholder="Your Email"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              style={inputStyle}
              onFocus={(e) => (e.currentTarget.style.border = "1px solid #111")}
              onBlur={(e) => (e.currentTarget.style.border = "1px solid #b8b8b8")}
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
                  onFocus={(e) =>
                    (e.currentTarget.style.border = "1px solid #111")
                  }
                  onBlur={(e) =>
                    (e.currentTarget.style.border = "1px solid #b8b8b8")
                  }
                />

                <input
                  placeholder="Your Email"
                  value={buyerForm.email}
                  onChange={(e) =>
                    setBuyerForm({ ...buyerForm, email: e.target.value })
                  }
                  style={inputStyle}
                  onFocus={(e) =>
                    (e.currentTarget.style.border = "1px solid #111")
                  }
                  onBlur={(e) =>
                    (e.currentTarget.style.border = "1px solid #b8b8b8")
                  }
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