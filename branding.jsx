import { useState } from "react";

const brand = {
  colors: {
    obsidian: "#080C0A",
    pitch: "#0A1A10",
    green: "#00FF6A",
    greenDim: "#00CC55",
    greenMuted: "#1A3D28",
    amber: "#FFB800",
    red: "#FF3D3D",
    white: "#F0F5F1",
    grey400: "#8A9E92",
    grey600: "#2A3D30",
    grey700: "#1A2E22",
  },
  fonts: {
    display: "'Bebas Neue', sans-serif",
    body: "'DM Mono', monospace",
    ui: "'DM Mono', monospace",
  },
};

const copy = (text, id, setCopied) => {
  navigator.clipboard.writeText(text);
  setCopied(id);
  setTimeout(() => setCopied(null), 1200);
};

export default function BrandKit() {
  const [copied, setCopied] = useState(null);
  const [activeTab, setActiveTab] = useState("overview");

  const tabs = [
    "overview",
    "colors",
    "typography",
    "logo",
    "components",
    "social",
  ];

  return (
    <div
      style={{
        background: brand.colors.obsidian,
        minHeight: "100vh",
        fontFamily: brand.fonts.body,
        color: brand.colors.white,
        padding: "0",
      }}
    >
      <link
        href="https://fonts.googleapis.com/css2?family=Bebas+Neue&family=DM+Mono:wght@300;400;500&display=swap"
        rel="stylesheet"
      />

      {/* Header */}
      <div
        style={{
          borderBottom: `1px solid ${brand.colors.grey600}`,
          padding: "24px 32px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "14px" }}>
          <LogoMark size={36} />
          <div>
            <div
              style={{
                fontFamily: brand.fonts.display,
                fontSize: "26px",
                letterSpacing: "0.08em",
                color: brand.colors.white,
                lineHeight: 1,
              }}
            >
              CURVEKICK
            </div>
            <div
              style={{
                fontSize: "10px",
                color: brand.colors.green,
                letterSpacing: "0.2em",
                marginTop: "2px",
              }}
            >
              BRAND KIT v1.0
            </div>
          </div>
        </div>
        <div
          style={{
            fontSize: "11px",
            color: brand.colors.grey400,
            letterSpacing: "0.1em",
          }}
        >
          X CUP HACKATHON · 2026
        </div>
      </div>

      {/* Tabs */}
      <div
        style={{
          display: "flex",
          gap: "0",
          borderBottom: `1px solid ${brand.colors.grey600}`,
          padding: "0 32px",
          overflowX: "auto",
        }}
      >
        {tabs.map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            style={{
              background: "none",
              border: "none",
              borderBottom:
                activeTab === tab
                  ? `2px solid ${brand.colors.green}`
                  : "2px solid transparent",
              color:
                activeTab === tab ? brand.colors.green : brand.colors.grey400,
              fontFamily: brand.fonts.body,
              fontSize: "11px",
              letterSpacing: "0.15em",
              textTransform: "uppercase",
              padding: "14px 20px",
              cursor: "pointer",
              whiteSpace: "nowrap",
              transition: "color 0.15s",
            }}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Content */}
      <div style={{ padding: "32px" }}>
        {activeTab === "overview" && <OverviewTab />}
        {activeTab === "colors" && (
          <ColorsTab copied={copied} setCopied={setCopied} />
        )}
        {activeTab === "typography" && <TypographyTab />}
        {activeTab === "logo" && <LogoTab />}
        {activeTab === "components" && <ComponentsTab />}
        {activeTab === "social" && <SocialTab />}
      </div>
    </div>
  );
}

function LogoMark({ size = 40, animated = false }) {
  return (
    <svg width={size} height={size} viewBox="0 0 40 40" fill="none">
      <rect width="40" height="40" rx="8" fill={brand.colors.greenMuted} />
      {/* Curve line */}
      <path
        d="M6 30 Q12 28 18 20 Q24 12 34 10"
        stroke={brand.colors.green}
        strokeWidth="2.5"
        strokeLinecap="round"
        fill="none"
      />
      {/* Ball dot */}
      <circle cx="34" cy="10" r="3.5" fill={brand.colors.green} />
      {/* Grid lines subtle */}
      <line
        x1="6"
        y1="10"
        x2="6"
        y2="34"
        stroke={brand.colors.grey600}
        strokeWidth="0.5"
      />
      <line
        x1="6"
        y1="34"
        x2="34"
        y2="34"
        stroke={brand.colors.grey600}
        strokeWidth="0.5"
      />
      {/* Tick marks */}
      <line
        x1="20"
        y1="32"
        x2="20"
        y2="36"
        stroke={brand.colors.grey400}
        strokeWidth="0.5"
      />
      <line
        x1="4"
        y1="20"
        x2="8"
        y2="20"
        stroke={brand.colors.grey400}
        strokeWidth="0.5"
      />
    </svg>
  );
}

function OverviewTab() {
  return (
    <div>
      <SectionLabel>Brand direction</SectionLabel>
      <p
        style={{
          color: brand.colors.grey400,
          fontSize: "13px",
          lineHeight: 1.7,
          maxWidth: "560px",
          marginBottom: "32px",
        }}
      >
        Dark trading terminal meets football pitch energy. CurveKick should feel
        like you're watching live market data during a match — precise, urgent,
        electric. Every number matters. Every second counts.
      </p>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(3, 1fr)",
          gap: "16px",
          marginBottom: "32px",
        }}
      >
        {[
          { label: "Tone", value: "Terminal · Urgent · Sharp" },
          { label: "Audience", value: "Crypto-native traders" },
          { label: "Feeling", value: "Live match energy" },
        ].map((item) => (
          <div
            key={item.label}
            style={{
              background: brand.colors.pitch,
              border: `1px solid ${brand.colors.grey600}`,
              borderRadius: "8px",
              padding: "16px 20px",
            }}
          >
            <div
              style={{
                fontSize: "10px",
                color: brand.colors.grey400,
                letterSpacing: "0.15em",
                textTransform: "uppercase",
                marginBottom: "6px",
              }}
            >
              {item.label}
            </div>
            <div style={{ fontSize: "13px", color: brand.colors.white }}>
              {item.value}
            </div>
          </div>
        ))}
      </div>

      {/* Mini preview */}
      <SectionLabel>Quick preview</SectionLabel>
      <div
        style={{
          background: brand.colors.pitch,
          border: `1px solid ${brand.colors.grey600}`,
          borderRadius: "12px",
          padding: "24px",
          maxWidth: "460px",
        }}
      >
        <div
          style={{
            fontSize: "10px",
            color: brand.colors.grey400,
            letterSpacing: "0.2em",
            marginBottom: "12px",
          }}
        >
          MATCH · GROUP A
        </div>
        <div
          style={{
            fontFamily: brand.fonts.display,
            fontSize: "28px",
            letterSpacing: "0.05em",
            marginBottom: "16px",
          }}
        >
          BRAZIL vs FRANCE
        </div>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(3, 1fr)",
            gap: "8px",
          }}
        >
          {[
            {
              label: "HOME",
              price: "0.0042",
              change: "+12.4%",
              color: brand.colors.green,
            },
            {
              label: "DRAW",
              price: "0.0021",
              change: "+3.1%",
              color: brand.colors.amber,
            },
            {
              label: "AWAY",
              price: "0.0038",
              change: "-2.8%",
              color: brand.colors.red,
            },
          ].map((item) => (
            <div
              key={item.label}
              style={{
                background: brand.colors.obsidian,
                borderRadius: "6px",
                padding: "12px",
                border: `1px solid ${brand.colors.grey700}`,
              }}
            >
              <div
                style={{
                  fontSize: "9px",
                  color: brand.colors.grey400,
                  letterSpacing: "0.2em",
                  marginBottom: "6px",
                }}
              >
                {item.label}
              </div>
              <div
                style={{
                  fontSize: "14px",
                  color: brand.colors.white,
                  fontWeight: 500,
                }}
              >
                {item.price}
              </div>
              <div
                style={{
                  fontSize: "11px",
                  color: item.color,
                  marginTop: "4px",
                }}
              >
                {item.change}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function ColorsTab({ copied, setCopied }) {
  const palette = [
    {
      name: "Obsidian",
      var: "--ck-obsidian",
      hex: "#080C0A",
      use: "Primary background",
    },
    {
      name: "Pitch",
      var: "--ck-pitch",
      hex: "#0A1A10",
      use: "Card / surface background",
    },
    {
      name: "Green",
      var: "--ck-green",
      hex: "#00FF6A",
      use: "Primary accent · CTAs · up",
    },
    {
      name: "Green Dim",
      var: "--ck-green-dim",
      hex: "#00CC55",
      use: "Hover states",
    },
    {
      name: "Green Muted",
      var: "--ck-green-muted",
      hex: "#1A3D28",
      use: "Subtle fills · logo bg",
    },
    {
      name: "Amber",
      var: "--ck-amber",
      hex: "#FFB800",
      use: "Warning · neutral · draw",
    },
    {
      name: "Red",
      var: "--ck-red",
      hex: "#FF3D3D",
      use: "Price down · errors · away",
    },
    { name: "White", var: "--ck-white", hex: "#F0F5F1", use: "Primary text" },
    {
      name: "Grey 400",
      var: "--ck-grey-400",
      hex: "#8A9E92",
      use: "Secondary text · labels",
    },
    {
      name: "Grey 600",
      var: "--ck-grey-600",
      hex: "#2A3D30",
      use: "Borders · dividers",
    },
    {
      name: "Grey 700",
      var: "--ck-grey-700",
      hex: "#1A2E22",
      use: "Subtle borders",
    },
  ];

  return (
    <div>
      <SectionLabel>Color palette</SectionLabel>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))",
          gap: "12px",
          marginBottom: "32px",
        }}
      >
        {palette.map((color) => (
          <div
            key={color.hex}
            onClick={() => copy(color.hex, color.hex, setCopied)}
            style={{
              background: brand.colors.pitch,
              border: `1px solid ${brand.colors.grey600}`,
              borderRadius: "8px",
              overflow: "hidden",
              cursor: "pointer",
              transition: "border-color 0.15s",
            }}
          >
            <div
              style={{
                height: "64px",
                background: color.hex,
                borderBottom: `1px solid ${brand.colors.grey600}`,
              }}
            />
            <div style={{ padding: "12px 14px" }}>
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  marginBottom: "4px",
                }}
              >
                <span
                  style={{
                    fontSize: "12px",
                    color: brand.colors.white,
                    fontWeight: 500,
                  }}
                >
                  {color.name}
                </span>
                <span
                  style={{
                    fontSize: "11px",
                    color:
                      copied === color.hex
                        ? brand.colors.green
                        : brand.colors.grey400,
                    fontFamily: brand.fonts.ui,
                  }}
                >
                  {copied === color.hex ? "copied!" : color.hex}
                </span>
              </div>
              <div
                style={{
                  fontSize: "10px",
                  color: brand.colors.grey400,
                  letterSpacing: "0.05em",
                }}
              >
                {color.use}
              </div>
              <div
                style={{
                  fontSize: "10px",
                  color: brand.colors.grey400,
                  marginTop: "4px",
                  fontFamily: brand.fonts.ui,
                }}
              >
                {color.var}
              </div>
            </div>
          </div>
        ))}
      </div>

      <SectionLabel>CSS variables</SectionLabel>
      <CodeBlock>{`:root {
  --ck-obsidian:    #080C0A;
  --ck-pitch:       #0A1A10;
  --ck-green:       #00FF6A;
  --ck-green-dim:   #00CC55;
  --ck-green-muted: #1A3D28;
  --ck-amber:       #FFB800;
  --ck-red:         #FF3D3D;
  --ck-white:       #F0F5F1;
  --ck-grey-400:    #8A9E92;
  --ck-grey-600:    #2A3D30;
  --ck-grey-700:    #1A2E22;
}`}</CodeBlock>
    </div>
  );
}

function TypographyTab() {
  return (
    <div>
      <SectionLabel>Typefaces</SectionLabel>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: "16px",
          marginBottom: "32px",
        }}
      >
        <div
          style={{
            background: brand.colors.pitch,
            border: `1px solid ${brand.colors.grey600}`,
            borderRadius: "8px",
            padding: "24px",
          }}
        >
          <div
            style={{
              fontSize: "10px",
              color: brand.colors.grey400,
              letterSpacing: "0.2em",
              marginBottom: "16px",
            }}
          >
            DISPLAY — BEBAS NEUE
          </div>
          <div
            style={{
              fontFamily: brand.fonts.display,
              fontSize: "48px",
              color: brand.colors.white,
              lineHeight: 1,
            }}
          >
            CURVEKICK
          </div>
          <div
            style={{
              fontFamily: brand.fonts.display,
              fontSize: "32px",
              color: brand.colors.green,
              lineHeight: 1,
              marginTop: "8px",
            }}
          >
            BRAZIL VS FRANCE
          </div>
          <div
            style={{
              fontFamily: brand.fonts.display,
              fontSize: "20px",
              color: brand.colors.grey400,
              lineHeight: 1,
              marginTop: "8px",
            }}
          >
            HOME · DRAW · AWAY
          </div>
          <div
            style={{
              fontSize: "10px",
              color: brand.colors.grey400,
              marginTop: "16px",
              letterSpacing: "0.1em",
            }}
          >
            USE FOR: headings, match names, labels, nav
          </div>
        </div>
        <div
          style={{
            background: brand.colors.pitch,
            border: `1px solid ${brand.colors.grey600}`,
            borderRadius: "8px",
            padding: "24px",
          }}
        >
          <div
            style={{
              fontSize: "10px",
              color: brand.colors.grey400,
              letterSpacing: "0.2em",
              marginBottom: "16px",
            }}
          >
            MONO — DM MONO
          </div>
          <div
            style={{
              fontFamily: brand.fonts.body,
              fontSize: "24px",
              color: brand.colors.white,
            }}
          >
            0.0042 OKB
          </div>
          <div
            style={{
              fontFamily: brand.fonts.body,
              fontSize: "16px",
              color: brand.colors.green,
              marginTop: "8px",
            }}
          >
            +12.4%
          </div>
          <div
            style={{
              fontFamily: brand.fonts.body,
              fontSize: "13px",
              color: brand.colors.grey400,
              marginTop: "8px",
              lineHeight: 1.6,
            }}
          >
            Trade World Cup match
            <br />
            outcomes on bonding curves.
          </div>
          <div
            style={{
              fontSize: "10px",
              color: brand.colors.grey400,
              marginTop: "16px",
              letterSpacing: "0.1em",
            }}
          >
            USE FOR: prices, body copy, code, data
          </div>
        </div>
      </div>

      <SectionLabel>Type scale</SectionLabel>
      <div
        style={{
          background: brand.colors.pitch,
          border: `1px solid ${brand.colors.grey600}`,
          borderRadius: "8px",
          padding: "24px",
        }}
      >
        {[
          {
            name: "Display XL",
            font: brand.fonts.display,
            size: "56px",
            weight: 400,
            sample: "MATCH DAY",
          },
          {
            name: "Display LG",
            font: brand.fonts.display,
            size: "36px",
            weight: 400,
            sample: "BRAZIL VS FRANCE",
          },
          {
            name: "Display MD",
            font: brand.fonts.display,
            size: "24px",
            weight: 400,
            sample: "GROUP STAGE · MATCH 01",
          },
          {
            name: "Data XL",
            font: brand.fonts.body,
            size: "28px",
            weight: 500,
            sample: "0.0042 OKB",
          },
          {
            name: "Data LG",
            font: brand.fonts.body,
            size: "18px",
            weight: 400,
            sample: "0.0042 OKB",
          },
          {
            name: "Body",
            font: brand.fonts.body,
            size: "13px",
            weight: 300,
            sample: "Trade match outcomes. Winners split the losing pool.",
          },
          {
            name: "Label",
            font: brand.fonts.body,
            size: "10px",
            weight: 400,
            sample: "TOTAL RAISED · 24.3 OKB",
          },
        ].map((item) => (
          <div
            key={item.name}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "20px",
              padding: "10px 0",
              borderBottom: `1px solid ${brand.colors.grey700}`,
            }}
          >
            <div
              style={{
                minWidth: "90px",
                fontSize: "10px",
                color: brand.colors.grey400,
                letterSpacing: "0.1em",
              }}
            >
              {item.name}
            </div>
            <div
              style={{
                fontFamily: item.font,
                fontSize: item.size,
                fontWeight: item.weight,
                color: brand.colors.white,
                lineHeight: 1,
              }}
            >
              {item.sample}
            </div>
          </div>
        ))}
      </div>

      <SectionLabel style={{ marginTop: "24px" }}>Install</SectionLabel>
      <CodeBlock>{`/* In your Next.js _app or globals.css */
@import url('https://fonts.googleapis.com/css2?family=Bebas+Neue&family=DM+Mono:wght@300;400;500&display=swap');

/* Tailwind config */
fontFamily: {
  display: ['Bebas Neue', 'sans-serif'],
  mono:    ['DM Mono', 'monospace'],
}`}</CodeBlock>
    </div>
  );
}

function LogoTab() {
  const [bg, setBg] = useState("dark");

  return (
    <div>
      <SectionLabel>Logo mark</SectionLabel>
      <div style={{ display: "flex", gap: "8px", marginBottom: "20px" }}>
        {["dark", "light", "green"].map((b) => (
          <button
            key={b}
            onClick={() => setBg(b)}
            style={{
              background: bg === b ? brand.colors.green : "none",
              color: bg === b ? brand.colors.obsidian : brand.colors.grey400,
              border: `1px solid ${
                bg === b ? brand.colors.green : brand.colors.grey600
              }`,
              borderRadius: "4px",
              padding: "4px 12px",
              fontSize: "11px",
              fontFamily: brand.fonts.body,
              cursor: "pointer",
              letterSpacing: "0.1em",
            }}
          >
            {b}
          </button>
        ))}
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(3, 1fr)",
          gap: "16px",
          marginBottom: "32px",
        }}
      >
        {/* Icon only */}
        <LogoVariant bg={bg} label="Icon only">
          <LogoMark size={64} />
        </LogoVariant>

        {/* Horizontal lockup */}
        <LogoVariant bg={bg} label="Horizontal">
          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            <LogoMark size={44} />
            <div
              style={{
                fontFamily: brand.fonts.display,
                fontSize: "32px",
                letterSpacing: "0.08em",
                color:
                  bg === "light" ? brand.colors.obsidian : brand.colors.white,
                lineHeight: 1,
              }}
            >
              CURVEKICK
            </div>
          </div>
        </LogoVariant>

        {/* Stacked */}
        <LogoVariant bg={bg} label="Stacked">
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: "8px",
            }}
          >
            <LogoMark size={48} />
            <div
              style={{
                fontFamily: brand.fonts.display,
                fontSize: "22px",
                letterSpacing: "0.12em",
                color:
                  bg === "light" ? brand.colors.obsidian : brand.colors.white,
              }}
            >
              CURVEKICK
            </div>
            <div
              style={{
                fontSize: "9px",
                color: brand.colors.green,
                letterSpacing: "0.25em",
              }}
            >
              PREDICTION MARKETS
            </div>
          </div>
        </LogoVariant>
      </div>

      <SectionLabel>Logo SVG (copy to file)</SectionLabel>
      <CodeBlock>{`<svg width="40" height="40" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
  <rect width="40" height="40" rx="8" fill="#1A3D28"/>
  <path d="M6 30 Q12 28 18 20 Q24 12 34 10"
    stroke="#00FF6A" stroke-width="2.5"
    stroke-linecap="round" fill="none"/>
  <circle cx="34" cy="10" r="3.5" fill="#00FF6A"/>
  <line x1="6" y1="10" x2="6" y2="34" stroke="#2A3D30" stroke-width="0.5"/>
  <line x1="6" y1="34" x2="34" y2="34" stroke="#2A3D30" stroke-width="0.5"/>
  <line x1="20" y1="32" x2="20" y2="36" stroke="#8A9E92" stroke-width="0.5"/>
  <line x1="4" y1="20" x2="8" y2="20" stroke="#8A9E92" stroke-width="0.5"/>
</svg>`}</CodeBlock>
    </div>
  );
}

function ComponentsTab() {
  return (
    <div>
      <SectionLabel>Buttons</SectionLabel>
      <div
        style={{
          display: "flex",
          gap: "12px",
          flexWrap: "wrap",
          marginBottom: "32px",
        }}
      >
        <button
          style={{
            background: brand.colors.green,
            color: brand.colors.obsidian,
            border: "none",
            borderRadius: "6px",
            padding: "10px 24px",
            fontFamily: brand.fonts.body,
            fontSize: "12px",
            fontWeight: 500,
            letterSpacing: "0.1em",
            cursor: "pointer",
          }}
        >
          BUY HOME
        </button>
        <button
          style={{
            background: "none",
            color: brand.colors.green,
            border: `1px solid ${brand.colors.green}`,
            borderRadius: "6px",
            padding: "10px 24px",
            fontFamily: brand.fonts.body,
            fontSize: "12px",
            letterSpacing: "0.1em",
            cursor: "pointer",
          }}
        >
          SELL
        </button>
        <button
          style={{
            background: brand.colors.amber,
            color: brand.colors.obsidian,
            border: "none",
            borderRadius: "6px",
            padding: "10px 24px",
            fontFamily: brand.fonts.body,
            fontSize: "12px",
            fontWeight: 500,
            letterSpacing: "0.1em",
            cursor: "pointer",
          }}
        >
          CLAIM WINNINGS
        </button>
        <button
          style={{
            background: brand.colors.grey700,
            color: brand.colors.grey400,
            border: `1px solid ${brand.colors.grey600}`,
            borderRadius: "6px",
            padding: "10px 24px",
            fontFamily: brand.fonts.body,
            fontSize: "12px",
            letterSpacing: "0.1em",
            cursor: "pointer",
          }}
        >
          DISABLED
        </button>
      </div>

      <SectionLabel>Outcome cards</SectionLabel>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(3, 1fr)",
          gap: "10px",
          maxWidth: "520px",
          marginBottom: "32px",
        }}
      >
        {[
          {
            label: "HOME",
            price: "0.0042",
            supply: "142 shares",
            change: "+12.4%",
            color: brand.colors.green,
            active: true,
          },
          {
            label: "DRAW",
            price: "0.0021",
            supply: "89 shares",
            change: "+3.1%",
            color: brand.colors.amber,
            active: false,
          },
          {
            label: "AWAY",
            price: "0.0038",
            supply: "127 shares",
            change: "-2.8%",
            color: brand.colors.red,
            active: false,
          },
        ].map((item) => (
          <div
            key={item.label}
            style={{
              background: brand.colors.pitch,
              border: `1px solid ${
                item.active ? item.color : brand.colors.grey600
              }`,
              borderRadius: "8px",
              padding: "16px",
              boxShadow: item.active ? `0 0 12px ${item.color}22` : "none",
            }}
          >
            <div
              style={{
                fontSize: "9px",
                color: brand.colors.grey400,
                letterSpacing: "0.2em",
                marginBottom: "8px",
              }}
            >
              {item.label}
            </div>
            <div
              style={{
                fontFamily: brand.fonts.body,
                fontSize: "18px",
                color: brand.colors.white,
                fontWeight: 500,
              }}
            >
              {item.price}
            </div>
            <div
              style={{ fontSize: "11px", color: item.color, marginTop: "4px" }}
            >
              {item.change}
            </div>
            <div
              style={{
                fontSize: "10px",
                color: brand.colors.grey400,
                marginTop: "8px",
              }}
            >
              {item.supply}
            </div>
          </div>
        ))}
      </div>

      <SectionLabel>Match card</SectionLabel>
      <div
        style={{
          background: brand.colors.pitch,
          border: `1px solid ${brand.colors.grey600}`,
          borderRadius: "10px",
          padding: "20px 24px",
          maxWidth: "420px",
          marginBottom: "32px",
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: "12px",
          }}
        >
          <div
            style={{
              fontSize: "9px",
              color: brand.colors.grey400,
              letterSpacing: "0.2em",
            }}
          >
            GROUP A · MATCH 01
          </div>
          <div
            style={{
              fontSize: "9px",
              color: brand.colors.amber,
              letterSpacing: "0.15em",
              background: `${brand.colors.amber}18`,
              padding: "3px 8px",
              borderRadius: "4px",
            }}
          >
            LIVE
          </div>
        </div>
        <div
          style={{
            fontFamily: brand.fonts.display,
            fontSize: "26px",
            letterSpacing: "0.05em",
            marginBottom: "14px",
          }}
        >
          BRAZIL vs FRANCE
        </div>
        <div
          style={{
            display: "flex",
            gap: "2px",
            height: "4px",
            borderRadius: "2px",
            overflow: "hidden",
            marginBottom: "12px",
          }}
        >
          <div style={{ width: "45%", background: brand.colors.green }} />
          <div style={{ width: "20%", background: brand.colors.amber }} />
          <div style={{ width: "35%", background: brand.colors.red }} />
        </div>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            fontSize: "11px",
            color: brand.colors.grey400,
          }}
        >
          <span style={{ color: brand.colors.green }}>HOME 45%</span>
          <span style={{ color: brand.colors.amber }}>DRAW 20%</span>
          <span style={{ color: brand.colors.red }}>AWAY 35%</span>
        </div>
        <div
          style={{
            marginTop: "14px",
            paddingTop: "14px",
            borderTop: `1px solid ${brand.colors.grey700}`,
            display: "flex",
            justifyContent: "space-between",
            fontSize: "11px",
            color: brand.colors.grey400,
          }}
        >
          <span>24.3 OKB total</span>
          <span style={{ color: brand.colors.green, cursor: "pointer" }}>
            TRADE →
          </span>
        </div>
      </div>

      <SectionLabel>Data labels</SectionLabel>
      <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
        {[
          { text: "LIVE", color: brand.colors.amber },
          { text: "RESOLVED", color: brand.colors.green },
          { text: "PENDING", color: brand.colors.grey400 },
          { text: "HOME WIN", color: brand.colors.green },
          { text: "X LAYER", color: brand.colors.green },
        ].map((tag) => (
          <span
            key={tag.text}
            style={{
              fontSize: "10px",
              color: tag.color,
              background: `${tag.color}18`,
              border: `1px solid ${tag.color}44`,
              padding: "4px 10px",
              borderRadius: "4px",
              letterSpacing: "0.15em",
              fontFamily: brand.fonts.body,
            }}
          >
            {tag.text}
          </span>
        ))}
      </div>
    </div>
  );
}

function SocialTab() {
  return (
    <div>
      <SectionLabel>X (Twitter) banner — 1500 × 500</SectionLabel>
      <div
        style={{
          width: "100%",
          aspectRatio: "3/1",
          maxWidth: "600px",
          background: `linear-gradient(135deg, ${brand.colors.obsidian} 0%, ${brand.colors.pitch} 50%, #0D2818 100%)`,
          borderRadius: "12px",
          border: `1px solid ${brand.colors.grey600}`,
          position: "relative",
          overflow: "hidden",
          marginBottom: "24px",
          display: "flex",
          alignItems: "center",
          padding: "0 40px",
        }}
      >
        {/* BG grid */}
        <svg
          style={{ position: "absolute", inset: 0, opacity: 0.15 }}
          width="100%"
          height="100%"
        >
          {[...Array(8)].map((_, i) => (
            <line
              key={i}
              x1={`${i * 14.3}%`}
              y1="0"
              x2={`${i * 14.3}%`}
              y2="100%"
              stroke={brand.colors.green}
              strokeWidth="0.5"
            />
          ))}
          {[...Array(4)].map((_, i) => (
            <line
              key={i}
              x1="0"
              y1={`${i * 33.3}%`}
              x2="100%"
              y2={`${i * 33.3}%`}
              stroke={brand.colors.green}
              strokeWidth="0.5"
            />
          ))}
        </svg>
        {/* Curve */}
        <svg
          style={{ position: "absolute", inset: 0, opacity: 0.4 }}
          width="100%"
          height="100%"
          viewBox="0 0 600 200"
        >
          <path
            d="M0 160 Q150 140 250 100 Q350 60 600 20"
            stroke={brand.colors.green}
            strokeWidth="1.5"
            fill="none"
            strokeDasharray="4 4"
          />
        </svg>
        <div style={{ position: "relative", zIndex: 1 }}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "12px",
              marginBottom: "8px",
            }}
          >
            <LogoMark size={40} />
            <div
              style={{
                fontFamily: brand.fonts.display,
                fontSize: "36px",
                letterSpacing: "0.08em",
                color: brand.colors.white,
              }}
            >
              CURVEKICK
            </div>
          </div>
          <div
            style={{
              fontSize: "11px",
              color: brand.colors.green,
              letterSpacing: "0.2em",
            }}
          >
            WORLD CUP PREDICTION MARKETS · BUILT ON X LAYER
          </div>
        </div>
        <div
          style={{
            position: "absolute",
            right: "40px",
            top: "50%",
            transform: "translateY(-50%)",
            textAlign: "right",
          }}
        >
          <div
            style={{
              fontFamily: brand.fonts.display,
              fontSize: "18px",
              color: brand.colors.green,
              letterSpacing: "0.05em",
            }}
          >
            104 MATCHES
          </div>
          <div
            style={{
              fontFamily: brand.fonts.display,
              fontSize: "18px",
              color: brand.colors.amber,
              letterSpacing: "0.05em",
            }}
          >
            3 CURVES EACH
          </div>
          <div
            style={{
              fontFamily: brand.fonts.display,
              fontSize: "18px",
              color: brand.colors.white,
              letterSpacing: "0.05em",
            }}
          >
            TRADE LIVE
          </div>
        </div>
      </div>

      <SectionLabel>X avatar — 400 × 400</SectionLabel>
      <div
        style={{
          width: "100px",
          height: "100px",
          borderRadius: "50%",
          background: brand.colors.obsidian,
          border: `2px solid ${brand.colors.grey600}`,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          marginBottom: "24px",
        }}
      >
        <LogoMark size={60} />
      </div>

      <SectionLabel>X bio copy</SectionLabel>
      <CodeBlock>{`World Cup prediction markets on bonding curves ⚽📈
HOME / DRAW / AWAY · Price moves with every trade
Built on @XLayerOfficial · #XCupHackathon`}</CodeBlock>

      <SectionLabel>Hashtag set</SectionLabel>
      <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
        {[
          "#CurveKick",
          "#XCupHackathon",
          "#WorldCup2026",
          "#XLayer",
          "#DeFi",
          "#PredictionMarket",
        ].map((tag) => (
          <span
            key={tag}
            style={{
              fontSize: "12px",
              color: brand.colors.green,
              background: brand.colors.greenMuted,
              border: `1px solid ${brand.colors.green}33`,
              padding: "4px 12px",
              borderRadius: "4px",
              fontFamily: brand.fonts.body,
            }}
          >
            {tag}
          </span>
        ))}
      </div>
    </div>
  );
}

// ── Helpers ──

function LogoVariant({ bg, label, children }) {
  const backgrounds = {
    dark: brand.colors.obsidian,
    light: "#F0F5F1",
    green: brand.colors.greenMuted,
  };
  return (
    <div
      style={{
        background: brand.colors.pitch,
        border: `1px solid ${brand.colors.grey600}`,
        borderRadius: "8px",
        overflow: "hidden",
      }}
    >
      <div
        style={{
          background: backgrounds[bg],
          height: "120px",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: "20px",
        }}
      >
        {children}
      </div>
      <div
        style={{
          padding: "10px 14px",
          fontSize: "10px",
          color: brand.colors.grey400,
          letterSpacing: "0.15em",
        }}
      >
        {label.toUpperCase()}
      </div>
    </div>
  );
}

function SectionLabel({ children }) {
  return (
    <div
      style={{
        fontSize: "10px",
        color: brand.colors.grey400,
        letterSpacing: "0.2em",
        textTransform: "uppercase",
        marginBottom: "14px",
        marginTop: "4px",
      }}
    >
      {children}
    </div>
  );
}

function CodeBlock({ children }) {
  const [copied, setCopied] = useState(false);
  return (
    <div
      style={{
        position: "relative",
        background: brand.colors.pitch,
        border: `1px solid ${brand.colors.grey600}`,
        borderRadius: "8px",
        padding: "16px 20px",
        marginBottom: "24px",
      }}
    >
      <button
        onClick={() => {
          navigator.clipboard.writeText(children);
          setCopied(true);
          setTimeout(() => setCopied(false), 1200);
        }}
        style={{
          position: "absolute",
          top: "10px",
          right: "12px",
          background: "none",
          border: `1px solid ${brand.colors.grey600}`,
          color: copied ? brand.colors.green : brand.colors.grey400,
          borderRadius: "4px",
          padding: "3px 10px",
          fontSize: "10px",
          fontFamily: brand.fonts.body,
          cursor: "pointer",
          letterSpacing: "0.1em",
        }}
      >
        {copied ? "COPIED" : "COPY"}
      </button>
      <pre
        style={{
          fontFamily: brand.fonts.body,
          fontSize: "12px",
          color: brand.colors.white,
          margin: 0,
          lineHeight: 1.7,
          overflowX: "auto",
          whiteSpace: "pre-wrap",
        }}
      >
        {children}
      </pre>
    </div>
  );
}
