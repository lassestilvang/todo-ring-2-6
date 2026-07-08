/**
 * Dynamic Template Engine with Zod Validation
 * Enables creation and validation of customizable task templates
 */

import { z } from 'zod';
import { templateRepository } from '@/lib/repositories';

// Define template schema and validation rules
const TemplateSchema = z.object({
  name: z.string().min(3).max(50),
  description: z.string().min(1),
  priority: z.enum(['critical', 'high', 'medium', 'default']),
  tags: z.array(z.string()).min(1),
  fields: z.array(z.any()).refine(
    (fields) => fields.some(field => {
      const type = field.type;
      return ['text', 'number', 'date', 'select', 'checkbox', 'textarea'].includes(type);
    }),
    { message: 'Template must contain at least one valid field type' }
  ),
  createdAt: z.preprocess((arg) => new Date(arg as string), z.instanceof(Date)),
  isPublic: z.boolean().default(false),
  icon: z.string().optional(),
  color: z.string().optional(),
});

/** TypeScript type for TemplateSchema */
export type TemplateSchema = z.infer<typeof TemplateSchema>;

export class TemplateEngine {
  static async createTemplate(templateData: Partial<TestTemplate>): Promise<{
    templateId: string;
    validationResult: z.ZodSuccess<TestTemplate> | z.ZodError;
  }> {
    const result = TemplateSchema.safeParse(templateData);

    if (result.success) {
      // Save to repository
      const template = await this.templateRepository.create({
        ...result.data,
        id: crypto.randomUUID(),
      });

      return { templateId: template.id, validationResult: result };
    }

    return { validationResult: result };
  }

  static async getTemplate(id: string): Promise<TestTemplate> {
    const template = await this.templateRepository.findById(id);
    if (!template) {
      throw new Error('Template not found');
    }
    return template;
  }

  static async searchTemplates(query: string): Promise<Template[]> {
    const templates = await this.templateRepository.findAll();
    return templates.filter(template =>
      this.searchFields(template, query)
    );
  }

  private static searchFields(template: TestTemplate, query: string): boolean {
    const lowerQuery = query.toLowerCase();
    return (
      template.name.toLowerCase().includes(lowerQuery) ||
      template.description.toLowerCase().includes(lowerQuery) ||
      template.tags.some(tag => tag.toLowerCase().includes(lowerQuery))
    );
  }

  // Create basic template types
  static readonly TEMPLATE_TYPES = ['task', 'milestone', 'goal'] as const;