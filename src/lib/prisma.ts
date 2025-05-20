// src/lib/prisma.ts
import { PrismaClient } from '@prisma/client';

// Declare a global variable to store the PrismaClient instance in development
// This prevents multiple instances of PrismaClient being created during hot-reloading
declare global {
  var prisma: PrismaClient | undefined;
}

let prisma: PrismaClient;

if (process.env.NODE_ENV === 'production') {
  prisma = new PrismaClient();
} else {
  // In development, use the global variable if it exists, otherwise create a new instance
  if (!global.prisma) {
    global.prisma = new PrismaClient();
  }
  prisma = global.prisma;
}

export default prisma;
