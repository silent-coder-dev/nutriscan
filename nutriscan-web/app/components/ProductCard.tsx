'use client';

import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Package, Sparkles } from 'lucide-react';
import { Product } from '../../types/product';
import { getProductInsights, errorMessage, ProductInsights as Insights } from '@/lib/api';
import NutriScoreBadge from './NutriScoreBadge';
import NutrientGrid from './NutrientGrid';
import HealthMeter from './HealthMeter';
import ProductAlternatives from './ProductAlternatives';
import IngredientSection from './IngredientSection';
import VegBadge from './VegBadge';
import ProductInsights from './ProductInsights';

interface ProductCardProps {
  product: Product;
  signedIn: boolean;
  onScanBarcode: (barcode: string) => void;
}

const VERDICT_STYLE: Record<string, string> = {
  Clean: 'bg-river/10 text-river border-river/40',
  Moderate: 'bg-sun/10 text-sun border-sun/40',
  Avoid: 'bg-clay/10 text-clay border-clay/40',
};

export default function ProductCard({ product, signedIn, onScanBarcode }: ProductCardProps) {
  const [imgFailed, setImgFailed] = useState(false);
  const [insights, setInsights] = useState<Insights | null>(null);
  const [insightsLoading, setInsightsLoading] = useState(true);
  const [insightsError, setInsightsError] = useState<string | null>(null);
  const isAiEstimate = product.source === 'AI_ESTIMATE';

  // One fetch per product (the card is keyed by barcode); re-runs when the user signs in/out
  useEffect(() => {
    const controller = new AbortController();
    getProductInsights(product.barcode, controller.signal)
      .then((data) => {
        setInsights(data);
        setInsightsError(null);
      })
      .catch((err) => {
        if (controller.signal.aborted) return;
        setInsightsError(errorMessage(err, 'The analysis is not available right now.'));
      })
      .finally(() => {
        if (!controller.signal.aborted) setInsightsLoading(false);
      });
    return () => controller.abort();
  }, [product.barcode, signedIn]);

  const pickAlternative = (barcode: string) => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
    onScanBarcode(barcode);
  };

  return (
    <motion.article
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 10 }}
      transition={{ duration: 0.35, ease: 'easeOut' }}
      className="mt-14"
      aria-label={`Results for ${product.productName}`}
    >
      {isAiEstimate && (
        <div className="notice-warn mb-5" role="note">
          <Sparkles className="w-4 h-4 shrink-0 text-sun mt-0.5" />
          <span>
            This product isn&apos;t in the Open Food Facts database yet, so these values are an
            AI estimate. Check the label before relying on them.
          </span>
        </div>
      )}

      {/* Identity */}
      <div className="panel p-5 sm:p-7 grid sm:grid-cols-[auto_1fr] gap-6 items-center">
        <div className="w-32 h-32 rounded-2xl bg-white border border-line overflow-hidden flex items-center justify-center shrink-0">
          {product.imageUrl && !imgFailed ? (
            // Plain <img>: product photos come from many Open Food Facts image hosts
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={product.imageUrl}
              alt={product.productName}
              loading="lazy"
              referrerPolicy="no-referrer"
              className="w-full h-full object-contain p-2.5"
              onError={() => setImgFailed(true)}
            />
          ) : (
            <span className="flex flex-col items-center text-dim">
              <Package className="w-9 h-9" />
              <span className="font-mono text-[9px] uppercase mt-1">No photo</span>
            </span>
          )}
        </div>

        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <span className="tag text-leaf">{product.brand || 'Unbranded'}</span>
            {insights && (
              <span className={`tag ${VERDICT_STYLE[insights.verdict] ?? VERDICT_STYLE.Moderate}`}>{insights.verdict}</span>
            )}
            {isAiEstimate && <span className="tag text-sun">AI estimate</span>}
            <span className="font-mono text-[11px] text-dim">#{product.barcode}</span>
          </div>
          <h2 className="display text-[32px] sm:text-[42px] leading-[1.02] mt-3 break-words">
            {product.productName}
          </h2>
          <div className="mt-5 flex flex-wrap items-center gap-x-6 gap-y-3">
            <NutriScoreBadge score={product.nutriScore} />
            <VegBadge status={product.vegStatus} />
          </div>
        </div>
      </div>

      <div className="grid lg:grid-cols-[1fr_320px] gap-5 mt-5 items-start">
        <div className="space-y-5 min-w-0">
          <ProductInsights insights={insights} loading={insightsLoading} error={insightsError} signedIn={signedIn} />
          <HealthMeter
            calories={product.calories100g}
            sugars={product.sugars100g}
            fat={product.fat100g}
            sodium={product.sodium100g}
          />
          <IngredientSection
            allergens={product.allergens}
            ingredientsText={product.ingredientsText}
            simplifiedIngredients={product.simplifiedIngredients}
          />
        </div>

        <div className="lg:sticky lg:top-24">
          <NutrientGrid
            calories={product.calories100g}
            sugars={product.sugars100g}
            fat={product.fat100g}
            proteins={product.proteins100g}
            sodium={product.sodium100g}
          />
        </div>
      </div>

      <div className="mt-5">
        <ProductAlternatives
          score={product.nutriScore}
          productName={product.productName}
          alternatives={insights?.alternatives ?? []}
          category={insights?.alternativesCategory ?? null}
          loading={insightsLoading}
          onPick={pickAlternative}
        />
      </div>
    </motion.article>
  );
}
