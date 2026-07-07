/**
 * Operational Transform for Real-time Collaborative Editing
 * Based on ShareJS/Quill delta format
 */

export interface Operation {
  type: 'insert' | 'delete' | 'retain';
  position: number;
  value?: string;
  length?: number;
  id: string; // Unique operation ID
  clientId: string;
  timestamp: number;
}

export interface TransformResult {
  ops: Operation[];
  clientId: string;
  baseRevision: number;
  revision: number;
}

/**
 * Simple operational transform implementation
 * Handles concurrent edits to the same document
 */
export class OperationalTransform {
  private revisions: Map<string, number> = new Map();

  /**
   * Transform operation against another operation
   */
  transform(op1: Operation, op2: Operation): [Operation, Operation] {
    // If operations don't affect each other, no transformation needed
    if (this.operationsDontConflict(op1, op2)) {
      return [op1, op2];
    }

    // Handle insert vs insert at same position
    if (op1.type === 'insert' && op2.type === 'insert' && op1.position === op2.position) {
      // Give priority to client with lower ID (deterministic tie-breaking)
      if (op1.clientId < op2.clientId) {
        return [{ ...op2, position: op2.position + (op1.value?.length || 0) }, op1];
      }
      return [op1, { ...op2, position: op2.position + (op2.value?.length || 0) }];
    }

    // Handle insert vs delete
    if (op1.type === 'insert' && op2.type === 'delete') {
      if (op1.position <= op2.position) {
        return [op1, { ...op2, position: op2.position + (op1.value?.length || 0) }];
      } else if (op1.position >= op2.position + (op2.length || 0)) {
        return [{ ...op1, position: op1.position - (op2.length || 0) }, op2];
      } else {
        // Insert falls within delete range - skip the insert
        return [op1, op2];
      }
    }

    // Handle delete vs insert
    if (op1.type === 'delete' && op2.type === 'insert') {
      if (op2.position <= op1.position) {
        return [{ ...op1, position: op1.position + (op2.value?.length || 0) }, op2];
      } else if (op2.position >= op1.position + (op1.length || 0)) {
        return [op1, { ...op2, position: op2.position - (op1.length || 0) }];
      }
      return [op1, op2];
    }

    // Handle delete vs delete
    if (op1.type === 'delete' && op2.type === 'delete') {
      const op1End = op1.position + (op1.length || 0);
      const op2End = op2.position + (op2.length || 0);

      if (op1.position === op2.position) {
        // Same start - combine deletions
        const mergedLength = Math.max(op1.length || 0, op2.length || 0);
        return [{ ...op1, length: mergedLength }, op2];
      }

      if (op1.position < op2.position) {
        if (op1End >= op2.position) {
          // Overlapping - extend first deletion
          return [{ ...op1, length: op1.length + (op2End - op2.position) }, op2];
        }
        return [op1, { ...op2, position: op2.position - (op1.length || 0) }];
      }
      if (op1.position > op2.position) {
        if (op2End >= op1.position) {
          return [op1, { ...op2, length: op2.length + (op1End - op1.position) }];
        }
        return [{ ...op1, position: op1.position - (op2.length || 0) }, op2];
      }
    }

    return [op1, op2];
  }

  /**
   * Check if two operations conflict
   */
  private operationsDontConflict(op1: Operation, op2: Operation): boolean {
    if (op1.type === 'retain' || op2.type === 'retain') return true;

    const op1End = op1.position + (op1.length || 0);
    const op2End = op2.position + (op2.length || 0);

    return op1End <= op2.position || op2End <= op1.position;
  }

  /**
   * Apply operation to a document
   */
  apply(doc: string, op: Operation): string {
    switch (op.type) {
      case 'insert':
        if (op.value !== undefined) {
          return doc.slice(0, op.position) + op.value + doc.slice(op.position);
        }
        return doc;
      case 'delete':
        return doc.slice(0, op.position) + doc.slice(op.position + (op.length || 0));
      case 'retain':
        return doc;
      default:
        return doc;
    }
  }

  /**
   * Get revision number for a document
   */
  getRevision(docId: string): number {
    return this.revisions.get(docId) || 0;
  }

  /**
   * Increment revision
   */
  incrementRevision(docId: string): number {
    const current = this.getRevision(docId);
    this.revisions.set(docId, current + 1);
    return current + 1;
  }

  /**
   * Transform array of operations against array of other operations
   */
  transformArray(ops1: Operation[], ops2: Operation[]): Operation[] {
    const result: Operation[] = [];

    for (const op1 of ops1) {
      for (const op2 of ops2) {
        const [transformed] = this.transform(op1, op2);
        if (transformed.type !== 'retain') {
          result.push(transformed);
        }
      }
    }

    return result;
  }
}

// Singleton instance
let otInstance: OperationalTransform | null = null;

export function getOperationalTransform(): OperationalTransform {
  if (!otInstance) {
    otInstance = new OperationalTransform();
  }
  return otInstance;
}