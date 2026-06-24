import { NextRequest } from 'next/server';
import { ensureDbInitialized } from '@/lib/db-init';
import { jsonSuccess, jsonError, jsonValidationError } from '@/lib/api-response';
import { EmailTemplateSchema, type EmailTemplateConfig } from '@/lib/validations';
import { getDb } from '@/db/operations';

ensureDbInitialized();

interface EmailTemplate {
  id: string;
  name: string;
  type: 'reminder' | 'welcome' | 'password-reset' | 'notification';
  subject: string;
  html: string;
  text: string;
  config: EmailTemplateConfig;
  createdBy?: string;
  createdAt: string;
  updatedAt: string;
}

// Default templates
const DEFAULT_TEMPLATES: Omit<EmailTemplate, 'id' | 'createdAt' | 'updatedAt'>[] = [
  {
    name: 'Task Reminder',
    type: 'reminder',
    subject: 'Task Reminder: {{title}}',
    html: `<div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto;">
      <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 20px; border-radius: 8px 8px 0 0;">
        <h1 style="color: white; margin: 0; font-size: 24px;">Task Reminder</h1>
      </div>
      <div style="background: white; padding: 30px; border-radius: 0 0 8px 8px; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
        <h2 style="margin-top: 0; color: #333;">{{title}}</h2>
        {{#if description}}<p style="color: #666; line-height: 1.6;">{{description}}</p>{{/if}}
        <div style="margin: 20px 0; padding: 15px; background: #f8fafc; border-radius: 6px;">
          {{#if priority}}<span style="display: inline-block; padding: 4px 12px; border-radius: 12px; font-size: 12px; font-weight: 600; color: {{priorityColor}};">{{priority}} PRIORITY</span>{{/if}}
          {{#if deadline}}<div style="margin-top: 10px; color: #666; font-size: 14px;"><strong>Deadline:</strong> {{deadline}}</div>{{/if}}
        </div>
        <p style="color: #999; font-size: 12px; margin-top: 30px;">{{footerText}}</p>
      </div>
    </div>`,
    text: `Task: {{title}}
{{#if description}}Description: {{description}}{{/if}}
Priority: {{priority}}
Deadline: {{deadline}}
{{footerText}}`,
    config: {
      brandColor: '#3b82f6',
      brandName: 'TaskPlanner',
      footerText: 'This is an automated reminder from TaskPlanner.',
    },
  },
  {
    name: 'Welcome Email',
    type: 'welcome',
    subject: 'Welcome to TaskPlanner!',
    html: `<div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto;">
      <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 20px; border-radius: 8px 8px 0 0;">
        <h1 style="color: white; margin: 0; font-size: 24px;">Welcome to TaskPlanner!</h1>
      </div>
      <div style="background: white; padding: 30px; border-radius: 0 0 8px 8px; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
        <p style="font-size: 16px; color: #333; line-height: 1.6;">Hi {{name}},</p>
        <p style="font-size: 16px; color: #333; line-height: 1.6;">Welcome to TaskPlanner! You've successfully created your account.</p>
        <div style="margin: 30px 0;">
          <a href="{{appUrl}}" style="display: inline-block; padding: 12px 24px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; text-decoration: none; border-radius: 6px; font-weight: 600; font-size: 16px;">Get Started</a>
        </div>
      </div>
    </div>`,
    text: `Hi {{name}},

Welcome to TaskPlanner! You've successfully created your account.

Get started: {{appUrl}}

This is an automated email from TaskPlanner.`,
    config: {
      brandColor: '#3b82f6',
      brandName: 'TaskPlanner',
    },
  },
];

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const type = searchParams.get('type') as 'reminder' | 'welcome' | 'password-reset' | 'notification' | null;

    const db = getDb();
    let query = 'SELECT * FROM email_templates ORDER BY type, created_at DESC';
    let params: string[] = [];

    if (type) {
      query = 'SELECT * FROM email_templates WHERE type = ? ORDER BY created_at DESC';
      params = [type];
    }

    const templates = db.prepare(query).all(...params) as EmailTemplate[];

    // If no templates exist, return defaults
    if (templates.length === 0 && (!type || type === 'reminder')) {
      return jsonSuccess({ templates: DEFAULT_TEMPLATES, isDefault: true });
    }

    return jsonSuccess({ templates, isDefault: false });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to fetch templates';
    return jsonError(message, 500, 'FETCH_ERROR');
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const validated = EmailTemplateSchema.safeParse(body);

    if (!validated.success) {
      return jsonValidationError(
        validated.error.errors.map(e => ({ path: e.path, message: e.message }))
      );
    }

    const { name, type, subject, html, text, config } = validated.data;
    const db = getDb();
    const id = crypto.randomUUID();
    const now = new Date().toISOString();

    db.prepare(
      'INSERT INTO email_templates (id, name, type, subject, html, text, config, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)'
    ).run(id, name, type, subject, html, text, JSON.stringify(config), now, now);

    return jsonSuccess(
      { id, name, type, subject, html, text, config },
      201
    );
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to create template';
    return jsonError(message, 500, 'CREATE_ERROR');
  }
}