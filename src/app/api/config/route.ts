// src/app/api/config/route.ts
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/auth'; // Assuming your auth options are here
import prisma from '@/lib/prisma'; // Assuming your Prisma client is here

/**
 * GET /api/config
 * Retrieves all application configuration settings.
 * Requires authentication.
 */
export async function GET() {
  const session = await getServerSession(authOptions);

  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    // Fetch all configuration entries from the database
    const configEntries = await prisma.appConfiguration.findMany();

    // Transform the array of entries into a key-value object for easier consumption
    const configObject: Record<string, number> = configEntries.reduce((acc, entry) => {
      acc[entry.key] = entry.value;
      return acc;
    }, {});

    return NextResponse.json(configObject, { status: 200 });
  } catch (error) {
    console.error('API Error fetching app configuration:', error);
    return NextResponse.json({ error: 'Failed to fetch app configuration' }, { status: 500 });
  }
}

/**
 * PUT /api/config
 * Updates multiple application configuration settings.
 * Expects a JSON array of { key: string, value: number, description?: string } objects.
 * Requires authentication.
 */
export async function PUT(request: Request) {
  const session = await getServerSession(authOptions);

  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await request.json();

    // Basic validation: Ensure body is an array
    if (!Array.isArray(body)) {
      return NextResponse.json({ error: 'Request body must be an array of configuration objects.' }, { status: 400 });
    }

    const updatedConfigs = [];
    for (const item of body) {
      const { key, value, description } = item;

      // Validate each item in the array
      if (typeof key !== 'string' || typeof value !== 'number' || (description !== undefined && typeof description !== 'string')) {
        return NextResponse.json({ error: `Invalid configuration item format: ${JSON.stringify(item)}` }, { status: 400 });
      }

      // Use upsert to create if not exists, or update if exists
      const updatedConfig = await prisma.appConfiguration.upsert({
        where: { key: key },
        update: { value: value, description: description },
        create: { key: key, value: value, description: description },
      });
      updatedConfigs.push(updatedConfig);
    }

    return NextResponse.json({ message: 'App configuration updated successfully', updatedConfigs }, { status: 200 });
  } catch (error) {
    console.error('API Error updating app configuration:', error);
    return NextResponse.json({ error: 'Failed to update app configuration' }, { status: 500 });
  }
}
