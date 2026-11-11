// components/KarateAndKobudo/KarateAndKobudo.jsx
"use client";
import { useEffect, useState } from "react";
import { ImageWithFallback } from "./ImageWithFallback";
import "./KarateAndKobudo.scss";

const weaponSectionId = (weapon) => `kobudo-${weapon.toLowerCase()}`;

export default function KarateAndKobudo() {
  const [kobudoView, setKobudoView] = useState("all"); // "all" | "weapon"
  const [scrollTarget, setScrollTarget] = useState(null);

  useEffect(() => {
    window.scrollTo({ top: 0 });
  }, []);

  // After switching to weapon view, scroll to the requested weapon's list
  useEffect(() => {
    if (kobudoView !== "weapon" || !scrollTarget) return;
    const el = document.getElementById(weaponSectionId(scrollTarget));
    if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
    setScrollTarget(null);
  }, [kobudoView, scrollTarget]);

  const showWeaponKatas = (weapon) => {
    setKobudoView("weapon");
    setScrollTarget(weapon);
  };

  const kataList = [
    "Fukyu Gata Ichi",
    "Fukyu Gata Ni",
    "Fukyu Gata San",
    "Kihon Kata Ichi",
    "Kihon Kata Ni",
    "Kihon Kata San",
    "Kihon Kata Yon",
    "Kihon Kata Go",
    "Naihanchi Shodan",
    "Naihanchi Nidan",
    "Naihanchi Sandan",
    "Pinan Shodan",
    "Pinan Nidan",
    "Pinan Sandan",
    "Pinan Yondan",
    "Pinan Godan",
    "Pinan Godan Ni",
    "Itosu no Passai",
    "Matsumura no Passai",
    "Oyadomari Passai",
    "Kiyuna no Passai",
    "Gusukuma no Passai",
    "Asato no Passai",
    "Ishimine no Passai",
    "Kusanku Sho",
    "Kusanku Dai",
    "Chatanyara Kusanku",
    "Chinto",
    "Tomari Chinto",
    "Ananku",
    "Annan",
    "Wankan",
    "Chinti",
    "Jion",
    "Jitte",
    "Jiin",
    "Shochin",
    "Niseshi",
    "Sesan",
    "Unsu",
    "Tomari Rohai",
    "Itosu no Rohai Ichi",
    "Itosu no Rohai Ni",
    "Itosu no Rohai San",
    "Wanshu",
    "Tomari Wanshu Dai",
    "Tomari Wanshu Koryu",
    "Itosu Wanshu",
    "Gojushiho",
    "Yashu no Gojushiho",
    "Hakutsuru",
    "Shubu no Te",
    "Shuri Sanchin",
    "Nunfa",
  ];

  // Kobudo katas in the original handwritten order. Each kata is tagged with
  // its weapon only for the weapon-wise view; the default view keeps this order.
  const kobudoKataList = [
    { name: "Oshiro no Kon", weapon: "Bo" },
    { name: "Tenryu no Kon", weapon: "Bo" },
    { name: "Tsunakake no Kon", weapon: "Bo" },
    { name: "Shushi no Kon Sho", weapon: "Bo" },
    { name: "Shushi no Kon Dai", weapon: "Bo" },
    { name: "Shushi no Kon Ko", weapon: "Bo" },
    { name: "Sakugawa no Kon Sho", weapon: "Bo" },
    { name: "Sakugawa no Kon Chu", weapon: "Bo" },
    { name: "Sakugawa no Kon Dai", weapon: "Bo" },
    { name: "Sakugawa no Kon Ko", weapon: "Bo" },
    { name: "Shubu no Kon Sho", weapon: "Bo" },
    { name: "Chikin Bo Ichi", weapon: "Bo" },
    { name: "Chikin Bo Ni", weapon: "Bo" },
    { name: "Hakutaru no Kon Sho", weapon: "Bo" },
    { name: "Urasoe no Kon", weapon: "Bo" },
    { name: "Tsuyoshi no Kon", weapon: "Bo" },
    { name: "Choun no Kon", weapon: "Bo" },
    { name: "Gusan", weapon: "Gusan" },
    { name: "Eku", weapon: "Eku" },
    { name: "Tsoeshi no Kon Sho", weapon: "Bo" },
    { name: "Matsumura no Sai Ichi", weapon: "Sai" },
    { name: "Matsumura no Sai Ni", weapon: "Sai" },
    { name: "Tawada no Sai", weapon: "Sai" },
    { name: "Chatan Yara no Sai", weapon: "Sai" },
    { name: "Hamahiga no Sai", weapon: "Sai" },
    { name: "Yaka-a no Sai", weapon: "Sai" },
    { name: "Kozo no Sanbon Sai", weapon: "Sai" },
    { name: "Yara Guwa no Tunfa", weapon: "Tonfa" },
    { name: "Maezato Guwa no Nunchaku", weapon: "Nunchaku" },
    { name: "Shubu no Nunchaku", weapon: "Nunchaku" },
    { name: "Toyama no Nicho Gama", weapon: "Kama" },
    { name: "Kanegawa no Nicho Gama Sho", weapon: "Kama" },
    { name: "Kanegawa no Nicho Gama Dai", weapon: "Kama" },
    { name: "Shubu no Nicho Gama", weapon: "Kama" },
    { name: "Hakutaru no Kon Dai", weapon: "Bo" },
    { name: "Tsoeshi no Kon Dai", weapon: "Bo" },
    { name: "Hanta Gawa no Kon Sai", weapon: "Sai" },
    { name: "Chikin Shita Haku no Sai", weapon: "Sai" },
    { name: "Tsesoko no Kon", weapon: "Bo" },
    { name: "Chatan Yara no Kon", weapon: "Bo" },
    { name: "Chinen Tshichanaka no Kon", weapon: "Bo" },
    { name: "Tsikiya Naka no Kon", weapon: "Bo" },
    { name: "Shubu no Tinpe", weapon: "Tinpe" },
    { name: "Shubu no Kon Dai", weapon: "Bo" },
    { name: "Hamahiga no Tunfa", weapon: "Tonfa" },
  ];

  const kobudoWeaponOrder = [
    "Bo",
    "Sai",
    "Tonfa",
    "Nunchaku",
    "Kama",
    "Tinpe",
    "Eku",
    "Gusan",
  ];

  const kobudoKataGroups = kobudoWeaponOrder
    .map((weapon) => ({
      weapon,
      katas: kobudoKataList
        .filter((kata) => kata.weapon === weapon)
        .map((kata) => kata.name),
    }))
    .filter((group) => group.katas.length > 0);

  const kobudoKataCount = kobudoKataList.length;

  const renderKataTile = (kata, i) => (
    <li key={kata} className="kk-kata">
      <span className="kk-kata-num">{String(i + 1).padStart(2, "0")}</span>
      <span className="kk-kata-name">{kata}</span>
    </li>
  );

  const elements = [
    {
      kanji: "基本",
      name: "Kihon Dosa",
      subtitle: "Basic Techniques",
      description:
        "In the study of basics Karateka learn block (uke), strike (uchi), kick (Keri), stance (Tachi/Dachi), Punch (Tsuki).",
      details: [
        {
          label: "Stances",
          value:
            "Siko Dachi, Neko Ashi Dachi, Zenkutsu Dachi, Kosa Dachi, Kokutsu Dachi",
        },
        {
          label: "Blocks",
          value: "Age uke, Soto uke, Uchi uke, Gedan uke, Shuto uke",
        },
        { label: "Kicks", value: "Mae keri, Mawashi keri, Kansetsu keri" },
      ],
    },
    {
      kanji: "型",
      name: "Kata",
      subtitle: "Predesigned Forms",
      description:
        "Kata is predesigned form using kihons. There are lot of katas in Shubukan School. We practice above 50 katas in shubukan Shorin Ryu.",
      details: [
        {
          label: "54+ Katas",
          value:
            "Including Fukyugata, Pinan, Passai, Kushanku, Rohai, and Wanshu",
        },
      ],
    },
    {
      kanji: "組手",
      name: "Kumite",
      subtitle: "Sparring & Fighting",
      description:
        "Kumite means sparring or fighting. Shubukan maintain traditional old style full contact kumite.",
      details: [
        {
          label: "Self Defense",
          value:
            "With care Shubukan focus on self defense and teaches its members the true practical application of katas in effective way.",
        },
      ],
    },
  ];

  const weapons = [
    {
      name: "Bo",
      description: "Long stick. There are lot of Bo katas in shubukan.",
      image: "./karate&kobudo/bo.png",
    },
    {
      name: "Kama",
      description: "It is sickle. Previously it was used in farming.",
      image: "./karate&kobudo/kama.png",
    },
    {
      name: "Sai",
      description:
        "Fully metal weapon. Sai is excellent defense tool against long weapon and sword.",
      image: "./karate&kobudo/sai.png",
    },
    {
      name: "Tonfa",
      description: "It is a wooden weapon. Shubukan has many tonfa katas.",
      image: "./karate&kobudo/tonfa2.png",
    },
    {
      name: "Eku",
      description:
        "It is fisherman's tool used for rowing. In Okinawan kobudo it used as a excellent weapon.",
      image: "./karate&kobudo/eku.png",
    },
    {
      name: "Nunchaku",
      description:
        "It is a wooden weapon. Very important weapon of Okinawa kobudo.",
      image: "./karate&kobudo/nunchuck.png",
    },
  ];

  return (
    <main className="kk-page">
      {/* Karate hero */}
      <section className="kk-hero">
        <h1 className="kk-title">Karate</h1>
        <span className="kk-kanji" lang="ja">
          空手
        </span>
        <img
          src="/assets/home/red_line_1.webp"
          alt=""
          className="underline underline--1 remove-bg"
        />
        <p className="kk-body kk-lead">
          Karate means Empty hand. Karate makes its practitioner physically and
          mentally strong along with strong ethical and moral values. Basically
          karateka use legs and hand parts for block, strike, hold, throw etc.
        </p>
      </section>

      {/* Three elements */}
      <section className="kk-section kk-center">
        <h2 className="heading heading--way kk-amarante">
          Three Elements of Karate
        </h2>
        <img
          src="/assets/home/red_line_2.webp"
          alt=""
          className="underline underline--2 remove-bg"
        />

        <div className="kk-elements">
          {elements.map((element, index) => (
            <div key={element.name} className="kk-element-wrap">
              {index > 0 && (
                <div className="line-vert line-vert--2 kk-element-line">
                  <div className="line-in"></div>
                </div>
              )}
              <div className="kk-element">
                <span className="value-kanji kk-kouzan" lang="ja">
                  {element.kanji}
                </span>
                <h3 className="value-eng kk-amarante">{element.name}</h3>
                <span className="kk-subtitle">{element.subtitle}</span>
                <p className="kk-text">{element.description}</p>
                <dl className="kk-details">
                  {element.details.map((detail) => (
                    <div key={detail.label}>
                      <dt className="kk-detail-label">{detail.label}</dt>
                      <dd className="kk-text kk-text--sm">{detail.value}</dd>
                    </div>
                  ))}
                </dl>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Karate kata list */}
      <section className="kk-section">
        <div className="kk-section-nav">
          <div className="kk-section-title">
            <h2 className="heading heading--sm kk-amarante">Kata Curriculum</h2>
            <span className="kk-count">
              All {kataList.length} katas of Shubukan Shorin Ryu
            </span>
            <img
              src="/assets/home/red_line_3.webp"
              alt=""
              className="underline underline--3 remove-bg"
            />
          </div>
        </div>

        <ol className="kk-kata-grid">
          {kataList.map((kata, i) => renderKataTile(kata, i))}
        </ol>
      </section>

      {/* Kobudo hero */}
      <section className="kk-hero kk-hero--kobudo">
        <h2 className="kk-title">Kobudo</h2>
        <span className="kk-kanji" lang="ja">
          古武道
        </span>
        <img
          src="/assets/home/red_line_1.webp"
          alt=""
          className="underline underline--1 remove-bg"
        />
        <p className="kk-body kk-lead">
          Shubukan has many kobudo katas also. We shubukani studies these kata
          in a practical and applicable way. There are many weapons we use in
          shubukan school.
        </p>
      </section>

      {/* Weapons */}
      <section className="kk-section kk-center">
        <h2 className="heading heading--way kk-amarante">Weapons</h2>
        <img
          src="/assets/home/red_line_2.webp"
          alt=""
          className="underline underline--2 remove-bg"
        />

        <div className="kk-weapons">
          {weapons.map((weapon) => (
            <button
              key={weapon.name}
              type="button"
              aria-label={`Show ${weapon.name} katas`}
              onClick={() => showWeaponKatas(weapon.name)}
              className="kk-weapon"
            >
              <span className="kk-weapon-img">
                <ImageWithFallback
                  src={weapon.image}
                  alt=""
                  className="remove-bg"
                />
              </span>
              <span className="kk-weapon-name kk-amarante">{weapon.name}</span>
              <span className="kk-text kk-weapon-desc">
                {weapon.description}
              </span>
              <span className="link kk-amarante kk-weapon-link">
                View {weapon.name} katas →
              </span>
            </button>
          ))}
        </div>
      </section>

      {/* Kobudo kata list */}
      <section className="kk-section">
        <div className="kk-section-nav">
          <div className="kk-section-title">
            <h2 className="heading heading--sm kk-amarante">
              Kobudo Kata Curriculum
            </h2>
            <span className="kk-count">
              All {kobudoKataCount} kobudo katas of Shubukan
            </span>
            <img
              src="/assets/home/red_line_3.webp"
              alt=""
              className="underline underline--3 remove-bg"
            />
          </div>

          <div
            role="group"
            aria-label="Kobudo kata view"
            className="kk-toggle"
          >
            {/* Sliding indicator behind the active option */}
            <span
              aria-hidden="true"
              className={`kk-toggle-pill ${
                kobudoView === "weapon" ? "kk-toggle-pill--right" : ""
              }`}
            />
            {[
              { key: "all", label: "All Katas" },
              { key: "weapon", label: "Weapon Wise" },
            ].map((option) => (
              <button
                key={option.key}
                type="button"
                aria-pressed={kobudoView === option.key}
                onClick={() => setKobudoView(option.key)}
                className={`kk-toggle-btn ${
                  kobudoView === option.key ? "kk-toggle-btn--active" : ""
                }`}
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>

        {kobudoView === "all" ? (
          <ol className="kk-kata-grid">
            {kobudoKataList.map((kata, i) => renderKataTile(kata.name, i))}
          </ol>
        ) : (
          <div className="kk-groups">
            {kobudoKataGroups.map((group) => (
              <div
                key={group.weapon}
                id={weaponSectionId(group.weapon)}
                className="kk-group"
              >
                <div className="kk-group-head">
                  <h3 className="kk-group-name kk-amarante">{group.weapon}</h3>
                  <span className="kk-group-count">
                    {group.katas.length}{" "}
                    {group.katas.length === 1 ? "kata" : "katas"}
                  </span>
                </div>
                <ol className="kk-kata-grid">
                  {group.katas.map((kata, i) => renderKataTile(kata, i))}
                </ol>
              </div>
            ))}
          </div>
        )}
      </section>

      <footer className="kk-footer">
        <img
          src="/assets/home/red_line_2.webp"
          alt=""
          className="underline underline--2 remove-bg"
        />
        <span className="value-eng kk-amarante">Shubukan Shorin Ryu</span>
        <span className="kk-footer-sub">
          Traditional Okinawan Karate &amp; Kobudo
        </span>
      </footer>
    </main>
  );
}
