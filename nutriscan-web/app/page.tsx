'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { AnimatePresence, motion } from 'framer-motion';
import { AlertCircle, LogIn, Sparkles } from 'lucide-react';
import Header from './components/Header';
import Footer from './components/Footer';
import NutriBot, { BotMood } from './components/NutriBot';
import BarcodeSearchBar from './components/BarcodeSearchBar';
import BarcodeScannerModal from './components/BarcodeScannerModal';
import ProductCard from './components/ProductCard';
import { Product } from '../types/product';
import { fetchProductByBarcode } from '../lib/api';
import { addGuestScan, getSession, updateSession, useSession } from '@/lib/auth';
import { addRecentSearch, useRecentSearches } from '@/lib/recent';
import { VegMark } from './components/VegBadge';

// Real products, so first-time visitors can see a result with one tap
const SAMPLES = [
  { label: 'Nutella', code: '3017620422003' },
  { label: 'Coca-Cola', code: '5449000000996' },
  { label: 'Quaker oats', code: '3168930009078' },
];

const STEPS = [
  { title: 'Scan', text: 'Point your camera at a barcode, upload a photo, or type the number.' },
  { title: 'Read', text: 'NutriBot turns the label into plain words: sugar, salt, fat, additives, allergens.' },
  { title: 'Swap', text: 'See better-rated products from the same shelf, and check them in one tap.' },
];

function moodFor(loading: boolean, error: string | null, product: Product | null): BotMood {
  if (loading) return 'scanning';
  if (error) return 'confused';
  if (!product) return 'idle';
  switch (product.nutriScore) {
    case 'A':
    case 'B':
      return 'great';
    case 'D':
    case 'E':
      return 'yikes';
    default:
      return 'okay';
  }
}

export default function NutriScanPage() {
  const session = useSession();
  const recents = useRecentSearches();
  const [barcode, setBarcode] = useState('');
  const [loading, setLoading] = useState(false);
  const [product, setProduct] = useState<Product | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isRateLimited, setIsRateLimited] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [guestScansLeft, setGuestScansLeft] = useState<number | null>(null);
  const [discoveryReward, setDiscoveryReward] = useState<{
    points: number;
    score: number;
  } | null>(null);

  const handleSearch = async (overrideCode?: string) => {
    const target = (overrideCode || barcode).trim();
    if (!target || loading) return;

    setLoading(true);
    setErrorMsg(null);
    setIsRateLimited(false);
    setDiscoveryReward(null);

    const result = await fetchProductByBarcode(target);

    if (result.error || !result.product) {
      setErrorMsg(result.error || 'Something went wrong. Please try again.');
      setIsRateLimited(Boolean(result.isRateLimited));
      setProduct(null);
      if (result.isRateLimited) setGuestScansLeft(0);
    } else {
      const found = result.product;
      setProduct(found);
      addRecentSearch(found);

      if (getSession()) {
        // Keep the header and dashboard XP in step with the server
        if (typeof found.totalScoutScore === 'number' && typeof found.totalUniqueDiscoveries === 'number') {
          updateSession({ scoutScore: found.totalScoutScore, uniqueDiscoveries: found.totalUniqueDiscoveries });
        }
        // Unique discoveries award scout points
        if (found.isNewDiscovery && (found.earnedPoints ?? 0) > 0) {
          setDiscoveryReward({ points: found.earnedPoints ?? 0, score: found.totalScoutScore ?? 0 });
        }
      } else {
        // Remember guest scans so they can be migrated after sign-in
        addGuestScan(found.barcode || target);
        if (typeof result.remainingScans === 'number') setGuestScansLeft(result.remainingScans);
      }
    }

    setLoading(false);
  };

  const scanCode = (code: string) => {
    setBarcode(code);
    handleSearch(code);
  };

  // Back to a blank page, ready for the next search
  const clearSearch = () => {
    setBarcode('');
    setProduct(null);
    setErrorMsg(null);
    setIsRateLimited(false);
    setDiscoveryReward(null);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Arriving from another page's Recent list: /?scan=<barcode>
  useEffect(() => {
    const code = new URLSearchParams(window.location.search).get('scan');
    if (!code) return;
    // Clean the URL only when the scan actually starts (dev mode runs effects twice)
    const timer = setTimeout(() => {
      window.history.replaceState(null, '', '/');
      scanCode(code);
    }, 0);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- run once on arrival
  }, []);

  const handleScanSuccess = (detectedBarcode: string) => {
    setIsModalOpen(false);
    scanCode(detectedBarcode);
  };

  const botMood = moodFor(loading, errorMsg, product);

  return (
    <main className="min-h-screen flex flex-col">
      <Header onPickRecent={scanCode} />

      <div className="flex-1 w-full max-w-6xl mx-auto px-4 sm:px-6 pt-10 sm:pt-14 pb-24">
        {/* Hero */}
        <section className="grid lg:grid-cols-[1.15fr_1fr] gap-10 lg:gap-14 items-center">
          <div>
            <p className="eyebrow text-leaf">Food label decoder</p>
            <h1 className="display text-[46px] sm:text-[66px] leading-[0.98] mt-4">
              What&apos;s <span className="italic text-leaf">really</span> in your food?
            </h1>
            <p className="mt-5 text-[17px] text-muted max-w-md leading-relaxed">
              Scan or type a barcode. NutriBot reads the label and tells you, in plain words, about
              sugar, salt, fat, allergens and better swaps.
            </p>

            <div className="mt-8">
              <BarcodeSearchBar
                barcode={barcode}
                setBarcode={setBarcode}
                onSearch={handleSearch}
                onOpenScannerModal={() => setIsModalOpen(true)}
                loading={loading}
                showClear={Boolean(product || errorMsg)}
                onClear={clearSearch}
              />
            </div>

            <div className="mt-5 flex flex-wrap items-center gap-2">
              <span className="text-[13px] text-muted mr-1">Try one:</span>
              {SAMPLES.map((sample) => (
                <button
                  key={sample.code}
                  type="button"
                  onClick={() => scanCode(sample.code)}
                  disabled={loading}
                  className={`chip disabled:opacity-50 disabled:cursor-not-allowed ${product?.barcode === sample.code ? 'chip-on' : ''}`}
                >
                  {sample.label}
                </button>
              ))}
            </div>

            {recents.length > 0 && (
              <div className="mt-3 flex flex-wrap items-center gap-2">
                <span className="text-[13px] text-muted mr-1">Recent:</span>
                {recents.slice(0, 5).map((item) => (
                  <button
                    key={item.barcode}
                    type="button"
                    onClick={() => scanCode(item.barcode)}
                    disabled={loading}
                    title={item.productName}
                    className={`chip max-w-[200px] disabled:opacity-50 disabled:cursor-not-allowed ${product?.barcode === item.barcode ? 'chip-on' : ''}`}
                  >
                    {(item.vegStatus === 'VEG' || item.vegStatus === 'NON_VEG') && <VegMark status={item.vegStatus} size={13} />}
                    <span className="truncate">{item.productName}</span>
                  </button>
                ))}
              </div>
            )}

            {!session && (
              <p className="mt-5 text-[13px] text-muted">
                {guestScansLeft === null
                  ? '5 free scans a day without an account.'
                  : `${guestScansLeft} free scan${guestScansLeft === 1 ? '' : 's'} left today.`}{' '}
                <Link href="/register" className="link text-[13px]">Join free</Link> for unlimited scans and allergy alerts.
              </p>
            )}
          </div>

          {/* Mascot */}
          <div className="rounded-[28px] bg-sage border border-line px-6 pt-6 pb-5 flex flex-col items-center">
            <NutriBot mood={botMood} grade={product?.nutriScore ?? null} size={250} />
            <p className="text-[12px] text-muted mt-2">Poke NutriBot for a trick, or drag it around.</p>
          </div>
        </section>

        {/* Discovery reward */}
        <AnimatePresence>
          {discoveryReward && (
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              className="mt-12 max-w-2xl flex items-center gap-4 p-4 rounded-2xl bg-leaf text-bg"
              role="status"
            >
              <span className="w-11 h-11 rounded-xl bg-bg text-leaf flex items-center justify-center shrink-0">
                <Sparkles className="w-5 h-5" />
              </span>
              <span>
                <span className="block font-display text-xl font-semibold">+{discoveryReward.points} XP · First discovery!</span>
                <span className="block text-sm opacity-85">
                  Nobody had scanned this one before you. You now have {discoveryReward.score} XP.
                </span>
              </span>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Errors & rate limiting */}
        {errorMsg && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            role="alert"
            className={`mt-12 max-w-2xl flex-col sm:flex-row sm:items-center justify-between ${
              isRateLimited ? 'notice-warn' : 'notice-error'
            }`}
          >
            <span className="flex items-start gap-3">
              <AlertCircle className={`w-5 h-5 shrink-0 mt-px ${isRateLimited ? 'text-sun' : 'text-clay'}`} />
              <span className="leading-snug">{errorMsg}</span>
            </span>
            {isRateLimited && (
              <Link href="/login?next=/" className="btn-primary btn-sm shrink-0">
                <LogIn className="w-3.5 h-3.5" />
                Sign in to keep going
              </Link>
            )}
          </motion.div>
        )}

        {/* Result */}
        <AnimatePresence mode="wait">
          {product && (
            <ProductCard key={product.barcode} product={product} signedIn={Boolean(session)} onScanBarcode={scanCode} />
          )}
        </AnimatePresence>

        {/* How it works (empty state) */}
        {!product && !errorMsg && (
          <section className="mt-20 grid sm:grid-cols-3 gap-6 border-t border-line pt-10" aria-label="How it works">
            {STEPS.map((step, i) => (
              <div key={step.title}>
                <span className="font-display text-[44px] leading-none text-leaf/30 font-semibold">0{i + 1}</span>
                <h2 className="display text-[24px] mt-2">{step.title}</h2>
                <p className="text-muted mt-1.5 leading-relaxed">{step.text}</p>
              </div>
            ))}
          </section>
        )}
      </div>

      <Footer />

      <BarcodeScannerModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onScanSuccess={handleScanSuccess}
      />
    </main>
  );
}
