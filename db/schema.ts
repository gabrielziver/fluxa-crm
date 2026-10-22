import { index, integer, real, sqliteTable, text } from 'drizzle-orm/sqlite-core';

export const leads = sqliteTable('leads', {
  id: text('id').primaryKey(),
  leadNumber: integer('lead_number').notNull().unique(),
  clinic: text('clinic').notNull(), location: text('location').notNull(), city: text('city').notNull(), neighborhood: text('neighborhood').notNull(),
  stage: text('stage').notNull(), contactResult: text('contact_result'), interest: text('interest'), previewAccepted: integer('preview_accepted', { mode: 'boolean' }).notNull().default(false), paid: integer('paid', { mode: 'boolean' }).notNull().default(false),
  score: integer('score').notNull(), scoreBreakdown: text('score_breakdown').notNull(), className: text('class_name').notNull(), siteIssue: text('site_issue').notNull(), siteProblem: text('site_problem').notNull(),
  instagram: text('instagram').notNull(), rating: real('rating').notNull(), reviewCount: integer('review_count').notNull(), services: text('services').notNull(), phone: text('phone').notNull(), whatsappUrl: text('whatsapp_url').notNull(),
  rationale: text('rationale').notNull(), verificationNotes: text('verification_notes').notNull(), specificOpening: text('specific_opening').notNull(), sourcesJson: text('sources_json').notNull(),
  firstContactAt: text('first_contact_at'), repliedAt: text('replied_at'), previewAcceptedAt: text('preview_accepted_at'), previewSentAt: text('preview_sent_at'), proposalAt: text('proposal_at'), closedAt: text('closed_at'), paidAt: text('paid_at'), deliveredAt: text('delivered_at'), nextFollowUpAt: text('next_follow_up_at'), lastContactAt: text('last_contact_at'),
  closedValue: real('closed_value'), createdAt: text('created_at').notNull(), updatedAt: text('updated_at').notNull(),
}, (t) => [index('leads_stage_idx').on(t.stage), index('leads_city_idx').on(t.city), index('leads_class_idx').on(t.className), index('leads_followup_idx').on(t.nextFollowUpAt)]);

export const leadEvents = sqliteTable('lead_events', {
  id: integer('id').primaryKey({ autoIncrement: true }), leadId: text('lead_id').notNull().references(() => leads.id), eventType: text('event_type').notNull(), fromStage: text('from_stage'), toStage: text('to_stage'), metadataJson: text('metadata_json'), createdAt: text('created_at').notNull(),
}, (t) => [index('events_lead_time_idx').on(t.leadId, t.createdAt)]);

export const leadNotes = sqliteTable('lead_notes', {
  id: integer('id').primaryKey({ autoIncrement: true }), leadId: text('lead_id').notNull().references(() => leads.id), body: text('body').notNull(), createdAt: text('created_at').notNull(),
}, (t) => [index('notes_lead_time_idx').on(t.leadId, t.createdAt)]);

export const clients = sqliteTable('clients', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  status: text('status').notNull().default('active'),
  category: text('category').notNull().default('Outros'),
  monthlyRevenue: real('monthly_revenue').notNull().default(0),
  receivable: real('receivable').notNull().default(0),
  expenses: real('expenses').notNull().default(0),
  totalRevenue: real('total_revenue').notNull().default(0),
  referenceMonth: text('reference_month').notNull(),
  servicesJson: text('services_json').notNull().default('[]'),
  createdAt: text('created_at').notNull(),
  updatedAt: text('updated_at').notNull(),
}, (t) => [index('clients_status_idx').on(t.status), index('clients_month_idx').on(t.referenceMonth)]);
