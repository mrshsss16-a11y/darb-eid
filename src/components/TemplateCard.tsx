'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { ArrowLeft, Sparkles } from 'lucide-react';
import { TemplateCanvas } from './TemplateCanvas';
import type { Template } from '@/templates/types';

interface Props {
  template: Template;
  index: number;
}

/**
 * Compact preview card shown in the gallery. Renders a downscaled
 * TemplateCanvas as the thumbnail so the user sees a true representation
 * (not a generic placeholder).
 */
export function TemplateCard({ template, index }: Props) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: index * 0.06, ease: [0.16, 1, 0.3, 1] }}
    >
      <Link
        href={`/editor/${template.id}`}
        className="group block card-surface overflow-hidden hover:shadow-card transition-all duration-300 hover:-translate-y-1"
      >
        <div className="relative aspect-square bg-ink-100 dark:bg-ink-900 overflow-hidden">
          {/* TemplateCanvas at scale that fits 360px wide thumbnails. */}
          <div className="absolute inset-0 flex items-center justify-center">
            <TemplateCanvas
              template={template}
              employeeName=""
              format="square"
              nameStyle={template.defaultNameStyle}
              pixelWidth={360}
            />
          </div>

          {/* Hover overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-ink-900/80 via-ink-900/0 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end p-4">
            <div className="flex items-center gap-2 text-white font-bold">
              <Sparkles className="h-4 w-4" />
              <span>إنشاء البطاقة</span>
              <ArrowLeft className="h-4 w-4 group-hover:-translate-x-1 transition-transform" />
            </div>
          </div>
        </div>

        <div className="p-4 sm:p-5">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0 flex-1">
              <h3 className="font-display font-extrabold text-lg text-ink-900 dark:text-ink-50 truncate">
                {template.title}
              </h3>
              <p className="text-xs text-ink-500 dark:text-ink-400 mt-1 truncate">
                {template.occasion}
              </p>
            </div>
            <span
              className="shrink-0 inline-block w-3 h-3 rounded-full mt-2 ring-2 ring-white dark:ring-ink-900"
              style={{ background: template.palette.accent }}
              aria-hidden
            />
          </div>
        </div>
      </Link>
    </motion.div>
  );
}
