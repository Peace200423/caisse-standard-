"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { motion, useInView } from "framer-motion";

const FEATURES = [
  { icon: "🎯", title: "Cadre logique complet", text: "Structurez Impact, Effets, Extrants et Activités — le format attendu par les bailleurs, pas juste une liste à plat." },
  { icon: "🌍", title: "Indicateurs liés aux ODD", text: "Rattachez chaque indicateur aux 17 Objectifs de Développement Durable, en un clic." },
  { icon: "📎", title: "Preuves jointes", text: "Attachez une photo ou un document justificatif à chaque relevé — un vrai dossier d'audit, pas juste des chiffres." },
  { icon: "🔗", title: "Mode bailleur", text: "Partagez un lien public en lecture seule à vos bailleurs, sans qu'ils créent de compte." },
  { icon: "📡", title: "Collecte terrain hors-ligne", text: "Vos agents saisissent les données sur le terrain, même sans réseau. La synchronisation se fait toute seule." },
  { icon: "✅", title: "Validation hiérarchique", text: "Agent terrain saisit, superviseur valide. Un vrai circuit de contrôle, avec des rôles distincts par membre." },
];

const STEPS = [
  { n: "01", title: "Créez votre espace", text: "Nom de l'association, votre email, votre code d'accès. Deux minutes, pas de carte bancaire." },
  { n: "02", title: "Structurez vos objectifs", text: "Impact, effets, extrants, activités — et les indicateurs qui vont avec, liés aux ODD si besoin." },
  { n: "03", title: "Suivez, prouvez, partagez", text: "Vos agents saisissent sur le terrain, vous validez, vous exportez ou partagez en un lien." },
];

function useCountUp(target: number, inView: boolean, duration = 1200) {
  const [value, setValue] = useState(0);
  useEffect(() => {
    if (!inView) return;
    let start: number | null = null;
    let raf: number;
    const step = (t: number) => {
      if (start === null) start = t;
      const progress = Math.min((t - start) / duration, 1);
      setValue(Math.round(target * (1 - Math.pow(1 - progress, 3))));
      if (progress < 1) raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [inView, target, duration]);
  return value;
}

function Stat({ value, suffix, label }: { value: number; suffix: string; label: string }) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-40px" });
  const n = useCountUp(value, inView);
  return (
    <div ref={ref} className="text-center">
      <div className="font-mono text-3xl md:text-4xl text-teal font-semibold">
        {n}{suffix}
      </div>
      <div className="text-[11px] uppercase tracking-wide text-inksoft mt-1">{label}</div>
    </div>
  );
}

function MockDashboard() {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-80px" });
  const bars = [72, 45, 90, 33, 61];
  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 40, rotate: -2 }}
      animate={inView ? { opacity: 1, y: 0, rotate: -1 } : {}}
      transition={{ duration: 0.7, ease: "easeOut" }}
      className="bg-panel border border-white/10 rounded-2xl p-6 max-w-md w-full shadow-glass"
    >
      <div className="flex justify-between items-center mb-4">
        <div className="font-mono text-[10px] uppercase tracking-widest text-ochre">Aperçu · Cadre logique</div>
        <div className="flex gap-1">
          <span className="w-2 h-2 rounded-full bg-teal/70" />
          <span className="w-2 h-2 rounded-full bg-ochre/70" />
          <span className="w-2 h-2 rounded-full bg-rust/70" />
        </div>
      </div>
      <div className="space-y-3">
        {bars.map((pct, i) => (
          <div key={i}>
            <div className="flex justify-between text-[11px] text-inksoft mb-1">
              <span>Indicateur {i + 1}</span>
              <span className="font-mono">{pct}%</span>
            </div>
            <div className="h-2 rounded bg-white/5 overflow-hidden">
              <motion.div
                className="h-full bg-gradient-to-r from-[#3E8E71] to-teal rounded"
                initial={{ width: 0 }}
                animate={inView ? { width: `${pct}%` } : {}}
                transition={{ duration: 1, delay: 0.2 + i * 0.12, ease: "easeOut" }}
              />
            </div>
          </div>
        ))}
      </div>
      <div className="flex gap-1.5 mt-4">
        {[6, 3, 13].map((n) => (
          <span key={n} className="text-[9px] font-mono px-1.5 py-0.5 rounded border border-teal/40 text-teal">ODD {n}</span>
        ))}
      </div>
    </motion.div>
  );
}

export default function LandingPage() {
  return (
    <main className="bg-bg text-ink overflow-hidden relative">
      {/* Blobs animés en fond */}
      <div className="pointer-events-none fixed inset-0 -z-10">
        <motion.div
          className="absolute w-[500px] h-[500px] rounded-full bg-teal/20 blur-[120px]"
          style={{ top: "-10%", left: "-10%" }}
          animate={{ x: [0, 60, 0], y: [0, 40, 0] }}
          transition={{ duration: 18, repeat: Infinity, ease: "easeInOut" }}
        />
        <motion.div
          className="absolute w-[420px] h-[420px] rounded-full bg-ochre/15 blur-[120px]"
          style={{ top: "20%", right: "-10%" }}
          animate={{ x: [0, -50, 0], y: [0, 60, 0] }}
          transition={{ duration: 22, repeat: Infinity, ease: "easeInOut" }}
        />
        <motion.div
          className="absolute w-[380px] h-[380px] rounded-full bg-teal/10 blur-[120px]"
          style={{ bottom: "-10%", left: "30%" }}
          animate={{ x: [0, 40, 0], y: [0, -30, 0] }}
          transition={{ duration: 20, repeat: Infinity, ease: "easeInOut" }}
        />
      </div>

      {/* Nav */}
      <nav className="sticky top-0 z-40 backdrop-blur-glass bg-bg/60 border-b border-white/10">
        <div className="max-w-6xl mx-auto px-6 py-4 flex justify-between items-center">
          <span className="font-mono text-xs uppercase tracking-[0.16em] text-ochre">KRÉA.AI · Suivi & Évaluation</span>
          <div className="flex items-center gap-5 text-sm">
            <a href="#fonctionnalites" className="text-inksoft hover:text-teal transition hidden sm:inline">Fonctionnalités</a>
            <a href="#tarifs" className="text-inksoft hover:text-teal transition hidden sm:inline">Tarifs</a>
            <Link href="/login" className="text-inksoft hover:text-teal transition">Se connecter</Link>
            <Link href="/register" className="bg-teal text-[#0E1A14] font-semibold px-4 py-1.5 rounded-lg hover:opacity-90 transition">
              Créer mon espace
            </Link>
          </div>
        </div>
      </nav>

      {/* HERO */}
      <section className="max-w-6xl mx-auto px-6 pt-20 pb-24 grid lg:grid-cols-2 gap-12 items-center">
        <div>
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="font-mono text-xs tracking-[0.2em] uppercase text-ochre mb-6"
          >
            Fait pour les associations francophones
          </motion.div>
          <motion.h1
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.1 }}
            className="font-serif text-4xl md:text-6xl leading-[1.05] mb-6"
          >
            Le tableau de bord qui{" "}
            <span className="bg-gradient-to-r from-teal via-[#7FD1B4] to-ochre bg-clip-text text-transparent">
              prouve l&apos;impact
            </span>{" "}
            de votre association
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.25 }}
            className="text-inksoft text-lg max-w-xl mb-10"
          >
            Cadre logique, ODD, preuves de terrain, validation hiérarchique et rapports prêts
            pour vos bailleurs — en français, pensé pour les associations et petites structures.
          </motion.p>
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.35 }}
            className="flex gap-4 flex-wrap mb-14"
          >
            <Link href="/register" className="bg-teal text-[#0E1A14] font-semibold px-7 py-3 rounded-lg hover:opacity-90 hover:scale-[1.03] transition-all">
              Créer mon espace — gratuit
            </Link>
            <a href="#fonctionnalites" className="border border-white/15 px-7 py-3 rounded-lg hover:border-teal hover:text-teal transition">
              Voir comment ça marche
            </a>
          </motion.div>
          <div className="grid grid-cols-3 gap-6 max-w-sm">
            <Stat value={17} suffix="" label="ODD couverts" />
            <Stat value={100} suffix="%" label="Hors-ligne capable" />
            <Stat value={3} suffix="" label="Rôles d'équipe" />
          </div>
        </div>
        <div className="flex justify-center lg:justify-end">
          <MockDashboard />
        </div>
      </section>

      {/* FEATURES */}
      <section id="fonctionnalites" className="max-w-6xl mx-auto px-6 py-20 border-t border-white/10">
        <motion.h2
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-60px" }}
          transition={{ duration: 0.5 }}
          className="font-serif text-3xl mb-12 text-center"
        >
          Tout ce qu&apos;il faut pour piloter votre impact
        </motion.h2>
        <div className="grid md:grid-cols-3 gap-6">
          {FEATURES.map((f, i) => (
            <motion.div
              key={f.title}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-40px" }}
              transition={{ duration: 0.5, delay: i * 0.07 }}
              whileHover={{ y: -4 }}
              className="bg-panel border border-white/10 rounded-xl p-6 transition-shadow hover:shadow-glass"
            >
              <div className="text-2xl mb-3">{f.icon}</div>
              <h3 className="font-semibold mb-2">{f.title}</h3>
              <p className="text-sm text-inksoft leading-relaxed">{f.text}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section className="max-w-6xl mx-auto px-6 py-20 border-t border-white/10">
        <motion.h2
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-60px" }}
          transition={{ duration: 0.5 }}
          className="font-serif text-3xl mb-12 text-center"
        >
          Trois étapes, pas plus
        </motion.h2>
        <div className="grid md:grid-cols-3 gap-8">
          {STEPS.map((s, i) => (
            <motion.div
              key={s.n}
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true, margin: "-40px" }}
              transition={{ duration: 0.5, delay: i * 0.12 }}
            >
              <div className="font-mono text-4xl text-ochre/50 mb-3">{s.n}</div>
              <h3 className="font-semibold text-lg mb-2">{s.title}</h3>
              <p className="text-sm text-inksoft leading-relaxed">{s.text}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* PRICING */}
      <section id="tarifs" className="max-w-4xl mx-auto px-6 py-20 border-t border-white/10">
        <motion.h2
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-60px" }}
          transition={{ duration: 0.5 }}
          className="font-serif text-3xl mb-4 text-center"
        >
          Une tarification simple
        </motion.h2>
        <p className="text-inksoft text-center mb-12 max-w-lg mx-auto">
          Gratuit pour démarrer. Aucune carte bancaire requise. Le plan Pro se discute directement
          avec l&apos;équipe KRÉA.AI selon la taille de votre structure.
        </p>
        <div className="grid md:grid-cols-2 gap-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-40px" }}
            transition={{ duration: 0.5 }}
            className="bg-panel border border-white/10 rounded-xl p-8"
          >
            <div className="font-mono text-xs uppercase text-inksoft mb-2">Gratuit</div>
            <div className="font-serif text-3xl mb-4">0 FCFA</div>
            <ul className="text-sm text-inksoft space-y-2 mb-8">
              <li>✓ Objectifs & indicateurs illimités</li>
              <li>✓ Cadre logique complet + ODD</li>
              <li>✓ Preuves jointes & mode bailleur</li>
              <li>✓ Collecte terrain hors-ligne</li>
              <li>✓ Export Excel & PDF</li>
              <li>✓ Membres à rôles illimités</li>
            </ul>
            <Link href="/register" className="block text-center border border-white/15 rounded-lg py-2.5 hover:border-teal hover:text-teal transition">
              Créer mon espace
            </Link>
          </motion.div>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-40px" }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="bg-panel border border-ochre/50 rounded-xl p-8 relative"
          >
            <div className="absolute -top-3 right-6 bg-ochre text-[#231703] text-xs font-semibold px-3 py-1 rounded-full">
              Pour les réseaux d&apos;associations
            </div>
            <div className="font-mono text-xs uppercase text-inksoft mb-2">Pro / Sur mesure</div>
            <div className="font-serif text-3xl mb-4">Sur devis</div>
            <ul className="text-sm text-inksoft space-y-2 mb-8">
              <li>✓ Tout le plan Gratuit</li>
              <li>✓ Accompagnement à la mise en place</li>
              <li>✓ Formation de votre équipe</li>
              <li>✓ Personnalisation de la marque (branding KRÉA.AI)</li>
              <li>✓ Support prioritaire</li>
            </ul>
            <a
              href="https://wa.me/?text=Bonjour%2C%20je%20suis%20int%C3%A9ress%C3%A9%20par%20le%20plan%20Pro%20du%20Carnet%20Suivi%20%26%20%C3%89valuation"
              target="_blank"
              rel="noopener noreferrer"
              className="block text-center bg-ochre text-[#231703] font-semibold rounded-lg py-2.5 hover:opacity-90 transition"
            >
              Nous contacter
            </a>
          </motion.div>
        </div>
      </section>

      {/* CTA FINAL */}
      <section className="max-w-3xl mx-auto px-6 py-24 text-center">
        <motion.h2
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-60px" }}
          transition={{ duration: 0.5 }}
          className="font-serif text-3xl mb-6"
        >
          Prêt à montrer votre impact ?
        </motion.h2>
        <Link href="/register" className="inline-block bg-teal text-[#0E1A14] font-semibold px-8 py-3.5 rounded-lg hover:opacity-90 hover:scale-[1.03] transition-all">
          Commencer maintenant — gratuit
        </Link>
      </section>

      <footer className="text-center text-xs text-inksoft/60 py-10 border-t border-white/10">
        Propulsé par KRÉA.AI — agence de branding IA pour l&apos;Afrique francophone.
      </footer>
    </main>
  );
}
