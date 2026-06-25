/**
 * Deeply serializes data returned from Prisma to be safe for Next.js Client Components.
 * Converts Date objects to ISO strings and Decimal objects to numbers.
 */
export function serializePrisma<T>(data: T): any {
  if (data === null || data === undefined) {
    return data;
  }

  // Handle Date
  if (data instanceof Date) {
    return data.toISOString();
  }

  // Handle Decimal (decimal.js objects returned by Prisma)
  if (
    typeof data === "object" &&
    data !== null &&
    typeof (data as any).toNumber === "function"
  ) {
    return (data as any).toNumber();
  }

  // Handle Array
  if (Array.isArray(data)) {
    return data.map(serializePrisma);
  }

  // Handle Object
  if (typeof data === "object") {
    const serialized: Record<string, any> = {};
    for (const key of Object.keys(data)) {
      serialized[key] = serializePrisma((data as any)[key]);
    }
    return serialized;
  }

  return data;
}
