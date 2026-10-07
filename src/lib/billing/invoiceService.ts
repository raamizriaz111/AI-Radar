// =============================================================================
// AI Radar — Phase 8: Invoice Service
// =============================================================================

import type { Invoice, InvoiceStatus } from './types';
import { isDatabaseConfigured, isServiceKeyConfigured } from '@/lib/supabase/config';
import { createClient } from '@/lib/supabase/server';
import { createServiceClient } from '@/lib/supabase/service';
import { logger } from '@/lib/services/logger';

// In-memory fallback
const inMemoryInvoices: Map<string, Invoice[]> = new Map(); // userId -> Invoice[]
let invoiceCounter = 0;

/**
 * Gets invoices for a user.
 */
export async function getUserInvoices(userId: string, limit = 24): Promise<Invoice[]> {
  const cached = inMemoryInvoices.get(userId);
  if (cached && cached.length > 0) return cached.slice(0, limit);

  if (isDatabaseConfigured()) {
    try {
      const supabase = await createClient();
      const { data, error } = await supabase
        .from('invoices')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(limit);

      if (!error && data && data.length > 0) {
        const invoices = data.map(mapDbInvoice);
        inMemoryInvoices.set(userId, invoices);
        return invoices;
      }
    } catch (err) {
      logger.debug('Failed to fetch invoices from db', err instanceof Error ? { error: err.message } : undefined);
    }
  }

  return inMemoryInvoices.get(userId) ?? [];
}

/**
 * Creates or updates an invoice record.
 */
export async function upsertInvoice(invoice: Omit<Invoice, 'id' | 'createdAt' | 'updatedAt'>): Promise<Invoice> {
  const now = new Date().toISOString();
  const full: Invoice = {
    ...invoice,
    id: `inv-${++invoiceCounter}-${Date.now()}`,
    createdAt: now,
    updatedAt: now,
  };

  const existing = inMemoryInvoices.get(invoice.userId) ?? [];
  inMemoryInvoices.set(invoice.userId, [full, ...existing]);

  if (isDatabaseConfigured()) {
    try {
      const supabase = isServiceKeyConfigured() ? createServiceClient() : await createClient();
      await supabase.from('invoices').upsert(
        {
          user_id: full.userId,
          subscription_id: full.subscriptionId,
          provider: full.provider,
          provider_invoice_id: full.providerInvoiceId,
          amount_due_usd: full.amountDueUsd,
          amount_paid_usd: full.amountPaidUsd,
          currency: full.currency,
          status: full.status,
          invoice_url: full.invoiceUrl,
          period_start: full.periodStart,
          period_end: full.periodEnd,
          paid_at: full.paidAt,
          metadata: full.metadata as any,
          updated_at: now,
        },
        { onConflict: 'provider_invoice_id' }
      );
    } catch (err) {
      logger.warn('Failed to persist invoice to db', err instanceof Error ? { error: err.message } : undefined);
    }
  }

  return full;
}

export function resetInvoiceStore(): void {
  inMemoryInvoices.clear();
  invoiceCounter = 0;
}

function mapDbInvoice(row: Record<string, unknown>): Invoice {
  return {
    id: row['id'] as string,
    userId: row['user_id'] as string,
    subscriptionId: (row['subscription_id'] as string) ?? null,
    provider: (row['provider'] as string) ?? 'stripe',
    providerInvoiceId: (row['provider_invoice_id'] as string) ?? null,
    amountDueUsd: Number(row['amount_due_usd']) ?? 0,
    amountPaidUsd: Number(row['amount_paid_usd']) ?? 0,
    currency: (row['currency'] as string) ?? 'usd',
    status: (row['status'] as InvoiceStatus) ?? 'draft',
    invoiceUrl: (row['invoice_url'] as string) ?? null,
    periodStart: (row['period_start'] as string) ?? null,
    periodEnd: (row['period_end'] as string) ?? null,
    paidAt: (row['paid_at'] as string) ?? null,
    metadata: (row['metadata'] as Record<string, unknown>) ?? {},
    createdAt: row['created_at'] as string,
    updatedAt: row['updated_at'] as string,
  };
}
